import assert from "node:assert/strict";
import test from "node:test";
import { buildCloudflareIngressPayload, buildMakeWebhookPayload, canonicalJson, hmacSha256Hex } from "../lib/vendor-audit-intake.mjs";

test("Make payload captures the two-field form without inventing consent", () => {
  assert.deepEqual(buildMakeWebhookPayload({ fullName: "Example Lead", phone: "+61400000000", bookingToken: "a".repeat(24), submittedAt: "2026-08-04T00:00:00.000Z" }), {
    source: "website_vendor_audit", fullName: "Example Lead", phone: "+61400000000", timezone: "Australia/Brisbane", offer: "Vendor Conversion Audit", booking_token: "a".repeat(24), source_lead_id: "a".repeat(24), created_at: "2026-08-04T00:00:00.000Z", submitted_at: "2026-08-04T00:00:00.000Z", submittedAt: "2026-08-04T00:00:00.000Z", sms_consent_valid: false, sms_consent: false,
  });
});

test("Cloudflare mode constructs the Worker contract from supplied fields only", () => {
  const result = buildCloudflareIngressPayload({ email: "lead@example.test", timezone: "Australia/Brisbane", sms_consent_valid: true, source_lead_id: "provider-001" }, { fullName: "Example Lead", phone: "+61400000000", bookingToken: "b".repeat(24), submittedAt: "2026-08-04T00:00:00.000Z" });
  assert.equal(result.ok, true);
  assert.equal(result.payload.client_id, "RE-0001");
  assert.equal(result.payload.tenant_id, "RE-0001");
  assert.equal(result.payload.source, "website_vendor_audit");
  assert.equal(result.payload.route, "live");
  assert.equal(result.payload.sms_consent_valid, true);
  assert.match(result.payload.payload_hash, /^[a-f0-9]{64}$/);
});

test("Cloudflare mode fails closed without genuine consent, email, or timezone", () => {
  const context = { fullName: "Example Lead", phone: "+61400000000", bookingToken: "c".repeat(24), submittedAt: "2026-08-04T00:00:00.000Z" };
  assert.equal(buildCloudflareIngressPayload({ email: "lead@example.test", timezone: "Australia/Brisbane" }, context).ok, false);
  assert.equal(buildCloudflareIngressPayload({ sms_consent_valid: true, timezone: "Australia/Brisbane" }, context).ok, false);
  assert.equal(buildCloudflareIngressPayload({ email: "lead@example.test", sms_consent_valid: true }, context).ok, false);
});

test("signature uses the exact raw body expected by Worker ingress", () => {
  const body = JSON.stringify({ b: 2, a: 1 });
  assert.equal(hmacSha256Hex("unit-source-secret", `2026-08-04T00:00:00.000Z.fixture-nonce.${body}`), "c9a537e5f3ea046f93a183fb492f59da387758f41a8cfed83df50cd4bfb0b0a8");
  assert.equal(canonicalJson({ b: 2, a: 1 }), "{\"a\":1,\"b\":2}");
});
