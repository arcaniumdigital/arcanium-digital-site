import { createHmac, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { type Env, handleRequest } from "../src/index";

const secret = "access-checks-test-secret";
const env: Env = {
  ENVIRONMENT: "test",
  TEST_CLIENT_IDS: "TEST-0001,TEST-0002",
  ACCESS_CHECKS_HMAC_SECRET: secret,
  ALLOWED_CHECK_HOSTS: "arcaniumdigital.com,www.arcaniumdigital.com,status.arcaniumdigital.com",
  MAX_RESPONSE_BYTES: "262144",
  MAX_TIMEOUT_MS: "10000",
  REPLAY_WINDOW_SECONDS: "300",
  ALLOW_PRODUCTION_CHECKS: "false",
  ALLOW_HTTP_MUTATION: "false",
  ALLOW_CLIENT_ACTIVATION: "false",
  ALLOW_PUBLIC_SEND: "false",
};

const baseSite = {
  schema_version: "1.0",
  request_id: "access-site-1",
  idempotency_key: "access-site-idem-1",
  correlation_id: "access-correlation-1",
  client_id: "TEST-0001",
  environment: "test",
  check_type: "site",
  timeout_ms: 2000,
  url: "https://arcaniumdigital.com/",
  preferred_host: "arcaniumdigital.com",
  expected_canonical_origin: "https://arcaniumdigital.com",
} as const;

function signedRequest(path: string, body: unknown, nonce = randomUUID()): Request {
  const raw = JSON.stringify(body);
  const timestamp = new Date().toISOString();
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.${raw}`)
    .digest("hex");
  return new Request(`https://access.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-automation-timestamp": timestamp,
      "x-automation-nonce": nonce,
      "x-automation-signature": `sha256=${signature}`,
    },
    body: raw,
  });
}

describe("A1 access checks", () => {
  it("reports a stateless TEST-only health surface", async () => {
    const response = await handleRequest(new Request("https://access.test/health"), env);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: {
        environment: "test",
        hmac_configured: true,
        stateful_storage: false,
        production_actions_enabled: false,
      },
    });
  });

  it("requires a valid exact-body signature", async () => {
    const response = await handleRequest(new Request("https://access.test/check/site", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(baseSite),
    }), env);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "SIGNATURE_HEADERS_REQUIRED" },
    });
  });

  it("rejects nonce replay in the current isolate", async () => {
    const nonce = randomUUID();
    const fetcher = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/robots.txt") || url.endsWith("/sitemap.xml")) {
        return new Response("", { status: 200 });
      }
      return new Response(
        '<html><head><link rel="canonical" href="https://arcaniumdigital.com/"></head></html>',
        { status: 200, headers: { "content-type": "text/html" } },
      );
    };
    const first = await handleRequest(signedRequest("/check/site", baseSite, nonce), env, fetcher);
    const replay = await handleRequest(signedRequest("/check/site", baseSite, nonce), env, fetcher);
    expect(first.status).toBe(200);
    expect(replay.status).toBe(409);
    expect(await replay.json()).toMatchObject({ error: { code: "REPLAY_REJECTED" } });
  });

  it("validates HTTPS, preferred host, canonical, robots and sitemap", async () => {
    const fetcher = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/robots.txt") || url.endsWith("/sitemap.xml")) {
        return new Response("", { status: 200 });
      }
      return new Response(
        '<html><head><link rel="canonical" href="https://arcaniumdigital.com/"></head></html>',
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
      );
    };
    const response = await handleRequest(signedRequest("/check/site", baseSite), env, fetcher);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: {
        status: "healthy",
        classification: "none",
        retryable: false,
        preferred_host_match: true,
        canonical_origin_match: true,
        robots: { reachable: true, status_code: 200 },
        sitemap: { reachable: true, status_code: 200 },
        secret_redaction_applied: true,
      },
    });
  });

  it("fails a canonical-origin mismatch without retry", async () => {
    const fetcher = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/robots.txt") || url.endsWith("/sitemap.xml")) {
        return new Response("", { status: 200 });
      }
      return new Response(
        '<html><head><link rel="canonical" href="https://www.arcaniumdigital.com/"></head></html>',
        { status: 200, headers: { "content-type": "text/html" } },
      );
    };
    const response = await handleRequest(signedRequest("/check/site", baseSite), env, fetcher);
    expect(await response.json()).toMatchObject({
      data: {
        status: "failed",
        classification: "permanent",
        retryable: false,
        error_code: "CANONICAL_ORIGIN_MISMATCH",
      },
    });
  });

  it("blocks arbitrary hosts before any outbound request", async () => {
    let calls = 0;
    const response = await handleRequest(signedRequest("/check/site", {
      ...baseSite,
      url: "https://example.com/",
    }), env, async () => {
      calls += 1;
      return new Response("");
    });
    expect(response.status).toBe(400);
    expect(calls).toBe(0);
    expect(await response.json()).toMatchObject({ error: { code: "URL_NOT_ALLOWED" } });
  });

  it("blocks a redirect to a non-allowlisted host", async () => {
    const response = await handleRequest(signedRequest("/check/site", baseSite), env, async () =>
      new Response("", {
        status: 302,
        headers: { location: "https://example.com/private" },
      }));
    expect(await response.json()).toMatchObject({
      data: {
        status: "failed",
        classification: "security",
        retryable: false,
        error_code: "UNSAFE_REDIRECT",
      },
    });
  });

  it("classifies a temporary provider failure without exposing its body", async () => {
    const response = await handleRequest(signedRequest("/check/http-provider", {
      schema_version: "1.0",
      request_id: "provider-check-1",
      idempotency_key: "provider-check-idem-1",
      correlation_id: "provider-correlation-1",
      client_id: "TEST-0001",
      environment: "test",
      check_type: "http_provider",
      timeout_ms: 2000,
      provider: "status-api",
      url: "https://status.arcaniumdigital.com/health",
      method: "GET",
      expected_statuses: [200],
    }), {
      ...env,
      PROVIDER_AUTH_HEADERS_JSON: JSON.stringify({
        "status-api": { authorization: "Bearer never-return-this" },
      }),
    }, async (_input, init) => {
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer never-return-this");
      return new Response('{"token":"never-return-this","error":"down"}', {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    });
    const text = await response.text();
    expect(text).not.toContain("never-return-this");
    expect(JSON.parse(text)).toMatchObject({
      data: {
        status: "degraded",
        classification: "temporary",
        retryable: true,
        error_code: "HTTP_503",
        secret_redaction_applied: true,
      },
    });
  });

  it("rejects mutation methods and unknown fields", async () => {
    const response = await handleRequest(signedRequest("/check/http-provider", {
      schema_version: "1.0",
      request_id: "provider-check-2",
      idempotency_key: "provider-check-idem-2",
      correlation_id: "provider-correlation-2",
      client_id: "TEST-0001",
      environment: "test",
      check_type: "http_provider",
      timeout_ms: 2000,
      provider: "status-api",
      url: "https://status.arcaniumdigital.com/health",
      method: "POST",
      expected_statuses: [200],
    }), env);
    expect(response.status).toBe(405);
    expect(await response.json()).toMatchObject({ error: { code: "METHOD_NOT_ALLOWED" } });

    const unknown = await handleRequest(signedRequest("/check/site", {
      ...baseSite,
      authorization: "must-not-be-accepted",
    }), env);
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toMatchObject({ error: { code: "UNKNOWN_CHECK_FIELD" } });
  });

  it("keeps production checks disabled", async () => {
    const productionEnv: Env = { ...env, ENVIRONMENT: "production" };
    const response = await handleRequest(signedRequest("/check/site", {
      ...baseSite,
      environment: "production",
    }), productionEnv);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "PRODUCTION_CHECKS_DISABLED" },
    });
  });
});
