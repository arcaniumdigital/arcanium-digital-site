import { z } from "zod";

export const vendorAuditLeadSchema = z.object({
  schemaVersion: z.literal("2.0"),
  submissionId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  sourcePage: z.string().trim().min(1).max(500),
  referrer: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  utmTerm: z.string().trim().max(200).optional(),
  utmContent: z.string().trim().max(200).optional(),
  fbclid: z.string().trim().max(500).optional(),
  gclid: z.string().trim().max(500).optional(),
  marketingSmsConsent: z.boolean(),
  consentVersion: z.string().trim().min(1).max(50),
  consentText: z.string().trim().min(20).max(1000),
  privacyNoticeVersion: z.string().trim().min(1).max(50),
  turnstileToken: z.string().trim().min(1).max(2048),
  companyWebsiteConfirmation: z.string().max(0).optional(),
});

export type VendorAuditLeadRequest = z.infer<typeof vendorAuditLeadSchema>;

export const queueMessageSchema = z.object({
  schemaVersion: z.literal("2.0"),
  jobId: z.string().min(1).max(100),
  correlationId: z.string().min(1).max(100),
});

export type FunnelQueueMessage = z.infer<typeof queueMessageSchema>;

export type MessageType =
  | "PREBOOK_INSTANT_V3"
  | "PREBOOK_10M_V3"
  | "PREBOOK_24H_V3"
  | "PREBOOK_7D_V3"
  | "BOOKING_CONFIRMED_V3"
  | "BOOKING_REMINDER_24H_V3"
  | "BOOKING_REMINDER_3H_V3"
  | "BOOKING_REMINDER_EARLY_V3";

export type ProviderAction =
  | "BREVO_SYNC_LEAD"
  | "BREVO_SYNC_BOOKING"
  | "BREVO_INTERNAL_EMAIL"
  | "INNGEST_EVENT"
  | "SYNTHETIC_CANARY"
  | "DAILY_DIGEST";

export type LeadRow = {
  id: string;
  public_id: string;
  submission_id: string;
  full_name: string;
  first_name: string;
  phone_e164: string;
  email: string | null;
  source_page: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  marketing_sms_consent: number;
  consent_version: string;
  booking_state: string;
  journey_state: string;
  suppression_state: string;
  manual_pause: number;
  replied_at: string | null;
  brevo_contact_id: string | null;
  brevo_deal_id: string | null;
  current_booking_uid: string | null;
  latest_message_type: string | null;
  latest_message_sent_at: string | null;
  created_at: string;
};

export type MessageJobRow = {
  id: string;
  lead_id: string;
  booking_uid: string;
  booking_revision: number;
  message_type: MessageType;
  template_version: string;
  due_at: string;
  status: string;
  attempt_count: number;
  provider_message_id: string | null;
  side_effect_state: string;
};

export type ProviderJobRow = {
  id: string;
  lead_id: string | null;
  booking_uid: string | null;
  action_type: ProviderAction;
  status: string;
  attempt_count: number;
  side_effect_state: string;
  safe_payload_json: string;
};

export type SafeLog = {
  event: string;
  severity: "debug" | "info" | "warn" | "error";
  component: string;
  environment: string;
  correlationId: string;
  leadId?: string;
  bookingUid?: string;
  jobId?: string;
  durationMs?: number;
  attempt?: number;
  errorCode?: string;
  deploymentVersion: string;
};
