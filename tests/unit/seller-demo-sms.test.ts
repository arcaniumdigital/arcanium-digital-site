import { afterEach, describe, expect, it, vi } from "vitest";
import { isApprovedDemoRecipient, isDemoRequestOrigin, validateDemoSmsLead } from "../../lib/seller-demo-sms";
import { POST } from "../../app/api/seller-demo/route";

const fixture = { name: "Taylor Example", phone: "0412 345 678", suburb: "Kellyville", address: "1 Example Street", scenario: "curious", smsConsent: true };
const makeRequest = (body: unknown = fixture, headers: Record<string, string> = {}) => new Request("https://demo.example/api/seller-demo", {
  method: "POST", headers: { origin: "https://demo.example", "content-type": "application/json", ...headers }, body: JSON.stringify(body),
});
const responseBody = async (response: Response) => await response.json() as Record<string, unknown>;
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("owner-only SMS demo validation", () => {
  it("normalizes the existing Australian mobile formats", () => {
    expect(validateDemoSmsLead(fixture).phone).toBe("+61412345678");
    expect(validateDemoSmsLead({ ...fixture, phone: "+61 412 345 678" }).phone).toBe("+61412345678");
  });
  it.each(["", "0712345678", "+14155552671", "0412345678 abc", "0412345678#123"])("rejects invalid mobile %s", phone => {
    expect(() => validateDemoSmsLead({ ...fixture, phone })).toThrow("Australian mobile");
  });
  it.each([false, "true", undefined])("requires an explicit boolean SMS request %s", smsConsent => {
    expect(() => validateDemoSmsLead({ ...fixture, smsConsent })).toThrow("Confirm");
  });
  it.each(["appraisal", "objection", "send-all", ""])("rejects removed or forged intent %s", scenario => {
    expect(() => validateDemoSmsLead({ ...fixture, scenario })).toThrow("Just curious or Thinking of selling");
  });
  it.each(["", "<script>bad</script>", "x".repeat(201)])("rejects invalid property address %s", address => {
    expect(() => validateDemoSmsLead({ ...fixture, address })).toThrow("property address");
  });
  it("requires valid name and a known suburb", () => {
    expect(() => validateDemoSmsLead({ ...fixture, name: "user@example.com" })).toThrow("name");
    expect(() => validateDemoSmsLead({ ...fixture, suburb: "Forged" })).toThrow("suburb");
  });
  it("fails closed without a single configured server-side destination", () => {
    expect(isApprovedDemoRecipient("+61412345678", undefined)).toBe(false);
    expect(isApprovedDemoRecipient("+61412345678", "not configured")).toBe(false);
    expect(isApprovedDemoRecipient("+61412345678", "0412 345 678")).toBe(true);
    expect(isApprovedDemoRecipient("+61400000000", "0412 345 678")).toBe(false);
  });
});

describe("SMS demo release gate — no provider requests or persistence", () => {
  it("allows only the matching local development alias, never a production bypass", () => {
    expect(isDemoRequestOrigin("http://127.0.0.1:3015", "http://localhost:3015/api/seller-demo", true)).toBe(true);
    expect(isDemoRequestOrigin("http://127.0.0.1:3015", "http://localhost:3015/api/seller-demo", false)).toBe(false);
    expect(isDemoRequestOrigin("http://127.0.0.1:9999", "http://localhost:3015/api/seller-demo", true)).toBe(false);
    expect(isDemoRequestOrigin("https://other.example", "http://localhost:3015/api/seller-demo", true)).toBe(false);
    expect(isDemoRequestOrigin(null, "https://demo.example/api/seller-demo")).toBe(false);
    expect(isDemoRequestOrigin("invalid", "https://demo.example/api/seller-demo")).toBe(false);
  });
  it("rejects cross-origin requests", async () => {
    const response = await POST(makeRequest(fixture, { origin: "https://other.example" }));
    expect(response.status).toBe(403);
    expect((await responseBody(response)).code).toBe("ORIGIN_NOT_ALLOWED");
  });
  it("rejects malformed bodies and non-JSON content", async () => {
    expect((await POST(makeRequest(fixture, { "content-type": "text/plain" }))).status).toBe(415);
    const malformed = new Request("https://demo.example/api/seller-demo", { method: "POST", headers: { origin: "https://demo.example", "content-type": "application/json" }, body: "{" });
    expect((await POST(malformed)).status).toBe(400);
  });
  it("checks body size even without a content-length header", async () => {
    expect((await POST(makeRequest({ ...fixture, address: "x".repeat(9000) }))).status).toBe(413);
    expect((await POST(makeRequest(fixture, { "content-length": "9000" }))).status).toBe(413);
  });
  it("requires server configuration rather than trusting a client allowlist", async () => {
    vi.stubEnv("SELLER_DEMO_TEST_PHONE", "");
    const response = await POST(makeRequest({ ...fixture, allowedPhone: fixture.phone }));
    expect(response.status).toBe(503);
    expect((await responseBody(response)).code).toBe("TEST_RECIPIENT_NOT_CONFIGURED");
  });
  it("rejects all other numbers even when the client claims approval", async () => {
    vi.stubEnv("SELLER_DEMO_TEST_PHONE", "0412345678");
    const response = await POST(makeRequest({ ...fixture, phone: "0400000000", allowed: true }));
    expect(response.status).toBe(403);
    const result = await responseBody(response);
    expect(result.code).toBe("RECIPIENT_NOT_ALLOWED");
    expect(JSON.stringify(result)).not.toContain("61412345678");
  });
  it("never reports sent or calls a provider while the sender is missing", async () => {
    vi.stubEnv("SELLER_DEMO_TEST_PHONE", "0412345678");
    const network = vi.spyOn(globalThis, "fetch");
    vi.spyOn(console, "info").mockImplementation(() => {});
    const response = await POST(makeRequest());
    const result = await responseBody(response);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(result).toMatchObject({ accepted: false, state: "BLOCKED", code: "SMS_SENDER_NOT_CONNECTED" });
    expect(result.requestId).toBeTruthy();
    expect(network).not.toHaveBeenCalled();
  });
});
