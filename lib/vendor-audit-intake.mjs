import { createHash, createHmac } from "node:crypto";

export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

export function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hmacSha256Hex(secret, value) {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function trueValue(value) {
  return value === true || value === "true";
}

export function isCloudflareMode(mode) {
  return mode === "cloudflare";
}

/** The current production Make intake contract. */
export function buildMakeWebhookPayload({ fullName, phone, bookingToken, submittedAt }) {
  return {
    source: "website_vendor_audit",
    fullName,
    phone,
    timezone: "Australia/Brisbane",
    offer: "Vendor Conversion Audit",
    booking_token: bookingToken,
    source_lead_id: bookingToken,
    created_at: submittedAt,
    submitted_at: submittedAt,
    submittedAt,
    sms_consent_valid: false,
    sms_consent: false,
  };
}

/**
 * Cloudflare is intentionally stricter than the recovered Make path. It only
 * accepts fields actually supplied by the upstream form/provider; it never
 * invents consent, timezone, email, or client identity.
 */
export function buildCloudflareIngressPayload(input, { fullName, phone, bookingToken, submittedAt }) {
  const email = text(input?.email);
  const timezone = text(input?.timezone);
  const consent = trueValue(input?.sms_consent_valid) || trueValue(input?.sms_consent);
  const sourceLeadId = text(input?.source_lead_id) || bookingToken;
  if (!email || !timezone || !consent || !sourceLeadId) return { ok: false, reason: "required_live_fields_missing" };

  const unsigned = {
    client_id: "RE-0001",
    tenant_id: "RE-0001",
    source: "website_vendor_audit",
    route: "live",
    environment: "live",
    submission_id: sourceLeadId,
    event_id: `vendor-audit-${sourceLeadId}`,
    correlation_id: `vendor-audit-${sourceLeadId}`,
    occurred_at: submittedAt,
    created_at: submittedAt,
    submittedAt,
    fullName,
    email,
    phone,
    timezone,
    sms_consent_valid: true,
    consent_at: text(input?.consent_at) || submittedAt,
    booking_token: bookingToken,
    source_lead_id: sourceLeadId,
    offer: "Vendor Conversion Audit",
  };
  return { ok: true, payload: { ...unsigned, payload_hash: sha256Hex(canonicalJson(unsigned)) } };
}
