export interface Env {
  ENVIRONMENT: "test" | "production";
  TEST_CLIENT_IDS: string;
  ACCESS_CHECKS_HMAC_SECRET?: string;
  ALLOWED_CHECK_HOSTS: string;
  MAX_RESPONSE_BYTES: string;
  MAX_TIMEOUT_MS: string;
  REPLAY_WINDOW_SECONDS: string;
  PROVIDER_AUTH_HEADERS_JSON?: string;
  ALLOW_PRODUCTION_CHECKS: "true" | "false";
  ALLOW_HTTP_MUTATION: "true" | "false";
  ALLOW_CLIENT_ACTIVATION: "true" | "false";
  ALLOW_PUBLIC_SEND: "true" | "false";
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type Classification = "none" | "temporary" | "permanent" | "security";
type CheckStatus = "healthy" | "degraded" | "failed";

interface BaseCheck {
  schema_version: "1.0";
  request_id: string;
  idempotency_key: string;
  correlation_id: string;
  client_id: string;
  environment: "test" | "production";
  check_type: "site" | "http_provider";
  timeout_ms: number;
}

interface SiteCheck extends BaseCheck {
  check_type: "site";
  url: string;
  preferred_host: string;
  expected_canonical_origin?: string;
  robots_url?: string;
  sitemap_url?: string;
}

interface ProviderCheck extends BaseCheck {
  check_type: "http_provider";
  provider: string;
  url: string;
  method: "GET" | "HEAD";
  expected_statuses: number[];
}

type AccessCheck = SiteCheck | ProviderCheck;

const encoder = new TextEncoder();
const nonceExpiries = new Map<string, number>();
const ID_MAX = 120;
const PROVIDER_MAX = 80;
const SITE_FIELDS = new Set([
  "schema_version", "request_id", "idempotency_key", "correlation_id",
  "client_id", "environment", "check_type", "timeout_ms", "url",
  "preferred_host", "expected_canonical_origin", "robots_url", "sitemap_url",
]);
const PROVIDER_FIELDS = new Set([
  "schema_version", "request_id", "idempotency_key", "correlation_id",
  "client_id", "environment", "check_type", "timeout_ms", "provider", "url",
  "method", "expected_statuses",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown, max = ID_MAX): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;
const encode = (value: string): ArrayBuffer =>
  encoder.encode(value).buffer as ArrayBuffer;
const hex = (buffer: ArrayBuffer): string =>
  [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function failure(code: string, status: number): Response {
  return json({ ok: false, error: { code } }, status);
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function verifySignature(request: Request, raw: string, env: Env): Promise<Response | null> {
  const secret = env.ACCESS_CHECKS_HMAC_SECRET;
  const timestamp = request.headers.get("X-Automation-Timestamp");
  const nonce = request.headers.get("X-Automation-Nonce");
  const supplied = request.headers.get("X-Automation-Signature");
  if (!secret) return failure("SERVER_HMAC_NOT_CONFIGURED", 500);
  if (!timestamp || !nonce || !supplied) return failure("SIGNATURE_HEADERS_REQUIRED", 401);
  if (!isString(nonce)) return failure("INVALID_NONCE", 400);

  const replaySeconds = Number(env.REPLAY_WINDOW_SECONDS);
  const timestampMs = Date.parse(timestamp);
  if (
    !Number.isFinite(replaySeconds)
    || replaySeconds < 1
    || !Number.isFinite(timestampMs)
    || Math.abs(Date.now() - timestampMs) > replaySeconds * 1000
  ) {
    return failure("TIMESTAMP_OUT_OF_WINDOW", 401);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = hex(
    await crypto.subtle.sign("HMAC", key, encode(`${timestamp}.${nonce}.${raw}`)),
  );
  const signature = supplied.replace(/^sha256[:=]/i, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(signature) || !constantTimeEqual(expected, signature)) {
    return failure("INVALID_SIGNATURE", 401);
  }

  const currentSeconds = Math.floor(Date.now() / 1000);
  for (const [storedNonce, expiresAt] of nonceExpiries) {
    if (expiresAt <= currentSeconds) nonceExpiries.delete(storedNonce);
  }
  if (nonceExpiries.has(nonce)) return failure("REPLAY_REJECTED", 409);
  nonceExpiries.set(nonce, currentSeconds + replaySeconds);
  return null;
}

function allowedClients(env: Env): string[] {
  return env.TEST_CLIENT_IDS.split(",").map((value) => value.trim()).filter(Boolean);
}

function allowedHosts(env: Env): Set<string> {
  return new Set(
    env.ALLOWED_CHECK_HOSTS.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function safeUrl(value: unknown, hosts: Set<string>): URL | null {
  if (!isString(value, 2048)) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || (url.port && url.port !== "443")
      || !hosts.has(url.hostname.toLowerCase())
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function validateCandidate(candidate: unknown, env: Env): AccessCheck | string {
  if (!isRecord(candidate)) return "INVALID_CHECK";
  const fieldSet = candidate.check_type === "site" ? SITE_FIELDS : PROVIDER_FIELDS;
  if (Object.keys(candidate).some((key) => !fieldSet.has(key))) return "UNKNOWN_CHECK_FIELD";
  for (const field of [
    "schema_version", "request_id", "idempotency_key", "correlation_id",
    "client_id", "environment", "check_type",
  ]) {
    if (!isString(candidate[field])) return "INVALID_CHECK";
  }
  if (candidate.schema_version !== "1.0") return "INVALID_SCHEMA_VERSION";
  if (candidate.environment !== env.ENVIRONMENT) return "ENVIRONMENT_MISMATCH";
  if (!allowedClients(env).includes(candidate.client_id as string)) return "CLIENT_NOT_ALLOWED";
  if (env.ENVIRONMENT === "production" && env.ALLOW_PRODUCTION_CHECKS !== "true") {
    return "PRODUCTION_CHECKS_DISABLED";
  }
  const timeout = candidate.timeout_ms;
  const maxTimeout = Number(env.MAX_TIMEOUT_MS);
  if (
    !Number.isInteger(timeout)
    || (timeout as number) < 250
    || !Number.isFinite(maxTimeout)
    || (timeout as number) > maxTimeout
  ) {
    return "INVALID_TIMEOUT";
  }
  const hosts = allowedHosts(env);
  if (!safeUrl(candidate.url, hosts)) return "URL_NOT_ALLOWED";

  if (candidate.check_type === "site") {
    if (!isString(candidate.preferred_host, 253)) return "INVALID_PREFERRED_HOST";
    if (!hosts.has((candidate.preferred_host as string).toLowerCase())) {
      return "PREFERRED_HOST_NOT_ALLOWED";
    }
    for (const field of ["expected_canonical_origin", "robots_url", "sitemap_url"]) {
      if (candidate[field] !== undefined && !safeUrl(candidate[field], hosts)) {
        return "URL_NOT_ALLOWED";
      }
    }
    return candidate as unknown as SiteCheck;
  }

  if (candidate.check_type !== "http_provider") return "INVALID_CHECK_TYPE";
  if (!isString(candidate.provider, PROVIDER_MAX)) return "INVALID_PROVIDER";
  if (candidate.method !== "GET" && candidate.method !== "HEAD") return "METHOD_NOT_ALLOWED";
  if (
    !Array.isArray(candidate.expected_statuses)
    || candidate.expected_statuses.length < 1
    || candidate.expected_statuses.length > 10
    || candidate.expected_statuses.some(
      (status) => !Number.isInteger(status) || status < 100 || status > 599,
    )
  ) {
    return "INVALID_EXPECTED_STATUSES";
  }
  return candidate as unknown as ProviderCheck;
}

function providerHeaders(provider: string, env: Env): Headers {
  const headers = new Headers({
    "accept": "application/json,text/plain,*/*",
    "user-agent": "ArcaniumAccessChecks/0.1",
  });
  if (!env.PROVIDER_AUTH_HEADERS_JSON) return headers;
  try {
    const configured = JSON.parse(env.PROVIDER_AUTH_HEADERS_JSON) as unknown;
    if (!isRecord(configured) || !isRecord(configured[provider])) return headers;
    for (const [name, value] of Object.entries(configured[provider] as Record<string, unknown>)) {
      if (
        isString(name, 80)
        && isString(value, 4096)
        && !["host", "content-length", "cookie"].includes(name.toLowerCase())
      ) {
        headers.set(name, value);
      }
    }
  } catch {
    // A malformed optional secret disables only the provider-auth branch.
  }
  return headers;
}

async function fetchWithRedirects(
  input: URL,
  init: RequestInit,
  env: Env,
  fetcher: Fetcher,
): Promise<{ response: Response; finalUrl: URL; redirects: number }> {
  let current = input;
  const hosts = allowedHosts(env);
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const response = await fetcher(current, { ...init, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return { response, finalUrl: current, redirects };
    }
    const location = response.headers.get("location");
    if (!location) return { response, finalUrl: current, redirects };
    const next = safeUrl(new URL(location, current).toString(), hosts);
    if (!next) throw new Error("UNSAFE_REDIRECT");
    current = next;
  }
  throw new Error("TOO_MANY_REDIRECTS");
}

async function limitedText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let output = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    received += chunk.value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error("RESPONSE_TOO_LARGE");
    }
    output += decoder.decode(chunk.value, { stream: true });
  }
  return output + decoder.decode();
}

function classifyStatus(status: number): {
  classification: Classification;
  retryable: boolean;
  status: CheckStatus;
  errorCode: string | null;
} {
  if (status >= 200 && status < 300) {
    return { classification: "none", retryable: false, status: "healthy", errorCode: null };
  }
  if (status === 408 || status === 425 || status === 429 || status >= 500) {
    return {
      classification: "temporary",
      retryable: true,
      status: "degraded",
      errorCode: `HTTP_${status}`,
    };
  }
  return {
    classification: status === 401 || status === 403 ? "security" : "permanent",
    retryable: false,
    status: "failed",
    errorCode: `HTTP_${status}`,
  };
}

async function checkReachable(
  url: URL,
  timeoutMs: number,
  env: Env,
  fetcher: Fetcher,
): Promise<{ reachable: boolean; status_code: number | null; error_code: string | null }> {
  try {
    const { response } = await fetchWithRedirects(
      url,
      { method: "GET", signal: AbortSignal.timeout(timeoutMs) },
      env,
      fetcher,
    );
    return {
      reachable: response.status >= 200 && response.status < 400,
      status_code: response.status,
      error_code: response.status >= 400 ? `HTTP_${response.status}` : null,
    };
  } catch (error) {
    const code = error instanceof Error && [
      "UNSAFE_REDIRECT", "TOO_MANY_REDIRECTS", "RESPONSE_TOO_LARGE",
    ].includes(error.message)
      ? error.message
      : "NETWORK_OR_TIMEOUT";
    return { reachable: false, status_code: null, error_code: code };
  }
}

async function runSiteCheck(check: SiteCheck, env: Env, fetcher: Fetcher): Promise<Response> {
  const startedAt = Date.now();
  const maxBytes = Number(env.MAX_RESPONSE_BYTES);
  try {
    const initialUrl = safeUrl(check.url, allowedHosts(env))!;
    const { response, finalUrl, redirects } = await fetchWithRedirects(
      initialUrl,
      {
        method: "GET",
        headers: { "accept": "text/html,application/xhtml+xml" },
        signal: AbortSignal.timeout(check.timeout_ms),
      },
      env,
      fetcher,
    );
    const classified = classifyStatus(response.status);
    const contentType = response.headers.get("content-type")?.split(";")[0] ?? null;
    let canonicalOrigin: string | null = null;
    let bodyError: string | null = null;
    if (response.ok && contentType?.includes("text/html")) {
      try {
        const text = await limitedText(response, maxBytes);
        const match = text.match(
          /<link\b[^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'][^>]*\bhref=["']([^"']+)["'][^>]*>|<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'][^>]*>/i,
        );
        const value = match?.[1] ?? match?.[2];
        if (value) canonicalOrigin = new URL(value, finalUrl).origin;
      } catch (error) {
        bodyError = error instanceof Error && error.message === "RESPONSE_TOO_LARGE"
          ? "RESPONSE_TOO_LARGE"
          : "BODY_READ_FAILED";
      }
    }
    const preferredHostMatch = finalUrl.hostname.toLowerCase() === check.preferred_host.toLowerCase();
    const expectedOrigin = check.expected_canonical_origin
      ? safeUrl(check.expected_canonical_origin, allowedHosts(env))?.origin ?? null
      : null;
    const canonicalMatch = expectedOrigin ? canonicalOrigin === expectedOrigin : null;
    const robotsUrl = safeUrl(
      check.robots_url ?? new URL("/robots.txt", finalUrl).toString(),
      allowedHosts(env),
    )!;
    const sitemapUrl = safeUrl(
      check.sitemap_url ?? new URL("/sitemap.xml", finalUrl).toString(),
      allowedHosts(env),
    )!;
    const [robots, sitemap] = await Promise.all([
      checkReachable(robotsUrl, check.timeout_ms, env, fetcher),
      checkReachable(sitemapUrl, check.timeout_ms, env, fetcher),
    ]);
    const structuralFailure = !preferredHostMatch || canonicalMatch === false;
    const ancillaryFailure = !robots.reachable || !sitemap.reachable || Boolean(bodyError);
    const status: CheckStatus = classified.status === "failed" || structuralFailure
      ? "failed"
      : classified.status === "degraded" || ancillaryFailure
        ? "degraded"
        : "healthy";
    return json({
      ok: true,
      data: {
        schema_version: "1.0",
        request_id: check.request_id,
        idempotency_key: check.idempotency_key,
        correlation_id: check.correlation_id,
        client_id: check.client_id,
        environment: check.environment,
        check_type: check.check_type,
        status,
        classification: structuralFailure ? "permanent" : classified.classification,
        retryable: structuralFailure ? false : classified.retryable,
        error_code: bodyError ?? (
          !preferredHostMatch ? "PREFERRED_HOST_MISMATCH"
            : canonicalMatch === false ? "CANONICAL_ORIGIN_MISMATCH"
              : classified.errorCode
        ),
        checked_at: new Date().toISOString(),
        latency_ms: Date.now() - startedAt,
        http_status: response.status,
        final_origin: finalUrl.origin,
        preferred_host_match: preferredHostMatch,
        canonical_origin: canonicalOrigin,
        canonical_origin_match: canonicalMatch,
        redirects,
        content_type: contentType,
        robots,
        sitemap,
        secret_redaction_applied: true,
      },
    });
  } catch (error) {
    const known = error instanceof Error && [
      "UNSAFE_REDIRECT", "TOO_MANY_REDIRECTS", "RESPONSE_TOO_LARGE",
    ].includes(error.message)
      ? error.message
      : "NETWORK_OR_TIMEOUT";
    const security = known === "UNSAFE_REDIRECT";
    return json({
      ok: true,
      data: {
        schema_version: "1.0",
        request_id: check.request_id,
        idempotency_key: check.idempotency_key,
        correlation_id: check.correlation_id,
        client_id: check.client_id,
        environment: check.environment,
        check_type: check.check_type,
        status: "failed",
        classification: security ? "security" : "temporary",
        retryable: !security,
        error_code: known,
        checked_at: new Date().toISOString(),
        latency_ms: Date.now() - startedAt,
        secret_redaction_applied: true,
      },
    });
  }
}

async function runProviderCheck(check: ProviderCheck, env: Env, fetcher: Fetcher): Promise<Response> {
  const startedAt = Date.now();
  try {
    const url = safeUrl(check.url, allowedHosts(env))!;
    const { response, finalUrl, redirects } = await fetchWithRedirects(
      url,
      {
        method: check.method,
        headers: providerHeaders(check.provider, env),
        signal: AbortSignal.timeout(check.timeout_ms),
      },
      env,
      fetcher,
    );
    const expected = check.expected_statuses.includes(response.status);
    const classified = expected
      ? { classification: "none" as const, retryable: false, status: "healthy" as const, errorCode: null }
      : classifyStatus(response.status);
    return json({
      ok: true,
      data: {
        schema_version: "1.0",
        request_id: check.request_id,
        idempotency_key: check.idempotency_key,
        correlation_id: check.correlation_id,
        client_id: check.client_id,
        environment: check.environment,
        check_type: check.check_type,
        provider: check.provider,
        status: classified.status,
        classification: classified.classification,
        retryable: classified.retryable,
        error_code: classified.errorCode,
        checked_at: new Date().toISOString(),
        latency_ms: Date.now() - startedAt,
        http_status: response.status,
        final_origin: finalUrl.origin,
        redirects,
        content_type: response.headers.get("content-type")?.split(";")[0] ?? null,
        secret_redaction_applied: true,
      },
    });
  } catch (error) {
    const known = error instanceof Error && error.message === "UNSAFE_REDIRECT"
      ? "UNSAFE_REDIRECT"
      : "NETWORK_OR_TIMEOUT";
    return json({
      ok: true,
      data: {
        schema_version: "1.0",
        request_id: check.request_id,
        idempotency_key: check.idempotency_key,
        correlation_id: check.correlation_id,
        client_id: check.client_id,
        environment: check.environment,
        check_type: check.check_type,
        provider: check.provider,
        status: "failed",
        classification: known === "UNSAFE_REDIRECT" ? "security" : "temporary",
        retryable: known !== "UNSAFE_REDIRECT",
        error_code: known,
        checked_at: new Date().toISOString(),
        latency_ms: Date.now() - startedAt,
        secret_redaction_applied: true,
      },
    });
  }
}

function health(env: Env): Response {
  const safety = {
    production_checks: env.ALLOW_PRODUCTION_CHECKS,
    http_mutation: env.ALLOW_HTTP_MUTATION,
    client_activation: env.ALLOW_CLIENT_ACTIVATION,
    public_send: env.ALLOW_PUBLIC_SEND,
  };
  return json({
    ok: true,
    data: {
      service: "arcanium-access-checks",
      version: "0.1.0",
      environment: env.ENVIRONMENT,
      hmac_configured: Boolean(env.ACCESS_CHECKS_HMAC_SECRET),
      stateful_storage: false,
      production_actions_enabled: Object.values(safety).some((value) => value === "true"),
      safety,
    },
  });
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetcher: Fetcher = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") return health(env);
  if (
    request.method !== "POST"
    || (url.pathname !== "/check/site" && url.pathname !== "/check/http-provider")
  ) {
    return failure("NOT_FOUND", 404);
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return failure("CONTENT_TYPE_REQUIRED", 415);
  }
  const raw = await request.text();
  if (encode(raw).byteLength > Number(env.MAX_RESPONSE_BYTES)) {
    return failure("PAYLOAD_TOO_LARGE", 413);
  }
  const authFailure = await verifySignature(request, raw, env);
  if (authFailure) return authFailure;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("INVALID_JSON", 400);
  }
  const validated = validateCandidate(parsed, env);
  if (typeof validated === "string") {
    const status = validated === "CLIENT_NOT_ALLOWED"
      || validated === "ENVIRONMENT_MISMATCH"
      || validated === "PRODUCTION_CHECKS_DISABLED"
      ? 403
      : validated === "METHOD_NOT_ALLOWED"
        ? 405
        : 400;
    return failure(validated, status);
  }
  if (
    (url.pathname === "/check/site" && validated.check_type !== "site")
    || (url.pathname === "/check/http-provider" && validated.check_type !== "http_provider")
  ) {
    return failure("CHECK_TYPE_ROUTE_MISMATCH", 400);
  }
  return validated.check_type === "site"
    ? runSiteCheck(validated, env, fetcher)
    : runProviderCheck(validated, env, fetcher);
}

export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
} satisfies ExportedHandler<Env>;
