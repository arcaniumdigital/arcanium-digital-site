import {
  analyzeLiveHtml,
  isRecord,
  parsePreflightRequest,
  parsePublicationResult,
  safePublicationUrl,
  validatePreflight,
  type PreflightRequest,
  type PublicationResultRequest,
} from "./domain";

export interface Env {
  ENVIRONMENT: "test" | "production";
  TEST_CLIENT_IDS: string;
  ALLOWED_PUBLICATION_HOSTS: string;
  MAX_REQUEST_BYTES: string;
  MAX_HTML_BYTES: string;
  MAX_TIMEOUT_MS: string;
  MAX_OPERATOR_ACTIONS: string;
  PREFLIGHT_TTL_SECONDS: string;
  REPLAY_WINDOW_SECONDS: string;
  PREFLIGHT_HMAC_SECRET?: string;
  ALLOW_SANITY_PUBLISH: "true" | "false";
  ALLOW_SANITY_UNPUBLISH: "true" | "false";
  ALLOW_INDEXNOW_SUBMIT: "true" | "false";
  ALLOW_WEBSITE_REVALIDATION: "true" | "false";
  ALLOW_LLM_REVIEW: "true" | "false";
  ALLOW_PUBLIC_SEND: "true" | "false";
  PUBLICATION_DB: D1Database;
}

interface TokenClaims {
  version: "1";
  environment: string;
  client_id: string;
  document_id: string;
  revision_id: string;
  action: string;
  url: string;
  idempotency_key: string;
  expires_at: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function failure(code: string, status: number, details?: unknown): Response {
  return json({ ok: false, error: { code, details } }, status);
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function base64Url(value: string): string {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return decoder.decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function allowedClients(env: Env): string[] {
  return env.TEST_CLIENT_IDS.split(",").map((value) => value.trim()).filter(Boolean);
}

function allowedHosts(env: Env): Set<string> {
  return new Set(
    env.ALLOWED_PUBLICATION_HOSTS.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function readSignedBody(request: Request, env: Env): Promise<{ raw: string; parsed: unknown } | Response> {
  const maxBytes = Number(env.MAX_REQUEST_BYTES);
  const raw = await request.text();
  if (!Number.isFinite(maxBytes) || maxBytes < 1 || encoder.encode(raw).byteLength > maxBytes) {
    return failure("PAYLOAD_TOO_LARGE", 413);
  }
  const secret = env.PREFLIGHT_HMAC_SECRET;
  const timestamp = request.headers.get("x-automation-timestamp");
  const nonce = request.headers.get("x-automation-nonce");
  const supplied = request.headers.get("x-automation-signature");
  if (!secret) return failure("PREFLIGHT_HMAC_NOT_CONFIGURED", 500);
  if (!timestamp || !nonce || !supplied || nonce.length > 120) {
    return failure("SIGNATURE_HEADERS_REQUIRED", 401);
  }
  const replayWindow = Number(env.REPLAY_WINDOW_SECONDS);
  const timestampMs = Date.parse(timestamp);
  if (
    !Number.isFinite(replayWindow)
    || replayWindow < 1
    || !Number.isFinite(timestampMs)
    || Math.abs(Date.now() - timestampMs) > replayWindow * 1000
  ) {
    return failure("TIMESTAMP_OUT_OF_WINDOW", 401);
  }
  const signature = supplied.replace(/^sha256[:=]/i, "").toLowerCase();
  const expected = await hmac(secret, `${timestamp}.${nonce}.${raw}`);
  if (!/^[a-f0-9]{64}$/.test(signature) || !constantTimeEqual(signature, expected)) {
    return failure("INVALID_SIGNATURE", 401);
  }
  const expiry = Math.floor(timestampMs / 1000) + replayWindow;
  try {
    await env.PUBLICATION_DB.prepare(
      "INSERT INTO publication_nonces(nonce, expires_at) VALUES(?, ?)",
    ).bind(nonce, expiry).run();
  } catch {
    return failure("REPLAY_REJECTED", 409);
  }
  await env.PUBLICATION_DB.prepare("DELETE FROM publication_nonces WHERE expires_at <= ?")
    .bind(Math.floor(Date.now() / 1000))
    .run();
  try {
    return { raw, parsed: JSON.parse(raw) };
  } catch {
    return failure("INVALID_JSON", 400);
  }
}

function preflightIdentityFailure(candidate: PreflightRequest, env: Env): string | null {
  if (candidate.environment !== env.ENVIRONMENT) return "ENVIRONMENT_MISMATCH";
  if (!allowedClients(env).includes(candidate.client_id)) return "CLIENT_NOT_ALLOWED";
  if (env.ENVIRONMENT === "production") return "PRODUCTION_PREFLIGHT_DISABLED";
  return null;
}

async function createToken(request: PreflightRequest, env: Env): Promise<{ token: string; expiresAt: string }> {
  const ttl = Number(env.PREFLIGHT_TTL_SECONDS);
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  const claims: TokenClaims = {
    version: "1",
    environment: request.environment,
    client_id: request.client_id,
    document_id: request.document_id,
    revision_id: request.revision_id,
    action: request.action,
    url: request.url,
    idempotency_key: request.idempotency_key,
    expires_at: expiresAt,
  };
  const payload = base64Url(JSON.stringify(claims));
  const signature = await hmac(env.PREFLIGHT_HMAC_SECRET!, payload);
  return { token: `${payload}.${signature}`, expiresAt };
}

async function handlePreflight(request: Request, env: Env): Promise<Response> {
  const signed = await readSignedBody(request, env);
  if (signed instanceof Response) return signed;
  const parsed = parsePreflightRequest(signed.parsed);
  if (typeof parsed === "string") return failure(parsed, 400);
  const identityFailure = preflightIdentityFailure(parsed, env);
  if (identityFailure) return failure(identityFailure, 403);

  const existingOwner = await env.PUBLICATION_DB.prepare(
    `SELECT document_id FROM publication_url_registry
     WHERE environment = ? AND client_id = ? AND url = ?`,
  ).bind(parsed.environment, parsed.client_id, parsed.url).first<{ document_id: string }>();
  const validation = validatePreflight(parsed, {
    allowedHosts: allowedHosts(env),
    maxOperatorActions: Number(env.MAX_OPERATOR_ACTIONS),
  });
  if (existingOwner && existingOwner.document_id !== parsed.document_id) {
    validation.passed = false;
    validation.issues.push({
      code: "URL_OWNED_BY_OTHER_DOCUMENT",
      severity: "error",
      field: "url",
      safe_summary: "The publication URL is already owned by another document.",
      approval_required: false,
    });
  }
  if (!validation.passed) {
    return json({ ok: true, data: { ...validation, preflight_token: null } }, 200);
  }
  const { token, expiresAt } = await createToken(parsed, env);
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  await env.PUBLICATION_DB.prepare(
    `INSERT INTO publication_preflights(
       environment, client_id, document_id, revision_id, action, url,
       idempotency_key, token_hash, status, issue_count, expires_at, created_at
     ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, 'issued', 0, ?, ?)
     ON CONFLICT(environment, client_id, document_id, revision_id, action)
     DO UPDATE SET idempotency_key = excluded.idempotency_key,
       token_hash = excluded.token_hash, status = 'issued', issue_count = 0,
       expires_at = excluded.expires_at, created_at = excluded.created_at,
       consumed_at = NULL`,
  ).bind(
    parsed.environment,
    parsed.client_id,
    parsed.document_id,
    parsed.revision_id,
    parsed.action,
    parsed.url,
    parsed.idempotency_key,
    tokenHash,
    expiresAt,
    now,
  ).run();
  return json({
    ok: true,
    data: {
      ...validation,
      preflight_token: token,
      expires_at: expiresAt,
      token_binding: {
        document_id: parsed.document_id,
        revision_id: parsed.revision_id,
        action: parsed.action,
        url: parsed.url,
      },
      llm_review_enabled: env.ALLOW_LLM_REVIEW === "true",
    },
  });
}

function parseToken(token: unknown): { payload: string; signature: string; claims: TokenClaims } | null {
  if (typeof token !== "string" || token.length > 5000) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !/^[a-f0-9]{64}$/.test(signature)) return null;
  try {
    const candidate = JSON.parse(decodeBase64Url(payload)) as unknown;
    if (
      !isRecord(candidate)
      || candidate.version !== "1"
      || typeof candidate.environment !== "string"
      || typeof candidate.client_id !== "string"
      || typeof candidate.document_id !== "string"
      || typeof candidate.revision_id !== "string"
      || typeof candidate.action !== "string"
      || typeof candidate.url !== "string"
      || typeof candidate.idempotency_key !== "string"
      || typeof candidate.expires_at !== "string"
    ) {
      return null;
    }
    return { payload, signature, claims: candidate as unknown as TokenClaims };
  } catch {
    return null;
  }
}

async function handleConsume(request: Request, env: Env): Promise<Response> {
  const signed = await readSignedBody(request, env);
  if (signed instanceof Response) return signed;
  if (!isRecord(signed.parsed)) return failure("INVALID_TOKEN_REQUEST", 400);
  const parsed = parseToken(signed.parsed.preflight_token);
  if (!parsed) return failure("INVALID_PREFLIGHT_TOKEN", 401);
  const expected = await hmac(env.PREFLIGHT_HMAC_SECRET!, parsed.payload);
  if (!constantTimeEqual(parsed.signature, expected)) return failure("INVALID_PREFLIGHT_TOKEN", 401);
  if (Date.parse(parsed.claims.expires_at) <= Date.now()) return failure("PREFLIGHT_TOKEN_EXPIRED", 401);
  for (const field of ["client_id", "document_id", "revision_id", "action", "url"] as const) {
    if (signed.parsed[field] !== parsed.claims[field]) return failure("PREFLIGHT_TOKEN_BINDING_MISMATCH", 409);
  }
  const tokenHash = await sha256(signed.parsed.preflight_token as string);
  const consumed = await env.PUBLICATION_DB.prepare(
    `UPDATE publication_preflights SET status = 'consumed', consumed_at = ?
     WHERE environment = ? AND client_id = ? AND document_id = ?
       AND revision_id = ? AND action = ? AND token_hash = ? AND status = 'issued'`,
  ).bind(
    new Date().toISOString(),
    parsed.claims.environment,
    parsed.claims.client_id,
    parsed.claims.document_id,
    parsed.claims.revision_id,
    parsed.claims.action,
    tokenHash,
  ).run();
  if (consumed.meta.changes !== 1) return failure("PREFLIGHT_TOKEN_NOT_ISSUED", 409);
  return json({
    ok: true,
    data: {
      consumed: true,
      token_binding: parsed.claims,
      publish_permitted: parsed.claims.action === "publish" && env.ALLOW_SANITY_PUBLISH === "true",
      unpublish_permitted: parsed.claims.action === "unpublish" && env.ALLOW_SANITY_UNPUBLISH === "true",
    },
  });
}

async function limitedHtml(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    received += chunk.value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error("HTML_TOO_LARGE");
    }
    chunks.push(chunk.value);
  }
  const output = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return decoder.decode(output);
}

async function handleLiveVerify(request: Request, env: Env): Promise<Response> {
  const signed = await readSignedBody(request, env);
  if (signed instanceof Response) return signed;
  if (!isRecord(signed.parsed)) return failure("INVALID_LIVE_VERIFY", 400);
  const clientId = signed.parsed.client_id;
  const environment = signed.parsed.environment;
  if (environment !== env.ENVIRONMENT) return failure("ENVIRONMENT_MISMATCH", 403);
  if (typeof clientId !== "string" || !allowedClients(env).includes(clientId)) {
    return failure("CLIENT_NOT_ALLOWED", 403);
  }
  const pageUrl = safePublicationUrl(signed.parsed.url, allowedHosts(env));
  const expectedOriginUrl = safePublicationUrl(
    signed.parsed.expected_canonical_origin,
    allowedHosts(env),
  );
  if (!pageUrl || !expectedOriginUrl) return failure("URL_NOT_ALLOWED", 400);
  const timeout = Number(signed.parsed.timeout_ms);
  const maxTimeout = Number(env.MAX_TIMEOUT_MS);
  if (!Number.isInteger(timeout) || timeout < 250 || timeout > maxTimeout) {
    return failure("INVALID_TIMEOUT", 400);
  }
  try {
    const response = await fetch(pageUrl, {
      method: "GET",
      redirect: "manual",
      headers: { accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(timeout),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const redirected = location
        ? safePublicationUrl(new URL(location, pageUrl).toString(), allowedHosts(env))
        : null;
      if (!redirected) return failure("UNSAFE_REDIRECT", 400);
      return json({
        ok: true,
        data: {
          status: "degraded",
          retryable: false,
          error_code: "REDIRECT_REQUIRES_DIRECT_VERIFICATION",
          http_status: response.status,
          redirect_target: redirected.origin,
        },
      });
    }
    const html = await limitedHtml(response, Number(env.MAX_HTML_BYTES));
    const analysis = analyzeLiveHtml(html, pageUrl, expectedOriginUrl.origin);
    return json({
      ok: true,
      data: {
        schema_version: "1.0",
        client_id: clientId,
        environment,
        url: pageUrl.toString(),
        http_status: response.status,
        status: response.ok && analysis.passed ? "healthy" : "failed",
        retryable: response.status >= 500,
        ...analysis,
        checked_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return json({
      ok: true,
      data: {
        schema_version: "1.0",
        client_id: clientId,
        environment,
        url: pageUrl.toString(),
        status: "failed",
        retryable: true,
        error_code: error instanceof Error && error.message === "HTML_TOO_LARGE"
          ? "HTML_TOO_LARGE"
          : "NETWORK_OR_TIMEOUT",
        checked_at: new Date().toISOString(),
      },
    });
  }
}

async function stableId(prefix: string, value: string): Promise<string> {
  return `${prefix}-${(await sha256(value)).slice(0, 24)}`;
}

async function handlePublicationResult(request: Request, env: Env): Promise<Response> {
  const signed = await readSignedBody(request, env);
  if (signed instanceof Response) return signed;
  const parsed = parsePublicationResult(signed.parsed);
  if (typeof parsed === "string") return failure(parsed, 400);
  const identityFailure = preflightIdentityFailure(parsed as unknown as PreflightRequest, env);
  if (identityFailure) return failure(identityFailure, 403);
  if (!safePublicationUrl(parsed.url, allowedHosts(env))) return failure("URL_NOT_ALLOWED", 400);

  const maxActions = Number(env.MAX_OPERATOR_ACTIONS);
  const actions = parsed.operator_actions.slice(0, maxActions);
  const overflow = parsed.overflow_action_count
    + Math.max(0, parsed.operator_actions.length - actions.length);
  const now = new Date().toISOString();
  const existingOwner = await env.PUBLICATION_DB.prepare(
    `SELECT document_id FROM publication_url_registry
     WHERE environment = ? AND client_id = ? AND url = ?`,
  ).bind(parsed.environment, parsed.client_id, parsed.url).first<{ document_id: string }>();
  if (existingOwner && existingOwner.document_id !== parsed.document_id) {
    return failure("URL_OWNED_BY_OTHER_DOCUMENT", 409);
  }

  await env.PUBLICATION_DB.prepare(
    `INSERT INTO publication_url_registry(
       environment, client_id, url, document_id, page_type, ownership_key,
       status, last_revision_id, last_verified_at, created_at, updated_at
     ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(environment, client_id, url) DO UPDATE SET
       page_type = excluded.page_type, ownership_key = excluded.ownership_key,
       status = excluded.status, last_revision_id = excluded.last_revision_id,
       last_verified_at = excluded.last_verified_at, updated_at = excluded.updated_at`,
  ).bind(
    parsed.environment,
    parsed.client_id,
    parsed.url,
    parsed.document_id,
    parsed.page_type,
    parsed.ownership_key,
    parsed.status,
    parsed.revision_id,
    parsed.live_verified ? now : null,
    now,
    now,
  ).run();
  await env.PUBLICATION_DB.prepare(
    `INSERT INTO publication_logs(
       environment, client_id, publication_id, document_id, revision_id, action,
       url, status, deterministic_passed, live_verified, issue_count,
       operator_action_count, overflow_action_count, evidence_ref, created_at, updated_at
     ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(environment, client_id, publication_id) DO UPDATE SET
       revision_id = excluded.revision_id, status = excluded.status,
       deterministic_passed = excluded.deterministic_passed,
       live_verified = excluded.live_verified, issue_count = excluded.issue_count,
       operator_action_count = excluded.operator_action_count,
       overflow_action_count = excluded.overflow_action_count,
       evidence_ref = excluded.evidence_ref, updated_at = excluded.updated_at`,
  ).bind(
    parsed.environment,
    parsed.client_id,
    parsed.publication_id,
    parsed.document_id,
    parsed.revision_id,
    parsed.action,
    parsed.url,
    parsed.status,
    parsed.deterministic_passed ? 1 : 0,
    parsed.live_verified ? 1 : 0,
    parsed.issues.length,
    actions.length,
    overflow,
    parsed.evidence_ref ?? null,
    now,
    now,
  ).run();

  for (const [index, issue] of parsed.issues.entries()) {
    const issueId = await stableId("issue", `${parsed.publication_id}|${index}|${issue.code}`);
    await env.PUBLICATION_DB.prepare(
      `INSERT INTO publication_issues(
         environment, client_id, publication_id, issue_id, code, severity,
         field, safe_summary, approval_required, created_at, updated_at
       ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(environment, client_id, issue_id) DO UPDATE SET
         severity = excluded.severity, field = excluded.field,
         safe_summary = excluded.safe_summary,
         approval_required = excluded.approval_required, updated_at = excluded.updated_at`,
    ).bind(
      parsed.environment,
      parsed.client_id,
      parsed.publication_id,
      issueId,
      issue.code,
      issue.severity,
      issue.field ?? null,
      issue.safe_summary,
      issue.approval_required ? 1 : 0,
      now,
      now,
    ).run();
  }
  for (const [index, action] of actions.entries()) {
    const actionId = await stableId(
      "action",
      `${parsed.publication_id}|${index}|${action.action_type}|${action.safe_summary}`,
    );
    await env.PUBLICATION_DB.prepare(
      `INSERT INTO publication_operator_actions(
         environment, client_id, publication_id, action_id, action_type,
         owner_group, approval_required, evidence_ref, created_at, updated_at
       ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(environment, client_id, action_id) DO UPDATE SET
         owner_group = excluded.owner_group,
         approval_required = excluded.approval_required,
         evidence_ref = excluded.evidence_ref, updated_at = excluded.updated_at`,
    ).bind(
      parsed.environment,
      parsed.client_id,
      parsed.publication_id,
      actionId,
      action.action_type,
      action.owner_group,
      action.approval_required ? 1 : 0,
      parsed.evidence_ref ?? null,
      now,
      now,
    ).run();
  }

  const makePayload: PublicationResultRequest & {
    occurred_at: string;
    operator_action_count: number;
    make_action_cap: number;
  } = {
    ...parsed,
    occurred_at: now,
    operator_actions: actions,
    overflow_action_count: overflow,
    operator_action_count: actions.length,
    make_action_cap: maxActions,
  };
  return json({
    ok: true,
    data: {
      stored: true,
      idempotency_key: parsed.idempotency_key,
      publication_id: parsed.publication_id,
      operator_action_count: actions.length,
      overflow_action_count: overflow,
      make_payload: makePayload,
    },
  });
}

function health(env: Env): Response {
  const safety = {
    sanity_publish: env.ALLOW_SANITY_PUBLISH,
    sanity_unpublish: env.ALLOW_SANITY_UNPUBLISH,
    indexnow_submit: env.ALLOW_INDEXNOW_SUBMIT,
    website_revalidation: env.ALLOW_WEBSITE_REVALIDATION,
    llm_review: env.ALLOW_LLM_REVIEW,
    public_send: env.ALLOW_PUBLIC_SEND,
  };
  return json({
    ok: true,
    data: {
      service: "arcanium-publication-control",
      version: "0.1.0",
      environment: env.ENVIRONMENT,
      hmac_configured: Boolean(env.PREFLIGHT_HMAC_SECRET),
      production_actions_enabled: Object.values(safety).some((value) => value === "true"),
      max_operator_actions: Number(env.MAX_OPERATOR_ACTIONS),
      safety,
    },
  });
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") return health(env);
  if (request.method !== "POST") return failure("NOT_FOUND", 404);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return failure("CONTENT_TYPE_REQUIRED", 415);
  }
  if (url.pathname === "/v1/preflight") return handlePreflight(request, env);
  if (url.pathname === "/v1/preflight/consume") return handleConsume(request, env);
  if (url.pathname === "/v1/live-verify") return handleLiveVerify(request, env);
  if (url.pathname === "/v1/publication-result") return handlePublicationResult(request, env);
  return failure("NOT_FOUND", 404);
}

export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
} satisfies ExportedHandler<Env>;
