import { constantTimeEqual, opaqueId, sha256Hex } from "./crypto";
import { json, readBoundedBody } from "./http";
import { openP1Incident } from "./incidents";
import { classifyInboundIntent, normalizeAustralianMobile } from "./phone";
import { publishOutbox, queueEnvelope } from "./outbox";

type Payload = Record<string, unknown>;

function value(payload: Payload, ...keys: string[]): string {
  for (const key of keys) {
    const item = payload[key];
    if (typeof item === "string" || typeof item === "number") return String(item).trim();
  }
  return "";
}

async function parsePayload(request: Request): Promise<{ raw: string; payload: Payload } | null> {
  const raw = await readBoundedBody(request, 32 * 1024);
  if (raw === null) return null;
  const contentType = request.headers.get("Content-Type")?.toLowerCase() ?? "";
  try {
    if (contentType.includes("application/json")) {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { raw, payload: parsed as Payload } : null;
    }
    const params = new URLSearchParams(raw);
    return { raw, payload: Object.fromEntries(params.entries()) };
  } catch {
    return null;
  }
}

function authorisedPathToken(token: string, expected: string): boolean {
  return token.length >= 32 && expected.length >= 32 && constantTimeEqual(token, expected);
}

export async function handleClickSendReceipt(request: Request, env: Cloudflare.Env, token: string): Promise<Response> {
  if (!authorisedPathToken(token, env.CLICKSEND_RECEIPT_WEBHOOK_TOKEN)) return json({ error: "NOT_FOUND" }, { status: 404 });
  const parsed = await parsePayload(request);
  if (!parsed) return json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const providerMessageId = value(parsed.payload, "message_id", "messageId");
  const status = value(parsed.payload, "status", "status_code", "statusCode").toUpperCase();
  if (!providerMessageId || !status) return json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const eventKey = value(parsed.payload, "event_id", "eventId") || `${providerMessageId}:${status}`;
  const duplicate = await env.DB.prepare("SELECT id FROM webhook_events WHERE provider = 'clicksend-receipt' AND provider_event_key = ?")
    .bind(eventKey).first();
  if (duplicate) return json({ accepted: true, duplicate: true });
  const now = new Date().toISOString();
  const delivered = ["DELIVERED", "SUCCESS", "RECEIVED"].includes(status);
  const permanentlyFailed = ["FAILED", "REJECTED", "UNDELIVERED", "EXPIRED"].includes(status);
  const matched = await env.DB.prepare("SELECT id, lead_id FROM message_jobs WHERE provider_message_id = ? LIMIT 1")
    .bind(providerMessageId).first<{ id: string; lead_id: string }>();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO webhook_events (id, provider, provider_event_key, event_type, payload_hash, received_at, processed_at, processing_status) VALUES (?, 'clicksend-receipt', ?, ?, ?, ?, ?, 'PROCESSED')")
      .bind(opaqueId("webhook"), eventKey, status, await sha256Hex(parsed.raw), now, now),
    env.DB.prepare("UPDATE message_jobs SET status = CASE WHEN ? THEN 'DELIVERED' WHEN ? THEN 'FAILED_PERMANENT' ELSE status END, provider_status = ?, delivered_at = CASE WHEN ? THEN ? ELSE delivered_at END, updated_at = ? WHERE provider_message_id = ?")
      .bind(delivered ? 1 : 0, permanentlyFailed ? 1 : 0, status, delivered ? 1 : 0, now, now, providerMessageId),
    env.DB.prepare("INSERT INTO funnel_events (id,lead_id,event_type,event_at,source,correlation_id,message_type,metadata_json) SELECT ?,lead_id,CASE WHEN ? THEN 'SMS_DELIVERED' ELSE 'SMS_FAILED' END,?,'clicksend',?,message_type,? FROM message_jobs WHERE provider_message_id=? AND (? OR ?)")
      .bind(opaqueId("event"), delivered ? 1 : 0, now, opaqueId("corr"), JSON.stringify({ providerStatus: status }), providerMessageId, delivered ? 1 : 0, permanentlyFailed ? 1 : 0),
  ]);
  if (permanentlyFailed && matched) {
    await openP1Incident(env, { key: `SMS_DELIVERY_FAILED:${matched.id}`, component: "clicksend", summary: "A real lead SMS permanently failed delivery", evidence: { jobId: matched.id, providerStatus: status }, notify: true });
  }
  return json({ accepted: true });
}

export async function handleClickSendInbound(request: Request, env: Cloudflare.Env, ctx: ExecutionContext, token: string): Promise<Response> {
  if (!authorisedPathToken(token, env.CLICKSEND_INBOUND_WEBHOOK_TOKEN)) return json({ error: "NOT_FOUND" }, { status: 404 });
  const parsed = await parsePayload(request);
  if (!parsed) return json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const from = normalizeAustralianMobile(value(parsed.payload, "from", "from_number", "source"));
  const body = value(parsed.payload, "body", "message", "text");
  if (!from || !body) return json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const providerEventId = value(parsed.payload, "message_id", "messageId", "event_id") || await sha256Hex(parsed.raw);
  const duplicate = await env.DB.prepare("SELECT id FROM inbound_messages WHERE provider_event_id = ?").bind(providerEventId).first();
  if (duplicate) return json({ accepted: true, duplicate: true });
  const leads = await env.DB.prepare("SELECT id FROM leads WHERE phone_e164 = ? AND lifecycle_state != 'CLOSED' ORDER BY created_at DESC LIMIT 2")
    .bind(from).all<{ id: string }>();
  const leadId = leads.results.length === 1 ? leads.results[0].id : null;
  const intent = classifyInboundIntent(body) === "STOP" ? "STOP" : "REPLY";
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare("INSERT INTO inbound_messages (id, provider_event_id, provider_message_id, lead_id, from_phone_e164, to_number, normalised_intent, body_ciphertext, received_at, processed_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)")
      .bind(opaqueId("inbound"), providerEventId, value(parsed.payload, "original_message_id") || null, leadId, from, value(parsed.payload, "to", "to_number") || null, intent, now, now),
    env.DB.prepare("UPDATE leads SET replied_at = ?, journey_state = CASE WHEN ? = 'STOP' THEN 'STOPPED_SUPPRESSED' ELSE 'PAUSED_REPLY' END, suppression_state = CASE WHEN ? = 'STOP' THEN 'GLOBAL' ELSE suppression_state END, updated_at = ? WHERE phone_e164 = ? AND lifecycle_state != 'CLOSED'")
      .bind(now, intent, intent, now, from),
    env.DB.prepare("UPDATE message_jobs SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE lead_id IN (SELECT id FROM leads WHERE phone_e164 = ?) AND status IN ('PENDING','QUEUED','CLAIMED','RETRYING')")
      .bind(now, now, from),
    env.DB.prepare("UPDATE lead_journeys SET status = 'STOPPED', stopped_at = ?, stop_reason = ?, updated_at = ? WHERE lead_id IN (SELECT id FROM leads WHERE phone_e164 = ?) AND status = 'ACTIVE'")
      .bind(now, intent, now, from),
    env.DB.prepare("INSERT INTO funnel_events (id,lead_id,event_type,event_at,source,correlation_id,metadata_json) VALUES (?,?,?,?,'clicksend',?,?)")
      .bind(opaqueId("event"), leadId, intent === "STOP" ? "STOP_RECEIVED" : "REPLY_RECEIVED", now, opaqueId("corr"), JSON.stringify({ matchCount: leads.results.length })),
  ];
  if (intent === "STOP") {
    statements.push(env.DB.prepare("INSERT INTO suppressions (id, phone_e164, reason, source, created_at) VALUES (?, ?, 'STOP_KEYWORD', 'clicksend_inbound', ?) ON CONFLICT(phone_e164) DO UPDATE SET reason='STOP_KEYWORD', source='clicksend_inbound', created_at=excluded.created_at, revoked_at=NULL")
      .bind(opaqueId("suppress"), from, now));
  }
  const jobIds: string[] = [];
  if (leadId) {
    for (const action of ["BREVO_SYNC_LEAD", "BREVO_INTERNAL_EMAIL", "INNGEST_EVENT"] as const) {
      const jobId = opaqueId("job");
      jobIds.push(jobId);
      const notificationType = intent === "STOP" ? "reply-stop" : "reply-alert";
      const payload = action === "INNGEST_EVENT"
        ? { eventName: "arcanium/vendor-audit.stopped", leadId, reason: intent }
        : { notificationType };
      statements.push(
        env.DB.prepare("INSERT INTO provider_jobs (id, lead_id, action_type, idempotency_key, safe_payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(jobId, leadId, action, `${providerEventId}:${action}`, JSON.stringify(payload), now, now),
        env.DB.prepare("INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload_json, created_at) VALUES (?, 'lead', ?, 'QUEUE_JOB', ?, ?)")
          .bind(opaqueId("outbox"), leadId, queueEnvelope(jobId, opaqueId("corr")), now),
      );
    }
  } else {
    statements.push(env.DB.prepare("INSERT INTO funnel_incidents (id, incident_key, severity, component, status, summary, safe_evidence_json, first_seen_at, last_seen_at) VALUES (?, ?, 'P1', 'clicksend', 'OPEN', 'Inbound SMS could not be matched unambiguously', ?, ?, ?) ON CONFLICT(incident_key) DO UPDATE SET last_seen_at=excluded.last_seen_at")
      .bind(opaqueId("incident"), `INBOUND_UNMATCHED:${providerEventId}`, JSON.stringify({ intent }), now, now));
  }
  await env.DB.batch(statements);
  if (jobIds.length) ctx.waitUntil(publishOutbox(env));
  return json({ accepted: true });
}
