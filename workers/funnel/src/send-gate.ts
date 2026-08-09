import type { LeadRow, MessageJobRow } from "./contracts";
import { isPrebookMessage, smsParts } from "./messages";
import { withinSendWindow } from "./time";

export type SendGateConfig = {
  environment: string;
  allowProductionSms: boolean;
  allowPrebookNurture: boolean;
  allowBookingReminders: boolean;
  clickSendEnabled: boolean;
  twoWayEnabled: boolean;
  urlMessagingApproved: boolean;
  sender: string;
  businessTimezone: string;
  allowedStartHour: number;
  allowedEndHour: number;
  maxPartsPrebook: number;
  maxPartsBooked: number;
};

export function evaluateSendGate(input: {
  lead: LeadRow;
  job: MessageJobRow;
  body: string;
  now: Date;
  config: SendGateConfig;
  globallySuppressed: boolean;
  activeBookingRevision?: number | null;
}): { allowed: true; parts: number } | { allowed: false; reason: string } {
  const { lead, job, body, now, config } = input;
  const prebook = isPrebookMessage(job.message_type);
  if (config.environment === "production" && !config.allowProductionSms) return { allowed: false, reason: "PRODUCTION_SMS_DISABLED" };
  if (!config.clickSendEnabled) return { allowed: false, reason: "CLICKSEND_DISABLED" };
  if (!/^\+614\d{8}$/.test(lead.phone_e164)) return { allowed: false, reason: "INVALID_PHONE" };
  if (!config.sender) return { allowed: false, reason: "SENDER_MISSING" };
  if (!config.twoWayEnabled) return { allowed: false, reason: "TWO_WAY_DISABLED" };
  if (body.includes("http") && !config.urlMessagingApproved) return { allowed: false, reason: "URL_MESSAGING_NOT_APPROVED" };
  if (input.globallySuppressed || lead.suppression_state !== "NONE") return { allowed: false, reason: "SUPPRESSED" };
  if (lead.manual_pause) return { allowed: false, reason: "MANUAL_PAUSE" };
  if (prebook) {
    if (job.message_type !== "PREBOOK_INSTANT_V3" && !config.allowPrebookNurture) return { allowed: false, reason: "PREBOOK_NURTURE_DISABLED" };
    if (!lead.marketing_sms_consent && job.message_type !== "PREBOOK_INSTANT_V3") return { allowed: false, reason: "CONSENT_MISSING" };
    if (lead.replied_at) return { allowed: false, reason: "REPLIED" };
    if (["BOOKED", "RESCHEDULED", "COMPLETED", "NO_SHOW"].includes(lead.booking_state)) return { allowed: false, reason: "ALREADY_BOOKED" };
    if (job.message_type !== "PREBOOK_INSTANT_V3" && !withinSendWindow(now, config.businessTimezone, config.allowedStartHour, config.allowedEndHour)) return { allowed: false, reason: "QUIET_HOURS" };
  } else {
    if (!config.allowBookingReminders && job.message_type !== "BOOKING_CONFIRMED_V3") return { allowed: false, reason: "BOOKING_REMINDERS_DISABLED" };
    if (!["BOOKED", "RESCHEDULED"].includes(lead.booking_state)) return { allowed: false, reason: "BOOKING_NOT_ACTIVE" };
    if (input.activeBookingRevision !== undefined && input.activeBookingRevision !== null && job.booking_revision !== input.activeBookingRevision) return { allowed: false, reason: "STALE_BOOKING_REVISION" };
  }
  if (job.provider_message_id || ["ACCEPTED", "DELIVERED"].includes(job.status)) return { allowed: false, reason: "ALREADY_SENT" };
  const parts = smsParts(body);
  const cap = prebook ? config.maxPartsPrebook : config.maxPartsBooked;
  if (parts > cap) return { allowed: false, reason: "MESSAGE_PARTS_EXCEEDED" };
  return { allowed: true, parts };
}
