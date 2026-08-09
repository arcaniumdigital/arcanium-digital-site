import { vendorAuditLeadSchema } from "./contracts";
import { opaqueId, randomToken, sha256Hex, signLeadCorrelation } from "./crypto";
import { corsHeaders, json, readBoundedBody, allowedOrigins } from "./http";
import { firstNameFromFullName, normalizeAustralianMobile, sanitizeFullName } from "./phone";
import { publishOutbox, queueEnvelope } from "./outbox";
import { verifyInternalRequest } from "./internal-auth";
import { verifiedProxyClientIp } from "./proxy-auth";

type ExistingLead = { id: string; public_id: string };

async function verifyTurnstile(env: Cloudflare.Env, token: string, clientIp: string): Promise<boolean> {
  const expectedHostnames = new Set(env.EXPECTED_TURNSTILE_HOSTNAMES.split(",").map((value) => value.trim()).filter(Boolean));
  if (expectedHostnames.size === 0) return false;
  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: clientIp === "unknown" ? "" : clientIp,
        idempotency_key: crypto.randomUUID(),
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return false;
  }
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
  return result.success === true
    && result.action === env.EXPECTED_TURNSTILE_ACTION
    && typeof result.hostname === "string"
    && expectedHostnames.has(result.hostname);
}

async function rateLimited(request: Request, env: Cloudflare.Env, clientIp: string): Promise<boolean> {
  const abuseMaterial = `${clientIp}:${request.headers.get("User-Agent") ?? "unknown"}`;
  const abuseKey = await sha256Hex(`${env.INTERNAL_API_HMAC_SECRET}:${abuseMaterial}`);
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / 900_000) * 900_000).toISOString();
  const expiresAt = new Date(now.getTime() + 30 * 60_000).toISOString();
  await env.DB.prepare(
    "INSERT INTO abuse_windows (abuse_key, window_started_at, attempt_count, expires_at) VALUES (?, ?, 1, ?) ON CONFLICT(abuse_key, window_started_at) DO UPDATE SET attempt_count = attempt_count + 1",
  ).bind(abuseKey, windowStart, expiresAt).run();
  const row = await env.DB.prepare(
    "SELECT attempt_count FROM abuse_windows WHERE abuse_key = ? AND window_started_at = ?",
  ).bind(abuseKey, windowStart).first<{ attempt_count: number }>();
  return Number(row?.attempt_count ?? 0) > 10;
}

function contextCookie(env: Cloudflare.Env, handle: string, maxAge: number): string {
  const domain = env.BOOKING_CONTEXT_COOKIE_DOMAIN ? `; Domain=${env.BOOKING_CONTEXT_COOKIE_DOMAIN}` : "";
  return `arc_vendor_audit_ctx=${handle}; HttpOnly; Secure; SameSite=Lax; Path=/vendor-audit; Max-Age=${maxAge}${domain}`;
}

export async function handleIntake(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
  const cors = corsHeaders(request, env);
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins(env).has(origin)) return json({ accepted: false, error: "FORBIDDEN" }, { status: 403, headers: cors });
  const record = async (eventType: string, reason?: string) => env.DB.prepare("INSERT INTO funnel_events (id,event_type,event_at,source,correlation_id,metadata_json) VALUES (?,?,?,'worker',?,?)")
    .bind(opaqueId("event"), eventType, new Date().toISOString(), opaqueId("corr"), JSON.stringify(reason ? { reason } : {})).run().catch(() => undefined);
  const reject = async (reason: string, status: number) => {
    await record("LEAD_REJECTED", reason);
    return json({ accepted: false, error: reason }, { status, headers: cors });
  };
  const rawBody = await readBoundedBody(request, 12_288);
  if (rawBody === null) return json({ accepted: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413, headers: cors });
  const clientIp = await verifiedProxyClientIp(request, env, rawBody);
  if (!clientIp) return json({ accepted: false, error: "INVALID_PROXY_SIGNATURE" }, { status: 403, headers: cors });
  await record("FORM_ATTEMPTED");
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) return reject("INVALID_CONTENT_TYPE", 415);
  if (await rateLimited(request, env, clientIp)) return reject("RATE_LIMITED", 429);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return reject("INVALID_JSON", 400);
  }
  const parsed = vendorAuditLeadSchema.safeParse(parsedJson);
  if (!parsed.success) return reject("INVALID_REQUEST", 400);
  const input = parsed.data;
  if (input.companyWebsiteConfirmation) return reject("INVALID_REQUEST", 400);
  const phoneE164 = normalizeAustralianMobile(input.phone);
  if (!phoneE164) return reject("INVALID_PHONE", 400);
  if (!(await verifyTurnstile(env, input.turnstileToken, clientIp))) return reject("TURNSTILE_FAILED", 403);

  const now = new Date();
  const nowIso = now.toISOString();
  const ttl = Math.max(300, Math.min(3600, Number(env.BOOKING_CONTEXT_SESSION_TTL_SECONDS) || 1800));
  const sessionHandle = randomToken(24);
  const sessionHash = await sha256Hex(sessionHandle);
  const sessionId = opaqueId("ctx");
  const expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();
  const existing = await env.DB.prepare("SELECT id, public_id FROM leads WHERE submission_id = ? LIMIT 1")
    .bind(input.submissionId).first<ExistingLead>();

  if (existing) {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM booking_context_sessions WHERE lead_id = ?").bind(existing.id),
      env.DB.prepare("INSERT INTO booking_context_sessions (id, lead_id, session_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(sessionId, existing.id, sessionHash, expiresAt, nowIso),
    ]);
    cors.append("Set-Cookie", contextCookie(env, sessionHandle, ttl));
    return json({ accepted: true, leadPublicId: existing.public_id, nextUrl: "/vendor-audit", duplicate: true }, { status: 202, headers: cors });
  }

  const leadId = opaqueId("lead");
  const publicId = opaqueId("public");
  const correlationId = opaqueId("corr");
  const messageJobId = opaqueId("msg");
  const providerJobs = [
    { id: opaqueId("job"), action: "BREVO_SYNC_LEAD", key: `${leadId}:brevo-sync` },
    { id: opaqueId("job"), action: "BREVO_INTERNAL_EMAIL", key: `${leadId}:new-lead-email` },
    { id: opaqueId("job"), action: "INNGEST_EVENT", key: `${leadId}:lead-created-event` },
  ];
  const outboxEntries = [messageJobId, ...providerJobs.map((job) => job.id)].map((jobId) => ({ id: opaqueId("outbox"), jobId }));
  const fullName = sanitizeFullName(input.fullName);

  const statements: D1PreparedStatement[] = [
    env.DB.prepare(`INSERT INTO leads (
      id, public_id, submission_id, full_name, first_name, phone_e164, source_page, referrer,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content, fbclid_hash, gclid_hash,
      marketing_sms_consent, consent_version, consent_text, privacy_notice_version,
      consent_recorded_at, lifecycle_state, booking_state, journey_state, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', 'NOT_BOOKED', 'ACTIVE', ?, ?)`)
      .bind(
        leadId, publicId, input.submissionId, fullName, firstNameFromFullName(fullName), phoneE164,
        input.sourcePage, input.referrer ?? null, input.utmSource ?? null, input.utmMedium ?? null,
        input.utmCampaign ?? null, input.utmTerm ?? null, input.utmContent ?? null,
        input.fbclid ? await sha256Hex(input.fbclid) : null,
        input.gclid ? await sha256Hex(input.gclid) : null,
        input.marketingSmsConsent ? 1 : 0, input.consentVersion, input.consentText,
        input.privacyNoticeVersion, nowIso, nowIso, nowIso,
      ),
    env.DB.prepare("INSERT INTO booking_context_sessions (id, lead_id, session_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(sessionId, leadId, sessionHash, expiresAt, nowIso),
    env.DB.prepare("INSERT INTO message_jobs (id, lead_id, message_type, template_version, due_at, status, created_at, updated_at) VALUES (?, ?, 'PREBOOK_INSTANT_V3', '3.0.0', ?, 'QUEUED', ?, ?)")
      .bind(messageJobId, leadId, nowIso, nowIso, nowIso),
    env.DB.prepare("INSERT INTO lead_journeys (id, lead_id, journey_type, status, next_due_at, started_at, updated_at) VALUES (?, ?, 'PREBOOKING', 'ACTIVE', ?, ?, ?)")
      .bind(opaqueId("journey"), leadId, new Date(now.getTime() + 10 * 60_000).toISOString(), nowIso, nowIso),
    env.DB.prepare("INSERT INTO funnel_events (id, lead_id, event_type, event_at, source, correlation_id, metadata_json) VALUES (?, ?, 'LEAD_ACCEPTED', ?, 'worker', ?, ?)")
      .bind(opaqueId("event"), leadId, nowIso, correlationId, JSON.stringify({ schemaVersion: "2.0" })),
  ];
  for (const job of providerJobs) {
    const payload = job.action === "INNGEST_EVENT"
      ? { eventName: "arcanium/vendor-audit.lead-created", submittedAt: nowIso, correlationId }
      : { correlationId };
    statements.push(env.DB.prepare("INSERT INTO provider_jobs (id, lead_id, action_type, idempotency_key, safe_payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(job.id, leadId, job.action, job.key, JSON.stringify(payload), nowIso, nowIso));
  }
  for (const entry of outboxEntries) {
    statements.push(env.DB.prepare("INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload_json, created_at) VALUES (?, 'lead', ?, 'QUEUE_JOB', ?, ?)")
      .bind(entry.id, leadId, queueEnvelope(entry.jobId, correlationId), nowIso));
  }

  try {
    await env.DB.batch(statements);
  } catch {
    return reject("PERSISTENCE_FAILED", 503);
  }
  ctx.waitUntil(publishOutbox(env));
  cors.append("Set-Cookie", contextCookie(env, sessionHandle, ttl));
  return json({ accepted: true, leadPublicId: publicId, nextUrl: "/vendor-audit" }, { status: 202, headers: cors });
}

export async function handleContext(request: Request, env: Cloudflare.Env): Promise<Response> {
  if (!(await verifyInternalRequest(request, env, ""))) return json({ error: "UNAUTHORIZED" }, { status: 401 });
  const cookie = request.headers.get("Cookie") ?? "";
  const handle = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("arc_vendor_audit_ctx="))?.slice("arc_vendor_audit_ctx=".length) ?? "";
  if (!/^[A-Za-z0-9_-]{32,}$/.test(handle)) return json({ context: null });
  const sessionHash = await sha256Hex(handle);
  const row = await env.DB.prepare(`SELECT s.id AS session_id, s.expires_at, l.public_id, l.full_name, l.phone_e164
    FROM booking_context_sessions s JOIN leads l ON l.id = s.lead_id
    WHERE s.session_hash = ? AND s.expires_at > ? LIMIT 1`)
    .bind(sessionHash, new Date().toISOString())
    .first<{ session_id: string; expires_at: string; public_id: string; full_name: string; phone_e164: string }>();
  if (!row) return json({ context: null });
  await env.DB.prepare("UPDATE booking_context_sessions SET last_used_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), row.session_id).run();
  const expiresEpoch = Math.floor(Date.parse(row.expires_at) / 1000);
  return json({ context: {
    fullName: row.full_name,
    phoneE164: row.phone_e164,
    signedLeadCorrelation: await signLeadCorrelation(env.BOOKING_CONTEXT_HMAC_SECRET, row.public_id, expiresEpoch),
  } });
}
