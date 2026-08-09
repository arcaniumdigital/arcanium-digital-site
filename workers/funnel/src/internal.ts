import { z } from "zod";
import type { LeadRow, MessageJobRow, MessageType } from "./contracts";
import { opaqueId } from "./crypto";
import { json, readBoundedBody } from "./http";
import { verifyInternalRequest } from "./internal-auth";
import { publishOutbox, queueEnvelope } from "./outbox";
import { withinSendWindow } from "./time";

const dueRequestSchema = z.object({
  leadId: z.string().min(1).max(100),
  messageType: z.enum([
    "PREBOOK_10M_V3",
    "PREBOOK_24H_V3",
    "PREBOOK_7D_V3",
    "BOOKING_REMINDER_24H_V3",
    "BOOKING_REMINDER_3H_V3",
    "BOOKING_REMINDER_EARLY_V3",
  ]),
  bookingUid: z.string().max(100).optional(),
  bookingRevision: z.number().int().positive().optional(),
  completeJourney: z.boolean().optional(),
});

function skipReason(lead: LeadRow, messageType: MessageType, immediate: MessageJobRow | null, env: Cloudflare.Env): string | null {
  if (lead.suppression_state !== "NONE") return "SUPPRESSED";
  if (lead.manual_pause) return "MANUAL_PAUSE";
  if (lead.replied_at) return "REPLIED";
  if (!lead.marketing_sms_consent) return "CONSENT_MISSING";
  if (messageType.startsWith("PREBOOK_")) {
    if (lead.booking_state !== "NOT_BOOKED") return "ALREADY_BOOKED";
    if (!immediate || !["ACCEPTED", "DELIVERED"].includes(immediate.status)) return "IMMEDIATE_NOT_ACCEPTED";
    if (!withinSendWindow(new Date(), env.BUSINESS_TIMEZONE, Number(env.SMS_ALLOWED_START_HOUR), Number(env.SMS_ALLOWED_END_HOUR))) return "QUIET_HOURS";
  } else if (!['BOOKED', 'RESCHEDULED'].includes(lead.booking_state)) {
    return "BOOKING_NOT_ACTIVE";
  }
  return null;
}

export async function handleDueMessage(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
  const raw = await readBoundedBody(request, 4096);
  if (raw === null) return json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  if (!(await verifyInternalRequest(request, env, raw))) return json({ error: "UNAUTHORIZED" }, { status: 401 });
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return json({ error: "INVALID_JSON" }, { status: 400 }); }
  const parsed = dueRequestSchema.safeParse(value);
  if (!parsed.success) return json({ error: "INVALID_REQUEST" }, { status: 400 });
  const input = parsed.data;
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(input.leadId).first<LeadRow>();
  if (!lead) return json({ accepted: true, skipped: "LEAD_NOT_FOUND" });
  const immediate = await env.DB.prepare("SELECT * FROM message_jobs WHERE lead_id = ? AND message_type = 'PREBOOK_INSTANT_V3' ORDER BY created_at DESC LIMIT 1")
    .bind(lead.id).first<MessageJobRow>();
  const reason = skipReason(lead, input.messageType, immediate, env);
  const now = new Date().toISOString();
  if (reason) {
    await env.DB.prepare("INSERT INTO funnel_events (id, lead_id, booking_uid, event_type, event_at, source, correlation_id, message_type, metadata_json) VALUES (?, ?, ?, 'MESSAGE_SKIPPED', ?, 'inngest_due', ?, ?, ?)")
      .bind(opaqueId("event"), lead.id, input.bookingUid ?? null, now, opaqueId("corr"), input.messageType, JSON.stringify({ reason })).run();
    return json({ accepted: true, skipped: reason });
  }
  if (input.bookingUid) {
    const booking = await env.DB.prepare("SELECT revision, status FROM bookings WHERE cal_booking_uid = ? LIMIT 1")
      .bind(input.bookingUid).first<{ revision: number; status: string }>();
    if (!booking || booking.revision !== input.bookingRevision || !["BOOKED", "RESCHEDULED"].includes(booking.status)) {
      return json({ accepted: true, skipped: "STALE_BOOKING_REVISION" });
    }
  }
  const jobId = opaqueId("msg");
  const outboxId = opaqueId("outbox");
  const correlationId = opaqueId("corr");
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(`INSERT INTO message_jobs (id, lead_id, booking_uid, booking_revision, message_type, template_version, due_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, '3.0.0', ?, 'QUEUED', ?, ?) ON CONFLICT(lead_id, message_type, booking_uid, booking_revision) DO NOTHING`)
      .bind(jobId, lead.id, input.bookingUid ?? "", input.bookingRevision ?? 0, input.messageType, now, now, now),
    env.DB.prepare("INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload_json, created_at) SELECT ?, 'message', ?, 'QUEUE_JOB', ?, ? WHERE changes() > 0")
      .bind(outboxId, jobId, queueEnvelope(jobId, correlationId), now),
  ];
  if (input.completeJourney) {
    statements.push(env.DB.prepare("UPDATE lead_journeys SET status='COMPLETED', stopped_at=?, stop_reason='SEQUENCE_COMPLETE', updated_at=? WHERE lead_id=? AND journey_type='PREBOOKING' AND status='ACTIVE'")
      .bind(now, now, lead.id));
  }
  await env.DB.batch(statements);
  ctx.waitUntil(publishOutbox(env));
  return json({ accepted: true });
}

export async function handleInngestHeartbeat(request: Request, env: Cloudflare.Env): Promise<Response> {
  const raw = await readBoundedBody(request, 1024);
  if (raw === null) return json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  if (!(await verifyInternalRequest(request, env, raw))) return json({ error: "UNAUTHORIZED" }, { status: 401 });
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO component_health (component,status,last_success_at,consecutive_failures,updated_at) VALUES ('inngest','healthy',?,0,?) ON CONFLICT(component) DO UPDATE SET status='healthy',last_success_at=excluded.last_success_at,consecutive_failures=0,updated_at=excluded.updated_at")
    .bind(now, now).run();
  return json({ accepted: true });
}

export async function handleOperatorReport(request: Request, env: Cloudflare.Env): Promise<Response> {
  if (!(await verifyInternalRequest(request, env, ""))) return json({ error: "UNAUTHORIZED" }, { status: 401 });
  const scalar = async (sql: string, ...bindings: unknown[]) => Number((await env.DB.prepare(sql).bind(...bindings).first<{ count: number }>())?.count ?? 0);
  const [health, jobStates, bookingStates, messageStates, incidents] = await Promise.all([
    env.DB.prepare("SELECT component,status,last_success_at,last_failure_at,consecutive_failures,safe_detail_json,updated_at FROM component_health ORDER BY component").all(),
    env.DB.prepare("SELECT status,COUNT(*) count FROM provider_jobs GROUP BY status ORDER BY status").all(),
    env.DB.prepare("SELECT status,COUNT(*) count FROM bookings GROUP BY status ORDER BY status").all(),
    env.DB.prepare("SELECT status,COUNT(*) count FROM message_jobs GROUP BY status ORDER BY status").all(),
    env.DB.prepare("SELECT incident_key,severity,component,summary,first_seen_at,last_seen_at FROM funnel_incidents WHERE status='OPEN' ORDER BY severity,last_seen_at DESC LIMIT 100").all(),
  ]);
  return json({
    generatedAt: new Date().toISOString(),
    environment: env.ENVIRONMENT,
    deploymentVersion: env.DEPLOYMENT_VERSION,
    schemaVersion: env.SCHEMA_VERSION,
    latestCanonicalLeadAt: (await env.DB.prepare("SELECT MAX(created_at) value FROM leads").first<{ value: string | null }>())?.value ?? null,
    latestVerifiedCalWebhookAt: (await env.DB.prepare("SELECT MAX(processed_at) value FROM webhook_events WHERE provider='cal' AND processing_status='PROCESSED'").first<{ value: string | null }>())?.value ?? null,
    latestCanaryAt: (await env.DB.prepare("SELECT MAX(completed_at) value FROM canary_runs WHERE status='COMPLETED'").first<{ value: string | null }>())?.value ?? null,
    dlqIncidentCount: await scalar("SELECT COUNT(*) count FROM funnel_incidents WHERE status='OPEN' AND incident_key LIKE 'DLQ:%'"),
    health: health.results,
    providerJobStates: jobStates.results,
    bookingStates: bookingStates.results,
    messageStates: messageStates.results,
    openIncidents: incidents.results,
  });
}
