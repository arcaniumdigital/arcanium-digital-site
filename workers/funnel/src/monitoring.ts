import { constantTimeEqual, opaqueId } from "./crypto";
import { json } from "./http";
import { openP1Incident, resolveP1Incident } from "./incidents";
import { publishOutbox, queueEnvelope } from "./outbox";
import { checkBrevo, checkCalWebhook, clickSendBalance } from "./providers";

async function setHealth(env: Cloudflare.Env, component: string, healthy: boolean, detail: Record<string, unknown> = {}): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO component_health
    (component,status,last_success_at,last_failure_at,consecutive_failures,safe_detail_json,updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(component) DO UPDATE SET status=excluded.status,
      last_success_at=CASE WHEN excluded.status='healthy' THEN excluded.last_success_at ELSE component_health.last_success_at END,
      last_failure_at=CASE WHEN excluded.status='unhealthy' THEN excluded.last_failure_at ELSE component_health.last_failure_at END,
      consecutive_failures=CASE WHEN excluded.status='healthy' THEN 0 ELSE component_health.consecutive_failures+1 END,
      safe_detail_json=excluded.safe_detail_json,updated_at=excluded.updated_at`)
    .bind(component, healthy ? "healthy" : "unhealthy", healthy ? now : null, healthy ? null : now, healthy ? 0 : 1, JSON.stringify(detail), now).run();
}

async function runCanary(env: Cloudflare.Env): Promise<void> {
  const now = new Date();
  const canaryId = opaqueId("canary");
  const jobId = opaqueId("job");
  const correlationId = opaqueId("corr");
  await env.DB.batch([
    env.DB.prepare("INSERT INTO canary_runs (id,status,created_at,queued_at,expires_at) VALUES (?,'QUEUED',?,?,?)")
      .bind(canaryId, now.toISOString(), now.toISOString(), new Date(now.getTime() + 2 * 60_000).toISOString()),
    env.DB.prepare("INSERT INTO provider_jobs (id,action_type,idempotency_key,safe_payload_json,created_at,updated_at) VALUES (?,'SYNTHETIC_CANARY',?,?,?,?)")
      .bind(jobId, canaryId, JSON.stringify({ canaryId }), now.toISOString(), now.toISOString()),
    env.DB.prepare("INSERT INTO outbox (id,aggregate_type,aggregate_id,event_type,payload_json,created_at) VALUES (?,'canary',?,'QUEUE_JOB',?,?)")
      .bind(opaqueId("outbox"), canaryId, queueEnvelope(jobId, correlationId), now.toISOString()),
    env.DB.prepare("INSERT INTO component_health (component,status,last_success_at,consecutive_failures,updated_at) VALUES ('worker','healthy',?,0,?) ON CONFLICT(component) DO UPDATE SET status='healthy',last_success_at=excluded.last_success_at,consecutive_failures=0,updated_at=excluded.updated_at")
      .bind(now.toISOString(), now.toISOString()),
    env.DB.prepare("INSERT INTO component_health (component,status,last_success_at,consecutive_failures,updated_at) VALUES ('database','healthy',?,0,?) ON CONFLICT(component) DO UPDATE SET status='healthy',last_success_at=excluded.last_success_at,consecutive_failures=0,updated_at=excluded.updated_at")
      .bind(now.toISOString(), now.toISOString()),
  ]);
  await publishOutbox(env);
}

async function inspectStaleness(env: Cloudflare.Env): Promise<void> {
  const now = new Date().toISOString();
  const expired = await env.DB.prepare("SELECT COUNT(*) AS count FROM canary_runs WHERE status NOT IN ('COMPLETED','EXPIRED') AND expires_at < ?")
    .bind(now).first<{ count: number }>();
  if (Number(expired?.count ?? 0) > 0) {
    await env.DB.prepare("UPDATE canary_runs SET status='EXPIRED' WHERE status NOT IN ('COMPLETED','EXPIRED') AND expires_at < ?").bind(now).run();
    await setHealth(env, "queue-canary", false, { expired: Number(expired?.count ?? 0) });
    await openP1Incident(env, { key: "QUEUE_CANARY_STALE", component: "queue", summary: "Synthetic D1 and Queue canary exceeded two minutes", notify: true });
  } else await resolveP1Incident(env, "QUEUE_CANARY_STALE");
  const threshold = new Date(Date.now() - Number(env.STALE_JOB_THRESHOLD_MINUTES || 15) * 60_000).toISOString();
  const stale = await env.DB.prepare("SELECT COUNT(*) AS count FROM message_jobs WHERE status IN ('PENDING','QUEUED','RETRYING') AND due_at < ?")
    .bind(threshold).first<{ count: number }>();
  if (Number(stale?.count ?? 0) > 0) await openP1Incident(env, { key: "STALE_MESSAGE_JOBS", component: "queue", summary: "One or more real message jobs exceeded the stale threshold", notify: true });
  else await resolveP1Incident(env, "STALE_MESSAGE_JOBS");
  await env.DB.prepare("DELETE FROM abuse_windows WHERE expires_at < ?").bind(now).run();
  await publishOutbox(env);
}

async function providerChecks(env: Cloudflare.Env): Promise<void> {
  const checks: Array<[string, () => Promise<Record<string, unknown> | void>]> = [
    ["brevo", async () => { await checkBrevo(env); }],
    ["clicksend", async () => {
      const balance = await clickSendBalance(env);
      if (balance < Number(env.CLICKSEND_MINIMUM_BALANCE_AUD)) throw new Error("BALANCE_BELOW_RESERVE");
      return { balanceAud: balance };
    }],
    ["calWebhookConfig", async () => { await checkCalWebhook(env); }],
    ["publicLinks", async () => {
      const [booking, brochure] = await Promise.all([
        fetch(env.BOOKING_LINK_BASE_URL, { redirect: "follow", signal: AbortSignal.timeout(10_000) }),
        fetch(env.BROCHURE_URL, { redirect: "follow", signal: AbortSignal.timeout(10_000) }),
      ]);
      if (!booking.ok || !brochure.ok) throw new Error("PUBLIC_LINK_CHECK_FAILED");
      return { bookingStatus: booking.status, brochureStatus: brochure.status };
    }],
  ];
  for (const [component, check] of checks) {
    try {
      await setHealth(env, component, true, await check() ?? {});
      await resolveP1Incident(env, `PROVIDER_CHECK:${component}`);
    } catch {
      await setHealth(env, component, false);
      await openP1Incident(env, { key: `PROVIDER_CHECK:${component}`, component, summary: `${component} configuration or authentication check failed`, notify: true });
    }
  }
}

async function enqueueDailyDigest(env: Cloudflare.Env): Promise<void> {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60_000);
  const scalar = async (sql: string, ...bindings: unknown[]) => Number((await env.DB.prepare(sql).bind(...bindings).first<{ count: number }>())?.count ?? 0);
  const between = [start.toISOString(), end.toISOString()];
  const leads = await scalar("SELECT COUNT(*) count FROM leads WHERE created_at >= ? AND created_at < ?", ...between);
  const bookings = await scalar("SELECT COUNT(*) count FROM bookings WHERE created_at >= ? AND created_at < ?", ...between);
  const messageCount = (messageType: string) => scalar("SELECT COUNT(*) count FROM message_jobs WHERE sent_at >= ? AND sent_at < ? AND message_type=? AND status IN ('ACCEPTED','DELIVERED')", ...between, messageType);
  const attributed = (messageType: string) => scalar("SELECT COUNT(*) count FROM bookings WHERE created_at >= ? AND created_at < ? AND attributed_message_type=?", ...between, messageType);
  const staleThreshold = new Date(end.getTime() - Number(env.STALE_JOB_THRESHOLD_MINUTES || 15) * 60_000).toISOString();
  const payload = {
    periodStart: between[0],
    periodEnd: between[1],
    canonicalLeads: leads,
    successfulRedirects: await scalar("SELECT COUNT(*) count FROM funnel_events WHERE event_at >= ? AND event_at < ? AND event_type='VENDOR_AUDIT_VIEWED'", ...between),
    immediateSmsAccepted: await scalar("SELECT COUNT(*) count FROM message_jobs WHERE sent_at >= ? AND sent_at < ? AND message_type='PREBOOK_INSTANT_V3' AND status IN ('ACCEPTED','DELIVERED')", ...between),
    immediateSmsDelivered: await scalar("SELECT COUNT(*) count FROM message_jobs WHERE delivered_at >= ? AND delivered_at < ? AND message_type='PREBOOK_INSTANT_V3' AND status='DELIVERED'", ...between),
    immediateSmsFailed: await scalar("SELECT COUNT(*) count FROM message_jobs WHERE updated_at >= ? AND updated_at < ? AND message_type='PREBOOK_INSTANT_V3' AND status='FAILED_PERMANENT'", ...between),
    prebook10mSent: await messageCount("PREBOOK_10M_V3"),
    prebook24hSent: await messageCount("PREBOOK_24H_V3"),
    prebook7dSent: await messageCount("PREBOOK_7D_V3"),
    bookings,
    bookingConversionRate: leads ? bookings / leads : 0,
    bookedAfterImmediate: await attributed("PREBOOK_INSTANT_V3"),
    bookedAfter10m: await attributed("PREBOOK_10M_V3"),
    bookedAfter24h: await attributed("PREBOOK_24H_V3"),
    bookedAfter7d: await attributed("PREBOOK_7D_V3"),
    reschedules: await scalar("SELECT COUNT(*) count FROM funnel_events WHERE event_at >= ? AND event_at < ? AND event_type='BOOKING_RESCHEDULED'", ...between),
    cancellations: await scalar("SELECT COUNT(*) count FROM bookings WHERE cancelled_at >= ? AND cancelled_at < ?", ...between),
    completedCalls: await scalar("SELECT COUNT(*) count FROM bookings WHERE completed_at >= ? AND completed_at < ? AND status='COMPLETED'", ...between),
    noShows: await scalar("SELECT COUNT(*) count FROM bookings WHERE updated_at >= ? AND updated_at < ? AND status='NO_SHOW'", ...between),
    replies: await scalar("SELECT COUNT(*) count FROM inbound_messages WHERE received_at >= ? AND received_at < ?", ...between),
    stops: await scalar("SELECT COUNT(*) count FROM inbound_messages WHERE received_at >= ? AND received_at < ? AND normalised_intent='STOP'", ...between),
    unmatchedWebhooks: await scalar("SELECT COUNT(*) count FROM funnel_incidents WHERE first_seen_at >= ? AND first_seen_at < ? AND incident_key LIKE '%UNMATCHED%'", ...between),
    staleJobs: await scalar("SELECT COUNT(*) count FROM message_jobs WHERE status IN ('PENDING','QUEUED','RETRYING') AND due_at < ?", staleThreshold),
    openIncidents: await scalar("SELECT COUNT(*) count FROM funnel_incidents WHERE status='OPEN'"),
    upcomingCalls: await scalar("SELECT COUNT(*) count FROM bookings WHERE status IN ('BOOKED','RESCHEDULED') AND start_at_utc >= ? AND start_at_utc < ?", end.toISOString(), new Date(end.getTime() + 24 * 60 * 60_000).toISOString()),
    lastSuccessfulCanaryAt: (await env.DB.prepare("SELECT MAX(completed_at) value FROM canary_runs WHERE status='COMPLETED'").first<{ value: string | null }>())?.value ?? null,
  };
  const jobId = opaqueId("job");
  const now = end.toISOString();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO provider_jobs (id,action_type,idempotency_key,safe_payload_json,created_at,updated_at) VALUES (?,'DAILY_DIGEST',?,?,?,?)")
      .bind(jobId, `daily-digest:${now.slice(0, 10)}`, JSON.stringify(payload), now, now),
    env.DB.prepare("INSERT INTO outbox (id,aggregate_type,aggregate_id,event_type,payload_json,created_at) VALUES (?,'system',?,'QUEUE_JOB',?,?)")
      .bind(opaqueId("outbox"), now.slice(0, 10), queueEnvelope(jobId, opaqueId("corr")), now),
  ]);
  await publishOutbox(env);
}

export async function handleScheduled(controller: ScheduledController, env: Cloudflare.Env): Promise<void> {
  await inspectStaleness(env);
  if (controller.cron === "*/5 * * * *") await runCanary(env);
  if (controller.cron === "0 21 * * *") await providerChecks(env);
  if (controller.cron === "0 22 * * *") await enqueueDailyDigest(env);
}

export async function handleHealth(env: Cloudflare.Env, token: string): Promise<Response> {
  if (token.length < 32 || !constantTimeEqual(token, env.FUNNEL_HEALTH_READ_TOKEN)) return json({ error: "NOT_FOUND" }, { status: 404 });
  const now = Date.now();
  const health = await env.DB.prepare("SELECT component,status,last_success_at FROM component_health").all<{ component: string; status: string; last_success_at: string | null }>();
  const components = Object.fromEntries(health.results.map((row) => [row.component, row.status]));
  const last = Object.fromEntries(health.results.map((row) => [row.component, row.last_success_at]));
  const p1 = await env.DB.prepare("SELECT COUNT(*) count FROM funnel_incidents WHERE severity='P1' AND status='OPEN'").first<{ count: number }>();
  const staleJobCutoff = new Date(now - Number(env.STALE_JOB_THRESHOLD_MINUTES || 15) * 60_000).toISOString();
  const staleJobs = await env.DB.prepare("SELECT COUNT(*) count FROM message_jobs WHERE status IN ('PENDING','QUEUED','RETRYING') AND due_at < ?").bind(staleJobCutoff).first<{ count: number }>();
  const fresh = (component: string, maximumAgeMs: number) => typeof last[component] === "string" && now - Date.parse(last[component] as string) <= maximumAgeMs;
  const schema = await env.DB.prepare("SELECT safe_detail_json FROM component_health WHERE component='schema'").first<{ safe_detail_json: string | null }>();
  let schemaVersion = "";
  try { schemaVersion = String((JSON.parse(schema?.safe_detail_json ?? "{}") as { schemaVersion?: string }).schemaVersion ?? ""); } catch { schemaVersion = ""; }
  const requiredHealthy = ["brevo", "clicksend", "calWebhookConfig", "publicLinks"].every((component) => components[component] === "healthy" && fresh(component, 36 * 60 * 60_000));
  const healthy = Number(p1?.count ?? 0) === 0
    && Number(staleJobs?.count ?? 0) === 0
    && components["queue-canary"] === "healthy"
    && fresh("queue-canary", 10 * 60_000)
    && components.inngest === "healthy"
    && fresh("inngest", 45 * 60_000)
    && requiredHealthy
    && schemaVersion === env.SCHEMA_VERSION;
  return json({
    status: healthy ? "healthy" : "unhealthy",
    ...(healthy ? { marker: "FUNNEL_OK" } : {}),
    checkedAt: new Date(now).toISOString(),
    components,
    version: env.DEPLOYMENT_VERSION,
  }, { status: healthy ? 200 : 503 });
}
