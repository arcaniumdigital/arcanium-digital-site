import { describe, expect, it } from "vitest";
import type { LeadRow, MessageJobRow } from "../../workers/funnel/src/contracts";
import { evaluateSendGate, type SendGateConfig } from "../../workers/funnel/src/send-gate";

const lead: LeadRow = {
  id: "lead_1", public_id: "public_1", submission_id: "submission_1", full_name: "Alex Agent", first_name: "Alex", phone_e164: "+61412345678", email: null,
  source_page: "https://example.com", referrer: null, utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null,
  marketing_sms_consent: 1, consent_version: "v1", booking_state: "NOT_BOOKED", journey_state: "ACTIVE", suppression_state: "NONE", manual_pause: 0,
  replied_at: null, brevo_contact_id: null, brevo_deal_id: null, current_booking_uid: null, latest_message_type: null, latest_message_sent_at: null, created_at: "2026-08-09T00:00:00Z",
};
const job: MessageJobRow = { id: "msg_1", lead_id: lead.id, booking_uid: "", booking_revision: 0, message_type: "PREBOOK_10M_V3", template_version: "3", due_at: "2026-08-09T00:00:00Z", status: "CLAIMED", attempt_count: 1, provider_message_id: null, side_effect_state: "NOT_STARTED" };
const config: SendGateConfig = { environment: "production", allowProductionSms: true, allowPrebookNurture: true, allowBookingReminders: true, clickSendEnabled: true, twoWayEnabled: true, urlMessagingApproved: true, sender: "+61700000000", businessTimezone: "Australia/Brisbane", allowedStartHour: 7, allowedEndHour: 20, maxPartsPrebook: 3, maxPartsBooked: 4 };
const input = (overrides: Partial<Parameters<typeof evaluateSendGate>[0]> = {}) => ({ lead, job, body: "Book https://arcaniumdigital.com/audit", now: new Date("2026-08-09T00:00:00Z"), config, globallySuppressed: false, ...overrides });

describe("authoritative send gate", () => {
  it("allows an eligible consented nurture", () => expect(evaluateSendGate(input()).allowed).toBe(true));
  it("blocks production while the kill switch is off", () => expect(evaluateSendGate(input({ config: { ...config, allowProductionSms: false } }))).toEqual({ allowed: false, reason: "PRODUCTION_SMS_DISABLED" }));
  it("blocks when ClickSend is disabled", () => expect(evaluateSendGate(input({ config: { ...config, clickSendEnabled: false } })).allowed).toBe(false));
  it("blocks URL messages until approved", () => expect(evaluateSendGate(input({ config: { ...config, urlMessagingApproved: false } }))).toEqual({ allowed: false, reason: "URL_MESSAGING_NOT_APPROVED" }));
  it("blocks global suppression", () => expect(evaluateSendGate(input({ globallySuppressed: true }))).toEqual({ allowed: false, reason: "SUPPRESSED" }));
  it("blocks manual pause", () => expect(evaluateSendGate(input({ lead: { ...lead, manual_pause: 1 } }))).toEqual({ allowed: false, reason: "MANUAL_PAUSE" }));
  it("blocks missing delayed-message consent", () => expect(evaluateSendGate(input({ lead: { ...lead, marketing_sms_consent: 0 } }))).toEqual({ allowed: false, reason: "CONSENT_MISSING" }));
  it("blocks a replied lead", () => expect(evaluateSendGate(input({ lead: { ...lead, replied_at: "2026-08-09T00:00:00Z" } }))).toEqual({ allowed: false, reason: "REPLIED" }));
  it("blocks a booked lead from pre-booking nurture", () => expect(evaluateSendGate(input({ lead: { ...lead, booking_state: "BOOKED" } }))).toEqual({ allowed: false, reason: "ALREADY_BOOKED" }));
  it("blocks a stale booking revision", () => {
    const bookedJob = { ...job, message_type: "BOOKING_REMINDER_3H_V3" as const, booking_uid: "book_1", booking_revision: 1 };
    expect(evaluateSendGate(input({ lead: { ...lead, booking_state: "BOOKED" }, job: bookedJob, activeBookingRevision: 2 }))).toEqual({ allowed: false, reason: "STALE_BOOKING_REVISION" });
  });
  it("blocks a provider-referenced job from being sent twice", () => expect(evaluateSendGate(input({ job: { ...job, provider_message_id: "provider_1" } }))).toEqual({ allowed: false, reason: "ALREADY_SENT" }));
  it("allows the immediate requested response without marketing consent", () => {
    const instant = { ...job, message_type: "PREBOOK_INSTANT_V3" as const };
    expect(evaluateSendGate(input({ lead: { ...lead, marketing_sms_consent: 0 }, job: instant })).allowed).toBe(true);
  });
});
