import { createHmac, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { handleRequest, type Env } from "../src/index";

const secret = "a4-test-secret";
const env: Env = { ENVIRONMENT: "test", TEST_CLIENT_IDS: "TEST-0001", A4_HMAC_SECRET: secret, ALLOW_GBP_MUTATION: "false", MAX_REVIEW_ACTIONS: "25", GBP_DB: { prepare: () => ({ bind() { return this; }, async run() {}, async first() { return null; } }) } };
function signed(path: string, body: unknown): Request { const raw = JSON.stringify(body); const timestamp = new Date().toISOString(); const nonce = randomUUID(); const signature = createHmac("sha256", secret).update(`${timestamp}.${nonce}.${raw}`).digest("hex"); return new Request(`https://a4.test${path}`, { method: "POST", headers: { "content-type": "application/json", "x-automation-timestamp": timestamp, "x-automation-nonce": nonce, "x-automation-signature": `sha256=${signature}` }, body: raw }); }

describe("A4 GBP-control Worker", () => {
  it("reports GBP mutation disabled and no Q&A API", async () => { expect(await (await handleRequest(new Request("https://a4.test/health"), env)).json()).toMatchObject({ data: { gbp_mutation_enabled: false, qanda_api_implemented: false } }); });
  it("accepts a signed compact review batch without public mutation", async () => { const reply = await handleRequest(signed("/v1/reviews/reconcile", { environment: "test", client_id: "TEST-0001", location_id: "locations/a", scan_complete: true, reviews: [{ review_id: "r1", location_id: "locations/a", rating: 5, comment: "Prompt and helpful service throughout our entire experience today.", update_time: "2026-07-27T00:00:00Z" }] }), env); expect(await reply.json()).toMatchObject({ data: { received_count: 1, gbp_mutation_permitted: false } }); });
  it("refuses even an approved reply while the global safety flag is false", async () => { const reply = await handleRequest(signed("/v1/replies/authorise", { environment: "test", client_id: "TEST-0001", approval_status: "approved", approved_revision_hash: "x", requested_revision_hash: "x", approved_location_id: "locations/a", requested_location_id: "locations/a" }), env); expect(await reply.json()).toMatchObject({ data: { permitted: false, code: "GBP_MUTATION_DISABLED" } }); });
});
