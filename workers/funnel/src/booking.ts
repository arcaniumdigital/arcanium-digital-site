import type { LeadRow } from "./contracts";
import {
  calBookingUid,
  calDate,
  calEventKey,
  calMetadataSource,
  calPayloadEnvelope,
  calString,
  calTrigger,
  extractCalCorrelation,
  extractCalEmail,
  extractCalName,
  extractCalPhone,
} from "./cal";
import { constantTimeEqual, hmacHex, opaqueId, sha256Hex, verifyLeadCorrelation } from "./crypto";
import { allowedOrigins, corsHeaders, json, readBoundedBody } from "./http";
import { openP1Incident, resolveP1Incident } from "./incidents";
import { firstNameFromFullName, sanitizeFullName } from "./phone";
import { publishOutbox, queueEnvelope } from "./outbox";
import { verifiedProxyClientIp } from "./proxy-auth";

type BookingRow = {
  id: string;
  lead_id: string;
  cal_booking_uid: string;
  revision: number;
  status: string;
};

type Correlation = { lead: LeadRow; method: string; confidence: string; phone: string | null };

async function authenticateCal(rawBody: string, request: Request, env: Cloudflare.Env): Promise<boolean> {
  const supplied = request.headers.get("x-cal-signature-256")?.replace(/^sha256=/i, "") ?? "";
  return supplied.length === 64 && constantTimeEqual(await hmacHex(env.CAL_WEBHOOK_SECRET, rawBody), supplied);
}

async function resolveLead(body: unknown, env: Cloudflare.Env): Promise<Correlation | null> {
  const signed = extractCalCorrelation(body);
  if (signed) {
    const correlation = await verifyLeadCorrelation(env.BOOKING_CONTEXT_HMAC_SECRET, signed);
    if (correlation) {
      const lead = await env.DB.prepare("SELECT * FROM leads WHERE public_id = ? LIMIT 1")
        .bind(correlation.publicId).first<LeadRow>();
      if (lead) return { lead, method: "SIGNED_SESSION", confidence: "EXACT_SESSION", phone: lead.phone_e164 };
    }
  }
  const phone = extractCalPhone(body);
  if (phone) {
    const lead = await env.DB.prepare(`SELECT * FROM leads WHERE phone_e164 = ?
      AND lifecycle_state != 'CLOSED' ORDER BY created_at DESC LIMIT 1`)
      .bind(phone).first<LeadRow>();
    if (lead) return { lead, method: "PHONE", confidence: "EXACT_PHONE", phone };
  }
  const email = extractCalEmail(body);
  if (email) {
    const matches = await env.DB.prepare("SELECT * FROM leads WHERE lower(email) = lower(?) ORDER BY created_at DESC LIMIT 2")
      .bind(email).all<LeadRow>();
    if (matches.results.length === 1) return { lead: matches.results[0], method: "EMAIL", confidence: "EXACT_EMAIL", phone: matches.results[0].phone_e164 };
  }
  return null;
}

function providerJobStatements(input: {
  env: Cloudflare.Env;
  leadId: string;
  bookingUid: string;
  correlationId: string;
  now: string;
  actionTypes: Array<"BREVO_SYNC_BOOKING" | "BREVO_INTERNAL_EMAIL" | "INNGEST_EVENT">;
  eventName: string;
  eventData: Record<string, string | number | boolean | null>;
}): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [];
  for (const actionType of input.actionTypes) {
    const jobId = opaqueId("job");
    const outboxId = opaqueId("outbox");
    const safePayload = actionType === "INNGEST_EVENT"
      ? { eventName: input.eventName, correlationId: input.correlationId, ...input.eventData }
      : { correlationId: input.correlationId, notificationType: input.eventName };
    statements.push(
      input.env.DB.prepare("INSERT INTO provider_jobs (id, lead_id, booking_uid, action_type, idempotency_key, safe_payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(jobId, input.leadId, input.bookingUid, actionType, `${input.bookingUid}:${actionType}:${input.eventName}`, JSON.stringify(safePayload), input.now, input.now),
      input.env.DB.prepare("INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload_json, created_at) VALUES (?, 'booking', ?, 'QUEUE_JOB', ?, ?)")
        .bind(outboxId, input.bookingUid, queueEnvelope(jobId, input.correlationId), input.now),
    );
  }
  return statements;
}

async function createDirectLead(body: unknown, now: string): Promise<LeadRow | null> {
  const phone = extractCalPhone(body);
  if (!phone) return null;
  const fullName = sanitizeFullName(extractCalName(body));
  const uid = calBookingUid(body) ?? crypto.randomUUID();
  return {
    id: opaqueId("lead"),
    public_id: opaqueId("public"),
    submission_id: `cal-direct:${uid}`,
    full_name: fullName,
    first_name: firstNameFromFullName(fullName),
    phone_e164: phone,
    email: extractCalEmail(body),
    source_page: "cal_direct_booking",
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    marketing_sms_consent: 0,
    consent_version: "cal-direct-v1",
    booking_state: "NOT_BOOKED",
    journey_state: "PENDING",
    suppression_state: "NONE",
    manual_pause: 0,
    replied_at: null,
    brevo_contact_id: null,
    brevo_deal_id: null,
    current_booking_uid: null,
    latest_message_type: null,
    latest_message_sent_at: null,
    created_at: now,
  };
}

async function handleBookingCreated(body: unknown, env: Cloudflare.Env, webhookStatement: D1PreparedStatement): Promise<D1PreparedStatement[]> {
  const now = new Date().toISOString();
  const uid = calBookingUid(body);
  const startAt = calDate(body, "startTime");
  const endAt = calDate(body, "endTime");
  if (!uid || !startAt || !endAt) throw new Error("INVALID_BOOKING_PAYLOAD");
  let correlation = await resolveLead(body, env);
  let directLead: LeadRow | null = null;
  if (!correlation) {
    directLead = await createDirectLead(body, now);
    if (directLead) correlation = { lead: directLead, method: "DIRECT_BOOKING", confidence: "UNMATCHED", phone: directLead.phone_e164 };
  }
  if (!correlation) throw new Error("BOOKING_PHONE_MISSING");
  const { lead } = correlation;
  const correlationId = opaqueId("corr");
  const bookingId = opaqueId("booking");
  const messageJobId = opaqueId("msg");
  const payload = calPayloadEnvelope(body);
  const eventTypeId = payload.eventTypeId == null ? null : String(payload.eventTypeId);
  const eventTypeSlug = calString(body, "type") ?? env.CAL_EXPECTED_EVENT_SLUG;
  const timezone = calString(body, "timeZone") ?? calString(body, "attendeeTimezone") ?? env.BUSINESS_TIMEZONE;
  const statements: D1PreparedStatement[] = [webhookStatement];
  if (directLead) {
    statements.push(env.DB.prepare(`INSERT INTO leads (
      id, public_id, submission_id, full_name, first_name, phone_e164, email, source_page,
      marketing_sms_consent, consent_version, consent_text, privacy_notice_version, consent_recorded_at,
      lifecycle_state, booking_state, journey_state, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'cal_direct_booking', 0, 'cal-direct-v1', 'No marketing consent recorded', 'cal-direct-v1', ?, 'DIRECT_BOOKING', 'NOT_BOOKED', 'PENDING', ?, ?)`)
      .bind(lead.id, lead.public_id, lead.submission_id, lead.full_name, lead.first_name, lead.phone_e164, lead.email, now, now, now));
    statements.push(env.DB.prepare("INSERT INTO funnel_incidents (id, incident_key, severity, component, status, summary, first_seen_at, last_seen_at) VALUES (?, ?, 'P2', 'cal', 'OPEN', 'Authenticated Cal booking did not match an existing lead', ?, ?) ON CONFLICT(incident_key) DO UPDATE SET last_seen_at = excluded.last_seen_at")
      .bind(opaqueId("incident"), `BOOKING_UNMATCHED:${uid}`, now, now));
  }
  statements.push(
    env.DB.prepare(`INSERT INTO bookings (
      id, lead_id, cal_booking_uid, revision, status, event_type_id, event_type_slug,
      attendee_email, attendee_phone_e164, correlation_method, correlation_confidence,
      booking_source, attributed_message_type, start_at_utc, end_at_utc, attendee_timezone,
      reschedule_url, created_at, updated_at
    ) VALUES (?, ?, ?, 1, 'BOOKED', ?, ?, ?, ?, ?, ?, ?,
      (SELECT latest_message_type FROM leads WHERE id = ?), ?, ?, ?, ?, ?, ?)`)
      .bind(
        bookingId, lead.id, uid, eventTypeId, eventTypeSlug, extractCalEmail(body), extractCalPhone(body),
        correlation.method, correlation.confidence, calMetadataSource(body), lead.id, startAt, endAt,
        timezone, calString(body, "rescheduleUrl"), now, now,
      ),
    env.DB.prepare("UPDATE leads SET email = COALESCE(?, email), booking_state = 'BOOKED', current_booking_uid = ?, journey_state = 'STOPPED_BOOKED', updated_at = ? WHERE id = ?")
      .bind(extractCalEmail(body), uid, now, lead.id),
    env.DB.prepare("UPDATE leads SET journey_state = 'STOPPED_BOOKED', updated_at = ? WHERE phone_e164 = ? AND lifecycle_state != 'CLOSED'")
      .bind(now, lead.phone_e164),
    env.DB.prepare("UPDATE message_jobs SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE lead_id IN (SELECT id FROM leads WHERE phone_e164 = ?) AND message_type LIKE 'PREBOOK_%' AND status IN ('PENDING','QUEUED','CLAIMED','RETRYING')")
      .bind(now, now, lead.phone_e164),
    env.DB.prepare("UPDATE lead_journeys SET status = 'STOPPED', stopped_at = ?, stop_reason = 'BOOKED', updated_at = ? WHERE lead_id IN (SELECT id FROM leads WHERE phone_e164 = ?) AND journey_type = 'PREBOOKING' AND status = 'ACTIVE'")
      .bind(now, now, lead.phone_e164),
    env.DB.prepare("INSERT INTO message_jobs (id, lead_id, booking_uid, booking_revision, message_type, template_version, due_at, status, created_at, updated_at) VALUES (?, ?, ?, 1, 'BOOKING_CONFIRMED_V3', '3.0.0', ?, 'QUEUED', ?, ?)")
      .bind(messageJobId, lead.id, uid, now, now, now),
    env.DB.prepare("INSERT INTO lead_journeys (id, lead_id, journey_type, booking_uid, booking_revision, status, started_at, updated_at) VALUES (?, ?, 'BOOKING_REMINDERS', ?, 1, 'ACTIVE', ?, ?)")
      .bind(opaqueId("journey"), lead.id, uid, now, now),
    env.DB.prepare("INSERT INTO funnel_events (id, lead_id, booking_uid, event_type, event_at, source, correlation_id, metadata_json) VALUES (?, ?, ?, 'BOOKING_CREATED', ?, 'cal_webhook', ?, ?)")
      .bind(opaqueId("event"), lead.id, uid, now, correlationId, JSON.stringify({ correlationMethod: correlation.method, correlationConfidence: correlation.confidence })),
    env.DB.prepare("INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload_json, created_at) VALUES (?, 'booking', ?, 'QUEUE_JOB', ?, ?)")
      .bind(opaqueId("outbox"), uid, queueEnvelope(messageJobId, correlationId), now),
  );
  statements.push(...providerJobStatements({
    env,
    leadId: lead.id,
    bookingUid: uid,
    correlationId,
    now,
    actionTypes: ["BREVO_SYNC_BOOKING", "BREVO_INTERNAL_EMAIL", "INNGEST_EVENT"],
    eventName: "arcanium/vendor-audit.booking-created-or-rescheduled",
    eventData: { leadId: lead.id, bookingUid: uid, bookingRevision: 1, startAtUtc: startAt, attendeeTimezone: timezone },
  }));
  statements.push(...providerJobStatements({
    env,
    leadId: lead.id,
    bookingUid: uid,
    correlationId,
    now,
    actionTypes: ["INNGEST_EVENT"],
    eventName: "arcanium/vendor-audit.booked",
    eventData: { leadId: lead.id, bookingUid: uid, bookingRevision: 1 },
  }));
  return statements;
}

async function handleBookingMutation(trigger: string, body: unknown, env: Cloudflare.Env, webhookStatement: D1PreparedStatement): Promise<D1PreparedStatement[]> {
  const now = new Date().toISOString();
  const uid = calBookingUid(body);
  const priorUid = calString(body, "rescheduleUid") ?? calString(body, "priorBookingUid");
  const booking = await env.DB.prepare("SELECT * FROM bookings WHERE cal_booking_uid IN (?, ?) ORDER BY updated_at DESC LIMIT 1")
    .bind(uid ?? "", priorUid ?? uid ?? "").first<BookingRow>();
  if (!booking || !uid) throw new Error("BOOKING_NOT_FOUND");
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(booking.lead_id).first<LeadRow>();
  if (!lead) throw new Error("LEAD_NOT_FOUND");
  const correlationId = opaqueId("corr");
  const statements: D1PreparedStatement[] = [webhookStatement];
  if (trigger === "BOOKING_RESCHEDULED") {
    const revision = booking.revision + 1;
    const startAt = calDate(body, "startTime");
    const endAt = calDate(body, "endTime");
    if (!startAt || !endAt) throw new Error("INVALID_BOOKING_PAYLOAD");
    const timezone = calString(body, "timeZone") ?? env.BUSINESS_TIMEZONE;
    statements.push(
      env.DB.prepare("UPDATE bookings SET prior_cal_booking_uid = cal_booking_uid, cal_booking_uid = ?, revision = ?, status = 'RESCHEDULED', start_at_utc = ?, end_at_utc = ?, attendee_timezone = ?, reschedule_url = ?, updated_at = ? WHERE id = ?")
        .bind(uid, revision, startAt, endAt, timezone, calString(body, "rescheduleUrl"), now, booking.id),
      env.DB.prepare("UPDATE leads SET booking_state = 'RESCHEDULED', current_booking_uid = ?, updated_at = ? WHERE id = ?")
        .bind(uid, now, lead.id),
      env.DB.prepare("UPDATE message_jobs SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE booking_uid IN (?, ?) AND booking_revision < ? AND status IN ('PENDING','QUEUED','CLAIMED','RETRYING')")
        .bind(now, now, booking.cal_booking_uid, uid, revision),
      env.DB.prepare("UPDATE lead_journeys SET status = 'STOPPED', stopped_at = ?, stop_reason = 'RESCHEDULED', updated_at = ? WHERE booking_uid = ? AND booking_revision < ? AND status = 'ACTIVE'")
        .bind(now, now, booking.cal_booking_uid, revision),
      env.DB.prepare("INSERT INTO lead_journeys (id, lead_id, journey_type, booking_uid, booking_revision, status, started_at, updated_at) VALUES (?, ?, 'BOOKING_REMINDERS', ?, ?, 'ACTIVE', ?, ?)")
        .bind(opaqueId("journey"), lead.id, uid, revision, now, now),
    );
    statements.push(...providerJobStatements({
      env, leadId: lead.id, bookingUid: uid, correlationId, now,
      actionTypes: ["BREVO_SYNC_BOOKING", "BREVO_INTERNAL_EMAIL", "INNGEST_EVENT"],
      eventName: "arcanium/vendor-audit.booking-created-or-rescheduled",
      eventData: { leadId: lead.id, bookingUid: uid, bookingRevision: revision, startAtUtc: startAt, attendeeTimezone: timezone },
    }));
    statements.push(...providerJobStatements({
      env, leadId: lead.id, bookingUid: booking.cal_booking_uid, correlationId, now,
      actionTypes: ["INNGEST_EVENT"],
      eventName: "arcanium/vendor-audit.booking-rescheduled",
      eventData: { leadId: lead.id, bookingUid: booking.cal_booking_uid, bookingRevision: booking.revision },
    }));
  } else {
    const status = trigger === "BOOKING_CANCELLED" ? "CANCELLED" : trigger === "MEETING_ENDED" ? "COMPLETED" : "NO_SHOW";
    statements.push(
      env.DB.prepare("UPDATE bookings SET status = ?, cancellation_reason = COALESCE(?, cancellation_reason), cancelled_at = CASE WHEN ? = 'CANCELLED' THEN ? ELSE cancelled_at END, completed_at = CASE WHEN ? = 'COMPLETED' THEN ? ELSE completed_at END, updated_at = ? WHERE id = ?")
        .bind(status, calString(body, "cancellationReason"), status, now, status, now, now, booking.id),
      env.DB.prepare("UPDATE leads SET booking_state = ?, updated_at = ? WHERE id = ?").bind(status, now, lead.id),
      env.DB.prepare("UPDATE message_jobs SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE booking_uid = ? AND message_type LIKE 'BOOKING_REMINDER_%' AND status IN ('PENDING','QUEUED','CLAIMED','RETRYING')")
        .bind(now, now, booking.cal_booking_uid),
      env.DB.prepare("UPDATE lead_journeys SET status = 'STOPPED', stopped_at = ?, stop_reason = ?, updated_at = ? WHERE booking_uid = ? AND journey_type = 'BOOKING_REMINDERS' AND status = 'ACTIVE'")
        .bind(now, status, now, booking.cal_booking_uid),
    );
    const eventName = trigger === "BOOKING_CANCELLED" ? "arcanium/vendor-audit.booking-cancelled" : "arcanium/vendor-audit.stopped";
    statements.push(...providerJobStatements({
      env, leadId: lead.id, bookingUid: booking.cal_booking_uid, correlationId, now,
      actionTypes: ["BREVO_SYNC_BOOKING", "BREVO_INTERNAL_EMAIL", "INNGEST_EVENT"],
      eventName,
      eventData: { leadId: lead.id, bookingUid: booking.cal_booking_uid, bookingRevision: booking.revision },
    }));
  }
  const funnelEventType = trigger === "BOOKING_NO_SHOW_UPDATED" ? "NO_SHOW" : trigger;
  statements.push(env.DB.prepare("INSERT INTO funnel_events (id, lead_id, booking_uid, event_type, event_at, source, correlation_id) VALUES (?, ?, ?, ?, ?, 'cal_webhook', ?)")
    .bind(opaqueId("event"), lead.id, uid, funnelEventType, now, correlationId));
  return statements;
}

export async function handleCalWebhook(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
  const rawBody = await readBoundedBody(request, 64 * 1024);
  if (rawBody === null) return json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  if (!(await authenticateCal(rawBody, request, env))) {
    const now = new Date().toISOString();
    const payloadHash = await sha256Hex(rawBody);
    await env.DB.prepare("INSERT OR IGNORE INTO webhook_events (id,provider,provider_event_key,event_type,payload_hash,received_at,processed_at,processing_status,error_code) VALUES (?,'cal-signature',?,'INVALID_SIGNATURE',?,?,?,'REJECTED','INVALID_SIGNATURE')")
      .bind(opaqueId("webhook"), payloadHash, payloadHash, now, now).run().catch(() => undefined);
    const threshold = new Date(Date.now() - 15 * 60_000).toISOString();
    const failures = await env.DB.prepare("SELECT COUNT(*) count FROM webhook_events WHERE provider='cal-signature' AND received_at>=?").bind(threshold).first<{ count: number }>().catch(() => null);
    if (Number(failures?.count ?? 0) >= 3) await openP1Incident(env, { key: "CAL_SIGNATURE_FAILURES", component: "cal", summary: "Cal webhook signature failures exceeded the alert threshold", evidence: { windowMinutes: 15 }, notify: true }).catch(() => undefined);
    return json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }
  await resolveP1Incident(env, "CAL_SIGNATURE_FAILURES").catch(() => undefined);
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return json({ error: "INVALID_JSON" }, { status: 400 }); }
  const trigger = calTrigger(body);
  const allowed = new Set(["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED", "BOOKING_NO_SHOW_UPDATED", "MEETING_ENDED"]);
  if (!trigger || !allowed.has(trigger)) return json({ accepted: true, ignored: true });
  const payloadHash = await sha256Hex(rawBody);
  const eventKey = calEventKey(body, payloadHash);
  const duplicate = await env.DB.prepare("SELECT id FROM webhook_events WHERE provider = 'cal' AND provider_event_key = ? LIMIT 1")
    .bind(eventKey).first();
  if (duplicate) return json({ accepted: true, duplicate: true });
  const now = new Date().toISOString();
  const webhookId = opaqueId("webhook");
  const webhookStatement = env.DB.prepare("INSERT INTO webhook_events (id, provider, provider_event_key, event_type, payload_hash, received_at, processed_at, processing_status) VALUES (?, 'cal', ?, ?, ?, ?, ?, 'PROCESSED')")
    .bind(webhookId, eventKey, trigger, payloadHash, now, now);
  try {
    const statements = trigger === "BOOKING_CREATED"
      ? await handleBookingCreated(body, env, webhookStatement)
      : await handleBookingMutation(trigger, body, env, webhookStatement);
    await env.DB.batch(statements);
  } catch (error) {
    const code = error instanceof Error ? error.message : "BOOKING_PROCESSING_FAILED";
    await env.DB.prepare("INSERT INTO webhook_events (id, provider, provider_event_key, event_type, payload_hash, received_at, processed_at, processing_status, error_code) VALUES (?, 'cal', ?, ?, ?, ?, ?, 'FAILED', ?)")
      .bind(webhookId, eventKey, trigger, payloadHash, now, now, code).run().catch(() => undefined);
    await openP1Incident(env, { key: `CAL_WEBHOOK:${eventKey}`, component: "cal", summary: "Cal webhook could not be processed safely", evidence: { errorCode: code }, notify: true }).catch(() => undefined);
    return json({ error: "PROCESSING_FAILED" }, { status: 503 });
  }
  ctx.waitUntil(publishOutbox(env));
  return json({ accepted: true }, { status: 202 });
}

export async function handleBookingBrowserEvent(request: Request, env: Cloudflare.Env): Promise<Response> {
  const cors = corsHeaders(request, env);
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins(env).has(origin)) return json({ error: "FORBIDDEN" }, { status: 403, headers: cors });
  const raw = await readBoundedBody(request, 2048);
  if (raw === null) return json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413, headers: cors });
  if (!(await verifiedProxyClientIp(request, env, raw))) return json({ error: "INVALID_PROXY_SIGNATURE" }, { status: 403, headers: cors });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ error: "INVALID_JSON" }, { status: 400, headers: cors }); }
  const record = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const eventType = typeof record.eventType === "string" ? record.eventType : "";
  const allowed = new Set(["VENDOR_AUDIT_VIEWED", "CALENDAR_READY", "CALENDAR_INTERACTED", "BOOKING_OBSERVED_BROWSER"]);
  if (!allowed.has(eventType)) return json({ error: "INVALID_EVENT" }, { status: 400, headers: cors });
  await env.DB.prepare("INSERT INTO funnel_events (id,event_type,event_at,source,correlation_id,metadata_json) VALUES (?,?,?,'browser',?,?)")
    .bind(opaqueId("event"), eventType, new Date().toISOString(), opaqueId("corr"), JSON.stringify({ schemaVersion: "1" })).run();
  return json({ accepted: true }, { status: 202, headers: cors });
}
