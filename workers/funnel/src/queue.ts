import { queueMessageSchema, type LeadRow, type MessageJobRow, type ProviderJobRow } from "./contracts";
import { opaqueId, sha256Hex } from "./crypto";
import { log } from "./logging";
import { openP1Incident, resolveP1Incident } from "./incidents";
import { renderMessage } from "./messages";
import {
  ProviderError,
  sendBrevoInternalEmail,
  sendClickSendSms,
  sendInngestEvent,
  syncBrevoLead,
  updateBrevoBooking,
} from "./providers";
import { evaluateSendGate } from "./send-gate";
import { formatAppointment } from "./time";

type BookingForMessage = {
  cal_booking_uid: string;
  revision: number;
  status: string;
  start_at_utc: string;
  attendee_timezone: string | null;
  reschedule_url: string | null;
};

function enabled(value: string | undefined): boolean {
  return value === "true";
}

async function claimMessageJob(env: Cloudflare.Env, id: string): Promise<MessageJobRow | null> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`UPDATE message_jobs SET status = 'CLAIMED', claimed_at = ?, updated_at = ?,
    attempt_count = attempt_count + 1 WHERE id = ? AND status IN ('PENDING','QUEUED','RETRYING') AND due_at <= ?`)
    .bind(now, now, id, now).run();
  if (Number(result.meta.changes ?? 0) !== 1) return null;
  return env.DB.prepare("SELECT * FROM message_jobs WHERE id = ?").bind(id).first<MessageJobRow>();
}

async function claimProviderJob(env: Cloudflare.Env, id: string): Promise<ProviderJobRow | null> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`UPDATE provider_jobs SET status = 'CLAIMED', claimed_at = ?, updated_at = ?,
    attempt_count = attempt_count + 1 WHERE id = ? AND status IN ('PENDING','RETRYING')`)
    .bind(now, now, id).run();
  if (Number(result.meta.changes ?? 0) !== 1) return null;
  return env.DB.prepare("SELECT * FROM provider_jobs WHERE id = ?").bind(id).first<ProviderJobRow>();
}

async function processMessageJob(env: Cloudflare.Env, id: string): Promise<void> {
  const job = await claimMessageJob(env, id);
  if (!job) return;
  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(job.lead_id).first<LeadRow>();
  if (!lead) throw new ProviderError("LEAD_NOT_FOUND", false);
  const booking = job.booking_uid
    ? await env.DB.prepare("SELECT * FROM bookings WHERE cal_booking_uid = ? LIMIT 1").bind(job.booking_uid).first<BookingForMessage>()
    : null;
  const timezone = booking?.attendee_timezone || env.BUSINESS_TIMEZONE;
  const appointment = booking ? formatAppointment(booking.start_at_utc, timezone) : { date: "", time: "" };
  const body = renderMessage(job.message_type, {
    first_name: lead.first_name,
    booking_link: env.BOOKING_LINK_BASE_URL,
    brochure_link: env.BROCHURE_URL,
    business_name: env.BUSINESS_NAME,
    operator_name: env.OPERATOR_NAME,
    appointment_date: appointment.date,
    appointment_time: appointment.time,
    timezone,
    reschedule_link: booking?.reschedule_url ?? env.BOOKING_LINK_BASE_URL,
  });
  const globallySuppressed = Boolean(await env.DB.prepare("SELECT id FROM suppressions WHERE phone_e164 = ? AND revoked_at IS NULL LIMIT 1")
    .bind(lead.phone_e164).first());
  const gate = evaluateSendGate({
    lead,
    job,
    body,
    now: new Date(),
    globallySuppressed,
    activeBookingRevision: booking?.revision,
    config: {
      environment: env.ENVIRONMENT,
      allowProductionSms: enabled(env.ALLOW_PRODUCTION_SMS),
      allowPrebookNurture: enabled(env.ALLOW_PREBOOK_NURTURE),
      allowBookingReminders: enabled(env.ALLOW_BOOKING_REMINDERS),
      clickSendEnabled: enabled(env.CLICKSEND_SMS_ENABLED),
      twoWayEnabled: enabled(env.CLICKSEND_TWO_WAY_ENABLED),
      urlMessagingApproved: enabled(env.CLICKSEND_URL_MESSAGING_APPROVED),
      sender: env.CLICKSEND_FROM_NUMBER,
      businessTimezone: env.BUSINESS_TIMEZONE,
      allowedStartHour: Number(env.SMS_ALLOWED_START_HOUR),
      allowedEndHour: Number(env.SMS_ALLOWED_END_HOUR),
      maxPartsPrebook: Number(env.CLICKSEND_MAX_PARTS_PREBOOK),
      maxPartsBooked: Number(env.CLICKSEND_MAX_PARTS_BOOKED),
    },
  });
  if (!gate.allowed) {
    await env.DB.prepare("UPDATE message_jobs SET status = 'SKIPPED', last_error_code = ?, updated_at = ? WHERE id = ?")
      .bind(gate.reason, new Date().toISOString(), job.id).run();
    return;
  }
  const renderedHash = await sha256Hex(body);
  await env.DB.prepare("UPDATE message_jobs SET status = 'SENDING', side_effect_state = 'STARTED', rendered_body_hash = ?, updated_at = ? WHERE id = ?")
    .bind(renderedHash, new Date().toISOString(), job.id).run();
  const result = await sendClickSendSms({ env, lead, job, body });
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE message_jobs SET status = 'ACCEPTED', side_effect_state = 'CONFIRMED', provider_message_id = ?,
      provider_status = ?, provider_parts = ?, provider_price = ?, provider_currency = ?, sent_at = ?, updated_at = ? WHERE id = ?`)
      .bind(result.messageId, result.status, result.parts, result.price, result.currency, now, now, job.id),
    env.DB.prepare("UPDATE leads SET latest_message_type = ?, latest_message_sent_at = ?, updated_at = ? WHERE id = ?")
      .bind(job.message_type, now, now, lead.id),
    env.DB.prepare("INSERT INTO funnel_events (id, lead_id, booking_uid, event_type, event_at, source, correlation_id, message_type, metadata_json) VALUES (?, ?, ?, 'SMS_ACCEPTED', ?, 'clicksend', ?, ?, ?)")
      .bind(opaqueId("event"), lead.id, job.booking_uid || null, now, opaqueId("corr"), job.message_type, JSON.stringify({ parts: result.parts })),
  ]);
}

function safePayload(job: ProviderJobRow): Record<string, string | number | boolean | null> {
  try {
    const value = JSON.parse(job.safe_payload_json) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, string | number | boolean | null> : {};
  } catch {
    return {};
  }
}

async function processProviderJob(env: Cloudflare.Env, id: string): Promise<void> {
  const job = await claimProviderJob(env, id);
  if (!job) return;
  const payload = safePayload(job);
  const lead = job.lead_id ? await env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(job.lead_id).first<LeadRow>() : null;
  let providerReference = "";
  if (job.action_type === "BREVO_SYNC_LEAD") {
    if (!lead) throw new ProviderError("LEAD_NOT_FOUND", false);
    const result = await syncBrevoLead(env, lead);
    providerReference = result.dealId;
    await env.DB.prepare("UPDATE leads SET brevo_contact_id = ?, brevo_deal_id = ?, updated_at = ? WHERE id = ?")
      .bind(result.contactId, result.dealId, new Date().toISOString(), lead.id).run();
    await env.DB.prepare("INSERT INTO funnel_events (id,lead_id,event_type,event_at,source,correlation_id) VALUES (?,?,'CRM_SYNCED',?,'brevo',?)")
      .bind(opaqueId("event"), lead.id, new Date().toISOString(), opaqueId("corr")).run();
  } else if (job.action_type === "BREVO_SYNC_BOOKING") {
    if (!lead || !job.booking_uid) throw new ProviderError("BOOKING_CONTEXT_MISSING", false);
    const booking = await env.DB.prepare("SELECT * FROM bookings WHERE cal_booking_uid = ? OR prior_cal_booking_uid = ? ORDER BY updated_at DESC LIMIT 1")
      .bind(job.booking_uid, job.booking_uid).first<BookingForMessage>();
    if (!booking) throw new ProviderError("BOOKING_NOT_FOUND", false);
    let contactId = lead.brevo_contact_id;
    let dealId = lead.brevo_deal_id;
    if (!contactId || !dealId) {
      const synced = await syncBrevoLead(env, lead);
      contactId = synced.contactId;
      dealId = synced.dealId;
      await env.DB.prepare("UPDATE leads SET brevo_contact_id = ?, brevo_deal_id = ?, updated_at = ? WHERE id = ?")
        .bind(contactId, dealId, new Date().toISOString(), lead.id).run();
    }
    const stage = booking.status === "CANCELLED" ? env.BREVO_STAGE_CANCELLED_ID
      : booking.status === "COMPLETED" ? env.BREVO_STAGE_COMPLETED_ID
      : env.BREVO_STAGE_BOOKED_ID;
    await updateBrevoBooking(env, {
      contactId,
      dealId,
      publicId: lead.public_id,
      email: lead.email,
      bookingState: booking.status,
      bookingUid: booking.cal_booking_uid,
      appointmentStart: booking.start_at_utc,
      appointmentTimezone: booking.attendee_timezone,
      stageId: stage,
    });
    await env.DB.prepare("INSERT INTO funnel_events (id,lead_id,booking_uid,event_type,event_at,source,correlation_id,metadata_json) VALUES (?,?,?,'DEAL_STAGE_CHANGED',?,'brevo',?,?)")
      .bind(opaqueId("event"), lead.id, booking.cal_booking_uid, new Date().toISOString(), opaqueId("corr"), JSON.stringify({ bookingState: booking.status })).run();
    providerReference = dealId ?? "";
  } else if (job.action_type === "BREVO_INTERNAL_EMAIL") {
    const notification = String(payload.notificationType ?? "new-lead");
    const templateId = notification.includes("booking-cancelled") ? Number(env.BREVO_TEMPLATE_BOOKING_CANCELLED_ID)
      : notification.includes("booking-created") ? Number(env.BREVO_TEMPLATE_BOOKING_CREATED_ID)
      : notification.includes("reply") ? Number(env.BREVO_TEMPLATE_REPLY_ALERT_ID)
      : notification.includes("incident") ? Number(env.BREVO_TEMPLATE_INCIDENT_ID)
      : Number(env.BREVO_TEMPLATE_NEW_LEAD_ID);
    providerReference = await sendBrevoInternalEmail(env, {
      templateId,
      idempotencyKey: job.id,
      params: {
        leadPublicId: lead?.public_id ?? "system",
        bookingUid: job.booking_uid,
        notificationType: notification,
      },
    });
  } else if (job.action_type === "INNGEST_EVENT") {
    const eventName = String(payload.eventName ?? "");
    if (!eventName) throw new ProviderError("INNGEST_EVENT_NAME_MISSING", false);
    const { eventName: _eventName, ...eventData } = payload;
    const data = { ...eventData, leadId: job.lead_id, bookingUid: job.booking_uid };
    providerReference = await sendInngestEvent(env, { name: eventName, id: job.id, data });
  } else if (job.action_type === "SYNTHETIC_CANARY") {
    const canaryId = String(payload.canaryId ?? "");
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE canary_runs SET status = 'COMPLETED', completed_at = ? WHERE id = ?").bind(now, canaryId),
      env.DB.prepare("INSERT INTO component_health (component, status, last_success_at, consecutive_failures, updated_at) VALUES ('queue-canary','healthy',?,0,?) ON CONFLICT(component) DO UPDATE SET status='healthy', last_success_at=excluded.last_success_at, consecutive_failures=0, updated_at=excluded.updated_at").bind(now, now),
    ]);
    await resolveP1Incident(env, "QUEUE_CANARY_STALE");
    providerReference = canaryId;
  } else if (job.action_type === "DAILY_DIGEST") {
    providerReference = await sendBrevoInternalEmail(env, {
      templateId: Number(env.BREVO_TEMPLATE_DAILY_DIGEST_ID),
      idempotencyKey: job.id,
      params: payload,
    });
  }
  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE provider_jobs SET status = 'COMPLETED', side_effect_state = 'CONFIRMED', provider_reference = ?, completed_at = ?, updated_at = ? WHERE id = ?")
    .bind(providerReference, now, now, job.id).run();
}

async function markFailure(env: Cloudflare.Env, id: string, error: unknown): Promise<{ retry: boolean; code: string }> {
  const providerError = error instanceof ProviderError ? error : new ProviderError("UNEXPECTED_PROCESSING_FAILURE", true);
  const message = await env.DB.prepare("SELECT id FROM message_jobs WHERE id = ?").bind(id).first();
  const table = message ? "message_jobs" : "provider_jobs";
  const now = new Date().toISOString();
  if (providerError.sideEffectUnknown) {
    await env.DB.prepare(`UPDATE ${table} SET status = 'SIDE_EFFECT_UNKNOWN', side_effect_state = 'UNKNOWN', last_error_code = ?, updated_at = ? WHERE id = ?`)
      .bind(providerError.code, now, id).run();
    await openP1Incident(env, { key: `SIDE_EFFECT_UNKNOWN:${id}`, component: "queue", summary: "Provider side effect could not be determined; automatic retry is blocked", evidence: { jobId: id, errorCode: providerError.code }, notify: Boolean(message) });
    return { retry: false, code: providerError.code };
  }
  const status = providerError.retryable ? "RETRYING" : "FAILED_PERMANENT";
  await env.DB.prepare(`UPDATE ${table} SET status = ?, last_error_code = ?, updated_at = ? WHERE id = ?`)
    .bind(status, providerError.code, now, id).run();
  if (!providerError.retryable) await openP1Incident(env, { key: `JOB_FAILED:${id}`, component: "queue", summary: "Funnel job failed permanently", evidence: { jobId: id, errorCode: providerError.code }, notify: Boolean(message) });
  return { retry: providerError.retryable, code: providerError.code };
}

export async function handleQueue(batch: MessageBatch<unknown>, env: Cloudflare.Env): Promise<void> {
  for (const message of batch.messages) {
    const parsed = queueMessageSchema.safeParse(message.body);
    if (!parsed.success) {
      await openP1Incident(env, { key: `INVALID_QUEUE_MESSAGE:${message.id}`, component: "queue", summary: "Queue message failed schema validation", notify: true });
      message.ack();
      continue;
    }
    const { jobId, correlationId } = parsed.data;
    if (batch.queue.endsWith("-dlq")) {
      await openP1Incident(env, { key: `DLQ:${jobId}`, component: "queue", summary: "Job reached the dead-letter queue", evidence: { jobId }, notify: true });
      message.ack();
      continue;
    }
    try {
      const isMessage = Boolean(await env.DB.prepare("SELECT id FROM message_jobs WHERE id = ?").bind(jobId).first());
      if (isMessage) await processMessageJob(env, jobId);
      else await processProviderJob(env, jobId);
      message.ack();
      log({ event: "queue_job_completed", severity: "info", component: "queue", environment: env.ENVIRONMENT, correlationId, jobId, deploymentVersion: env.DEPLOYMENT_VERSION });
    } catch (error) {
      const outcome = await markFailure(env, jobId, error);
      log({ event: "queue_job_failed", severity: "error", component: "queue", environment: env.ENVIRONMENT, correlationId, jobId, errorCode: outcome.code, deploymentVersion: env.DEPLOYMENT_VERSION });
      if (outcome.retry) message.retry({ delaySeconds: 30 });
      else message.ack();
    }
  }
}
