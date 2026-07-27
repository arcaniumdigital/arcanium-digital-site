import { describe, expect, it } from "vitest";
import platformCore, { type Env } from "../src/index";

const secret = "fixture-event-hmac-secret";

async function sign(timestamp: string, nonce: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${nonce}.${body}`),
  ));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

class FakeStatement {
  private args: unknown[] = [];

  constructor(private readonly database: FakeDatabase, private readonly sql: string) {}

  bind(...args: unknown[]): FakeStatement {
    this.args = args;
    return this;
  }

  async first<T>(): Promise<T | null> {
    if (!this.sql.includes("FROM platform_event_verifications")) return null;
    const key = this.args.slice(0, 3).join(":");
    const eventId = this.database.verifications.get(key);
    return (eventId ? { event_id: eventId } : null) as T | null;
  }

  async run(): Promise<{ meta: { changes: number } }> {
    if (this.sql.includes("INTO a12_nonce")) {
      const nonce = String(this.args[0]);
      if (this.database.nonces.has(nonce)) return { meta: { changes: 0 } };
      this.database.nonces.add(nonce);
      return { meta: { changes: 1 } };
    }
    if (this.sql.includes("INTO platform_event_verifications")) {
      const key = this.args.slice(0, 3).join(":");
      this.database.verifications.set(key, String(this.args[3]));
      return { meta: { changes: 1 } };
    }
    throw new Error(`Unexpected SQL in verification fixture: ${this.sql}`);
  }
}

class FakeDatabase {
  readonly nonces = new Set<string>();
  readonly verifications = new Map<string, string>();

  prepare(sql: string): FakeStatement {
    return new FakeStatement(this, sql);
  }
}

function buildEnv(database: FakeDatabase): Env {
  return {
    ENVIRONMENT: "test",
    EVENT_HMAC_SECRET: secret,
    TEST_CLIENT_IDS: "TEST-0001",
    MAX_EVENT_BYTES: "65536",
    REPLAY_WINDOW_SECONDS: "300",
    PLATFORM_OPS_DB: database,
  } as unknown as Env;
}

const event = {
  schema_version: "1.0",
  event_id: "event-verify-1",
  idempotency_key: "idem-verify-1",
  correlation_id: "corr-verify-1",
  automation_id: "A12",
  event_type: "system.verification.fixture",
  client_id: "TEST-0001",
  environment: "test",
  occurred_at: "2026-07-27T00:00:00.000Z",
  severity: "info",
  payload: { test_only: true },
};

async function requestFor(body: string, nonce: string, correlationId = event.correlation_id): Promise<Request> {
  const timestamp = new Date().toISOString();
  const signature = await sign(timestamp, nonce, body);
  return new Request("https://platform.test/v1/platform/events/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Automation-Timestamp": timestamp,
      "X-Automation-Nonce": nonce,
      "X-Automation-Signature": `sha256:${signature}`,
      "X-Correlation-ID": correlationId,
    },
    body,
  });
}

describe("shared event verification endpoint", () => {
  it("verifies once and deduplicates by environment, client and idempotency key", async () => {
    const database = new FakeDatabase();
    const env = buildEnv(database);
    const body = JSON.stringify(event);

    const first = await platformCore.fetch(await requestFor(body, "nonce-verify-1"), env);
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ ok: true, data: { verified: true, deduplicated: false } });

    const second = await platformCore.fetch(await requestFor(body, "nonce-verify-2"), env);
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ ok: true, data: { verified: true, deduplicated: true } });
    expect(database.verifications.size).toBe(1);
  });

  it("rejects a correlation mismatch without persisting a verification", async () => {
    const database = new FakeDatabase();
    const response = await platformCore.fetch(
      await requestFor(JSON.stringify(event), "nonce-correlation", "corr-wrong"),
      buildEnv(database),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "CORRELATION_ID_MISMATCH" } });
    expect(database.verifications.size).toBe(0);
  });

  it("rejects nested cross-client references without persisting a verification", async () => {
    const database = new FakeDatabase();
    const body = JSON.stringify({ ...event, payload: { referenced_client_id: "TEST-0002" } });
    const response = await platformCore.fetch(await requestFor(body, "nonce-cross-client"), buildEnv(database));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "CROSS_CLIENT_REFERENCE" } });
    expect(database.verifications.size).toBe(0);
  });

  it("rejects an oversized body before consuming a nonce", async () => {
    const database = new FakeDatabase();
    const body = JSON.stringify({ ...event, payload: { padding: "x".repeat(65_536) } });
    const response = await platformCore.fetch(await requestFor(body, "nonce-oversized"), buildEnv(database));
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "PAYLOAD_TOO_LARGE" } });
    expect(database.nonces.size).toBe(0);
  });
});
