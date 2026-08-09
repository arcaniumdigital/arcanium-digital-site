import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("funnel Worker and D1", () => {
  it("reports its safe service identity", async () => {
    const response = await SELF.fetch("https://funnel.test/");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ service: "arcanium-funnel", status: "ok" });
  });

  it("does not expose unknown endpoints", async () => {
    const response = await SELF.fetch("https://funnel.test/admin");
    expect(response.status).toBe(404);
  });

  it("rejects intake without an approved Origin", async () => {
    const response = await SELF.fetch("https://funnel.test/api/vendor-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    expect(response.status).toBe(403);
  });

  it("rejects forged Cal webhooks", async () => {
    const response = await SELF.fetch("https://funnel.test/webhooks/cal/bookings", { method: "POST", headers: { "Content-Type": "application/json", "x-cal-signature-256": "0".repeat(64) }, body: JSON.stringify({ triggerEvent: "BOOKING_CREATED" }) });
    expect(response.status).toBe(401);
  });

  it("hides the health endpoint behind a high-entropy token", async () => {
    const response = await SELF.fetch("https://funnel.test/health/funnel/not-the-token");
    expect(response.status).toBe(404);
  });

  it("installed every canonical table", async () => {
    const rows = await env.DB.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all<{ name: string }>();
    const names = new Set(rows.results.map((row) => row.name));
    for (const name of ["leads", "bookings", "message_jobs", "provider_jobs", "inbound_messages", "suppressions", "webhook_events", "funnel_events", "outbox", "funnel_incidents", "component_health", "canary_runs"]) expect(names.has(name)).toBe(true);
  });

  it("enforces canonical submission idempotency", async () => {
    const now = new Date().toISOString();
    const statement = (id: string) => env.DB.prepare(`INSERT INTO leads
      (id,public_id,submission_id,full_name,first_name,phone_e164,source_page,marketing_sms_consent,consent_version,consent_text,privacy_notice_version,consent_recorded_at,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,0,'v1','consent text that is sufficiently long','privacy-v1',?,?,?)`)
      .bind(id, `public_${id}`, "same-submission", "Test Agent", "Test", "+61412345678", "https://example.com", now, now, now);
    await statement("lead_one").run();
    await expect(statement("lead_two").run()).rejects.toThrow();
  });

  it("rolls back every statement when a D1 batch member fails", async () => {
    const before = Number((await env.DB.prepare("SELECT COUNT(*) count FROM canary_runs").first<{ count: number }>())?.count ?? 0);
    await expect(env.DB.batch([
      env.DB.prepare("INSERT INTO canary_runs (id,status,created_at,expires_at) VALUES ('atomic-canary','QUEUED',?,?)").bind(new Date().toISOString(), new Date(Date.now() + 60_000).toISOString()),
      env.DB.prepare("INSERT INTO canary_runs (id,status,created_at,expires_at) VALUES ('atomic-canary','QUEUED',?,?)").bind(new Date().toISOString(), new Date(Date.now() + 60_000).toISOString()),
    ])).rejects.toThrow();
    const after = Number((await env.DB.prepare("SELECT COUNT(*) count FROM canary_runs").first<{ count: number }>())?.count ?? 0);
    expect(after).toBe(before);
  });

  it("increments an abuse window and returns its count in one statement", async () => {
    const windowStart = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
    const increment = () => env.DB.prepare(`INSERT INTO abuse_windows (abuse_key, window_started_at, attempt_count, expires_at)
      VALUES ('test-abuse-key', ?, 1, ?)
      ON CONFLICT(abuse_key, window_started_at) DO UPDATE SET attempt_count = attempt_count + 1
      RETURNING attempt_count`).bind(windowStart, expiresAt).first<{ attempt_count: number }>();
    expect((await increment())?.attempt_count).toBe(1);
    expect((await increment())?.attempt_count).toBe(2);
  });
});
