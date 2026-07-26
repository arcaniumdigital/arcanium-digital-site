import {
  validateAutomationResultCandidate,
  type AutomationResult,
} from "../../../packages/contracts/src/automation-result";
import {
  validateActionResolutionCandidate,
  type ActionResolutionRequest,
} from "../../../packages/contracts/src/action-resolution";

export interface Env {
  ENVIRONMENT: "test" | "production";
  EVENT_HMAC_SECRET?: string;
  TEST_CLIENT_IDS: string;
  MAX_EVENT_BYTES: string;
  REPLAY_WINDOW_SECONDS: string;
  ALLOW_SCENARIO_ACTIVATION: "true" | "false";
  ALLOW_PRODUCTION_DEPLOY: "true" | "false";
  ALLOW_PUBLIC_SEND: "true" | "false";
  ALLOW_CONTENT_PUBLISH: "true" | "false";
  ALLOW_GBP_MUTATION: "true" | "false";
  ALLOW_OUTREACH_SEND: "true" | "false";
  ALLOW_DANGEROUS_REPLAY: "true" | "false";
  ALLOW_SITE_LAUNCH: "true" | "false";
  ALLOW_EXPERIMENT_LAUNCH: "true" | "false";
  ALLOW_PRICING_CHANGE: "true" | "false";
  PLATFORM_OPS_DB: D1Database;
  A13_DB: D1Database;
  A14_DB: D1Database;
  A15_DB: D1Database;
  PLATFORM_EVENTS: Queue;
}

export type AutomationId =
  | "A1" | "A2" | "A3" | "A4" | "A5"
  | "A6" | "A7" | "A8" | "A9" | "A10"
  | "A11" | "A12" | "A13" | "A14" | "A15";

export interface AutomationEvent {
  schema_version: "1.0";
  event_id: string;
  idempotency_key: string;
  correlation_id: string;
  automation_id: AutomationId;
  event_type: string;
  client_id: string;
  environment: "test" | "production";
  occurred_at: string;
  severity: "info" | "warning" | "error" | "critical";
  payload_ref?: string | null;
  payload: Record<string, unknown>;
}

type ValidationResult =
  | { ok: true; event: AutomationEvent }
  | { ok: false; code: string; status: number };

const MAX_IDENTIFIER_LENGTH = 160;
const MAX_EVENT_TYPE_LENGTH = 120;
const severityValues = new Set(["info", "warning", "error", "critical"]);

const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const failure = (code: string, status: number): Response =>
  json({ ok: false, error: { code } }, status);

const now = () => new Date().toISOString();
const encode = (value: string) => new TextEncoder().encode(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", encode(value)));
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function validateEventCandidate(
  candidate: unknown,
  environment: Env["ENVIRONMENT"],
  allowedClientIds: string[],
): ValidationResult {
  if (!isRecord(candidate)) return { ok: false, code: "INVALID_EVENT", status: 400 };

  const requiredStrings = [
    "schema_version", "event_id", "idempotency_key", "correlation_id",
    "automation_id", "event_type", "client_id", "environment", "occurred_at", "severity",
  ] as const;
  if (requiredStrings.some((key) => typeof candidate[key] !== "string" || candidate[key].length === 0)) {
    return { ok: false, code: "INVALID_EVENT", status: 400 };
  }
  if (candidate.schema_version !== "1.0") return { ok: false, code: "INVALID_SCHEMA_VERSION", status: 400 };
  if (candidate.environment !== environment) return { ok: false, code: "ENVIRONMENT_MISMATCH", status: 403 };
  if (!allowedClientIds.includes(candidate.client_id as string)) {
    return { ok: false, code: "CLIENT_NOT_ALLOWED", status: 403 };
  }
  if (!/^A(?:[1-9]|1[0-5])$/.test(candidate.automation_id as string)) {
    return { ok: false, code: "INVALID_AUTOMATION", status: 400 };
  }
  if (!severityValues.has(candidate.severity as string)) {
    return { ok: false, code: "INVALID_SEVERITY", status: 400 };
  }
  if (!Number.isFinite(Date.parse(candidate.occurred_at as string))) {
    return { ok: false, code: "INVALID_OCCURRED_AT", status: 400 };
  }
  for (const key of ["event_id", "idempotency_key", "correlation_id", "client_id"] as const) {
    if ((candidate[key] as string).length > MAX_IDENTIFIER_LENGTH) {
      return { ok: false, code: "IDENTIFIER_TOO_LONG", status: 400 };
    }
  }
  if ((candidate.event_type as string).length > MAX_EVENT_TYPE_LENGTH) {
    return { ok: false, code: "EVENT_TYPE_TOO_LONG", status: 400 };
  }
  if (!isRecord(candidate.payload)) return { ok: false, code: "INVALID_PAYLOAD", status: 400 };
  if (candidate.payload_ref !== undefined && candidate.payload_ref !== null && typeof candidate.payload_ref !== "string") {
    return { ok: false, code: "INVALID_PAYLOAD_REF", status: 400 };
  }
  return { ok: true, event: candidate as unknown as AutomationEvent };
}

async function verifySignature(request: Request, rawBody: string, env: Env): Promise<Response | null> {
  const timestamp = request.headers.get("X-Automation-Timestamp");
  const nonce = request.headers.get("X-Automation-Nonce");
  const supplied = request.headers.get("X-Automation-Signature");
  if (!env.EVENT_HMAC_SECRET) return failure("SERVER_HMAC_NOT_CONFIGURED", 500);
  if (!timestamp) return failure("TIMESTAMP_HEADER_REQUIRED", 401);
  if (!nonce) return failure("NONCE_HEADER_REQUIRED", 401);
  if (!supplied) return failure("SIGNATURE_HEADER_REQUIRED", 401);
  if (nonce.length > MAX_IDENTIFIER_LENGTH) return failure("INVALID_NONCE", 400);

  const timestampMs = Date.parse(timestamp);
  const replayWindowSeconds = Number(env.REPLAY_WINDOW_SECONDS);
  if (!Number.isFinite(replayWindowSeconds) || replayWindowSeconds < 1) {
    return failure("SERVER_CONFIGURATION_ERROR", 500);
  }
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > replayWindowSeconds * 1000) {
    return failure("TIMESTAMP_OUT_OF_WINDOW", 401);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encode(env.EVENT_HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = hex(await crypto.subtle.sign("HMAC", key, encode(`${timestamp}.${nonce}.${rawBody}`)));
  const signature = supplied.replace(/^sha256[:=]/i, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(signature) || !constantTimeEqual(expected, signature)) {
    return failure("INVALID_SIGNATURE", 401);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + replayWindowSeconds;
  const inserted = await env.PLATFORM_OPS_DB.prepare(
    "INSERT OR IGNORE INTO a12_nonce (nonce, expires_at) VALUES (?, ?)",
  ).bind(nonce, expiresAt).run();
  if ((inserted.meta.changes ?? 0) !== 1) return failure("REPLAY_REJECTED", 409);
  return null;
}

async function persistAutomationRequest(event: AutomationEvent, env: Env): Promise<void> {
  const requestTables: Partial<Record<AutomationId, string>> = {
    A13: "a13_requests",
    A14: "a14_requests",
    A15: "a15_requests",
  };
  const table = requestTables[event.automation_id];
  if (table) {
    await env.PLATFORM_OPS_DB.prepare(
      `INSERT OR IGNORE INTO ${table} (id, payload_json, created_at) VALUES (?, ?, ?)`,
    ).bind(event.event_id, JSON.stringify(event.payload), now()).run();
  }

  if (event.automation_id === "A1") {
    const configVersion = typeof event.payload.config_version === "string"
      ? event.payload.config_version
      : event.schema_version;
    const status = typeof event.payload.status === "string" ? event.payload.status : "onboarding";
    const configJson = JSON.stringify(event.payload);
    await env.PLATFORM_OPS_DB.prepare(
      "INSERT OR IGNORE INTO platform_client_registry (environment, client_id, config_version, status, config_json, config_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      event.environment,
      event.client_id,
      configVersion,
      status,
      configJson,
      await sha256(configJson),
      now(),
      now(),
    ).run();
  }

  if (event.automation_id === "A13") {
    const projectId = typeof event.payload.project_id === "string" ? event.payload.project_id : event.event_id;
    await env.A13_DB.prepare(
      "INSERT OR IGNORE INTO a13_projects (project_id, environment, client_id, status, source_url, target_repo, target_project, created_at, updated_at) VALUES (?, ?, ?, 'requested', ?, ?, ?, ?, ?)",
    ).bind(
      projectId,
      event.environment,
      event.client_id,
      typeof event.payload.source_url === "string" ? event.payload.source_url : null,
      typeof event.payload.target_repo === "string" ? event.payload.target_repo : null,
      typeof event.payload.target_project === "string" ? event.payload.target_project : null,
      now(),
      now(),
    ).run();
  }

  if (event.automation_id === "A14") {
    const experimentId = typeof event.payload.experiment_id === "string" ? event.payload.experiment_id : event.event_id;
    await env.A14_DB.prepare(
      "INSERT OR IGNORE INTO a14_experiments (experiment_id, environment, client_id, name, hypothesis_version, page_scope_json, primary_metric, status, assignment_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', '1.0', ?, ?)",
    ).bind(
      experimentId,
      event.environment,
      event.client_id,
      typeof event.payload.name === "string" ? event.payload.name : "Test experiment",
      typeof event.payload.hypothesis_version === "string" ? event.payload.hypothesis_version : "1.0",
      JSON.stringify(Array.isArray(event.payload.page_scope) ? event.payload.page_scope : []),
      typeof event.payload.primary_metric === "string" ? event.payload.primary_metric : "confirmed_conversion",
      now(),
      now(),
    ).run();
  }

  if (event.automation_id === "A15") {
    const entryId = typeof event.payload.entry_id === "string" ? event.payload.entry_id : event.event_id;
    await env.A15_DB.prepare(
      "INSERT OR IGNORE INTO a15_cost_entries (entry_id, environment, client_id, provider, automation_id, service_period, source_type, external_record_id, currency, amount_minor, allocation_status, metadata_json, imported_at) VALUES (?, ?, ?, ?, 'A15', ?, 'test_fixture', ?, ?, ?, 'unallocated', ?, ?)",
    ).bind(
      entryId,
      event.environment,
      event.client_id,
      typeof event.payload.provider === "string" ? event.payload.provider : "test",
      typeof event.payload.service_period === "string" ? event.payload.service_period : now().slice(0, 7),
      typeof event.payload.external_record_id === "string" ? event.payload.external_record_id : entryId,
      typeof event.payload.currency === "string" ? event.payload.currency : "AUD",
      typeof event.payload.amount_minor === "number" && Number.isSafeInteger(event.payload.amount_minor)
        ? event.payload.amount_minor
        : 0,
      JSON.stringify(isRecord(event.payload.metadata) ? event.payload.metadata : {}),
      now(),
    ).run();
  }

  if (event.severity === "error" || event.severity === "critical") {
    await env.PLATFORM_OPS_DB.prepare(
      "INSERT OR REPLACE INTO a12_incidents (correlation_id, client_id, severity, event_type, first_seen, last_seen, safe_payload_ref) VALUES (?, ?, ?, ?, COALESCE((SELECT first_seen FROM a12_incidents WHERE correlation_id = ?), ?), ?, ?)",
    ).bind(
      event.correlation_id,
      event.client_id,
      event.severity,
      event.event_type,
      event.correlation_id,
      now(),
      now(),
      event.payload_ref ?? null,
    ).run();
  }

  await env.PLATFORM_OPS_DB.prepare(
    "INSERT OR IGNORE INTO platform_event_audit (event_id, environment, client_id, automation_id, event_type, correlation_id, idempotency_key, severity, payload_ref, disposition, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', ?)",
  ).bind(
    event.event_id,
    event.environment,
    event.client_id,
    event.automation_id,
    event.event_type,
    event.correlation_id,
    event.idempotency_key,
    event.severity,
    event.payload_ref ?? null,
    now(),
  ).run();
}

async function handleEvent(request: Request, env: Env): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return failure("CONTENT_TYPE_REQUIRED", 415);
  }
  const raw = await request.text();
  const maxBytes = Number(env.MAX_EVENT_BYTES);
  if (!Number.isFinite(maxBytes) || maxBytes < 1) return failure("SERVER_CONFIGURATION_ERROR", 500);
  if (encode(raw).byteLength > maxBytes) return failure("PAYLOAD_TOO_LARGE", 413);

  const authFailure = await verifySignature(request, raw, env);
  if (authFailure) return authFailure;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("INVALID_JSON", 400);
  }
  const allowedClients = env.TEST_CLIENT_IDS.split(",").map((value) => value.trim()).filter(Boolean);
  const validated = validateEventCandidate(parsed, env.ENVIRONMENT, allowedClients);
  if (!validated.ok) return failure(validated.code, validated.status);
  const event = validated.event;

  const previous = await env.PLATFORM_OPS_DB.prepare(
    "SELECT response_json FROM a12_idempotency WHERE key = ? AND client_id = ?",
  ).bind(event.idempotency_key, event.client_id).first<{ response_json: string }>();
  if (previous) return json(JSON.parse(previous.response_json), 200);

  await persistAutomationRequest(event, env);
  await env.PLATFORM_EVENTS.send({
    event_id: event.event_id,
    idempotency_key: event.idempotency_key,
    correlation_id: event.correlation_id,
    automation_id: event.automation_id,
    event_type: event.event_type,
    client_id: event.client_id,
    environment: event.environment,
    severity: event.severity,
    payload_ref: event.payload_ref ?? null,
    test_force_failure: event.environment === "test" && event.event_type === "system.queue.failure.fixture",
  });

  const response = {
    ok: true,
    data: {
      accepted: true,
      event_id: event.event_id,
      correlation_id: event.correlation_id,
      environment: env.ENVIRONMENT,
    },
  };
  await env.PLATFORM_OPS_DB.prepare(
    "INSERT OR IGNORE INTO a12_idempotency (key, client_id, automation_id, created_at, response_json) VALUES (?, ?, ?, ?, ?)",
  ).bind(event.idempotency_key, event.client_id, event.automation_id, now(), JSON.stringify(response)).run();
  return json(response, 202);
}

async function persistAutomationResult(result: AutomationResult, env: Env): Promise<void> {
  const createdAt = now();
  const error = result.error ?? null;
  const statements = [
    env.PLATFORM_OPS_DB.prepare(
      "INSERT INTO platform_automation_runs (result_id, run_id, idempotency_key, environment, client_id, automation_id, provider, status, correlation_id, started_at, completed_at, input_count, accepted_count, rejected_count, output_count, error_code, error_classification, retryable, limitations_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      result.result_id,
      result.run_id,
      result.idempotency_key,
      result.environment,
      result.client_id,
      result.automation_id,
      result.provider,
      result.status,
      result.correlation_id,
      result.started_at,
      result.completed_at,
      result.input_count,
      result.accepted_count,
      result.rejected_count,
      result.output_count,
      error?.code ?? null,
      error?.classification ?? null,
      error?.retryable ? 1 : 0,
      JSON.stringify(result.limitations ?? []),
      createdAt,
    ),
    env.PLATFORM_OPS_DB.prepare(
      "INSERT INTO platform_reconciliation_results (result_id, environment, client_id, automation_id, expected_count, observed_count, balanced, method, evidence_ref, reconciled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      result.result_id,
      result.environment,
      result.client_id,
      result.automation_id,
      result.reconciliation.expected_count,
      result.reconciliation.observed_count,
      result.reconciliation.balanced ? 1 : 0,
      result.reconciliation.method,
      result.reconciliation.evidence_ref ?? null,
      createdAt,
    ),
  ];

  for (const action of result.actions) {
    statements.push(
      env.PLATFORM_OPS_DB.prepare(
        "INSERT OR IGNORE INTO platform_operator_actions (environment, client_id, automation_id, result_id, action_id, dedup_key, action_type, severity, mutation_kind, approval_required, owner_group, due_at, evidence_ref, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)",
      ).bind(
        result.environment,
        result.client_id,
        result.automation_id,
        result.result_id,
        action.action_id,
        action.dedup_key,
        action.action_type,
        action.severity,
        action.mutation_kind,
        action.approval_required ? 1 : 0,
        action.owner_group ?? null,
        action.due_at ?? null,
        action.evidence_ref ?? null,
        createdAt,
        createdAt,
      ),
    );
    if (action.approval_required) {
      statements.push(
        env.PLATFORM_OPS_DB.prepare(
          "INSERT OR IGNORE INTO platform_approval_requests (environment, client_id, action_id, automation_id, mutation_kind, status, requested_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
        ).bind(
          result.environment,
          result.client_id,
          action.action_id,
          result.automation_id,
          action.mutation_kind,
          createdAt,
        ),
      );
    }
  }

  if (result.status === "failed" || !result.reconciliation.balanced) {
    const classification = error?.classification ?? "permanent";
    const errorCode = error?.code ?? "RECONCILIATION_UNBALANCED";
    const severity = classification === "security" || classification === "isolation"
      ? "critical"
      : result.status === "failed"
        ? "error"
        : "warning";
    const dedupKey = `${result.automation_id}:${result.provider}:${classification}:${errorCode}`;
    statements.push(
      env.PLATFORM_OPS_DB.prepare(
        "INSERT INTO platform_result_incidents (environment, client_id, incident_id, dedup_key, automation_id, result_id, provider, severity, classification, error_code, retryable, status, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?) ON CONFLICT(environment, client_id, dedup_key) DO UPDATE SET result_id = excluded.result_id, severity = excluded.severity, retryable = excluded.retryable, last_seen = excluded.last_seen",
      ).bind(
        result.environment,
        result.client_id,
        `incident:${result.result_id}`,
        dedupKey,
        result.automation_id,
        result.result_id,
        result.provider,
        severity,
        classification,
        errorCode,
        error?.retryable ? 1 : 0,
        createdAt,
        createdAt,
      ),
    );
  }

  await env.PLATFORM_OPS_DB.batch(statements);
}

async function handleAutomationResult(request: Request, env: Env): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return failure("CONTENT_TYPE_REQUIRED", 415);
  }
  const raw = await request.text();
  const maxBytes = Number(env.MAX_EVENT_BYTES);
  if (!Number.isFinite(maxBytes) || maxBytes < 1) return failure("SERVER_CONFIGURATION_ERROR", 500);
  if (encode(raw).byteLength > maxBytes) return failure("PAYLOAD_TOO_LARGE", 413);

  const authFailure = await verifySignature(request, raw, env);
  if (authFailure) return authFailure;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("INVALID_JSON", 400);
  }
  const allowedClients = env.TEST_CLIENT_IDS.split(",").map((value) => value.trim()).filter(Boolean);
  const validated = validateAutomationResultCandidate(parsed, env.ENVIRONMENT, allowedClients);
  if (!validated.ok) return failure(validated.code, validated.status);
  const result = validated.result;

  const previous = await env.PLATFORM_OPS_DB.prepare(
    "SELECT result_id, correlation_id FROM platform_automation_runs WHERE environment = ? AND client_id = ? AND idempotency_key = ?",
  ).bind(result.environment, result.client_id, result.idempotency_key)
    .first<{ result_id: string; correlation_id: string }>();
  if (previous) {
    return json({
      ok: true,
      data: {
        accepted: true,
        duplicate: true,
        result_id: previous.result_id,
        correlation_id: previous.correlation_id,
        environment: env.ENVIRONMENT,
      },
    });
  }

  await persistAutomationResult(result, env);
  return json({
    ok: true,
    data: {
      accepted: true,
      duplicate: false,
      result_id: result.result_id,
      correlation_id: result.correlation_id,
      actions_recorded: result.actions.length,
      approvals_pending: result.actions.filter((action) => action.approval_required).length,
      incident_opened: result.status === "failed" || !result.reconciliation.balanced,
      environment: env.ENVIRONMENT,
    },
  }, 202);
}

async function persistActionResolution(
  resolution: ActionResolutionRequest,
  env: Env,
): Promise<void> {
  const recordedAt = now();
  const statements = [
    env.PLATFORM_OPS_DB.prepare(
      "INSERT INTO platform_action_resolution_runs (resolution_id, idempotency_key, correlation_id, environment, client_id, automation_id, occurred_at, resolution_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      resolution.resolution_id,
      resolution.idempotency_key,
      resolution.correlation_id,
      resolution.environment,
      resolution.client_id,
      resolution.automation_id,
      resolution.occurred_at,
      resolution.resolutions.length,
      recordedAt,
    ),
  ];

  for (const item of resolution.resolutions) {
    statements.push(
      env.PLATFORM_OPS_DB.prepare(
        "INSERT INTO platform_action_resolution_items (resolution_id, environment, client_id, automation_id, action_id, dedup_key, disposition, reason, evidence_ref, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        resolution.resolution_id,
        resolution.environment,
        resolution.client_id,
        resolution.automation_id,
        item.action_id,
        item.dedup_key,
        item.disposition,
        item.reason,
        item.evidence_ref ?? null,
        recordedAt,
      ),
      env.PLATFORM_OPS_DB.prepare(
        "UPDATE platform_operator_actions SET status = ?, updated_at = ? WHERE environment = ? AND client_id = ? AND automation_id = ? AND action_id = ? AND dedup_key = ? AND status = 'open'",
      ).bind(
        item.disposition,
        recordedAt,
        resolution.environment,
        resolution.client_id,
        resolution.automation_id,
        item.action_id,
        item.dedup_key,
      ),
      env.PLATFORM_OPS_DB.prepare(
        "UPDATE platform_approval_requests SET status = ?, decided_at = ?, decided_by = ?, decision_evidence_ref = ? WHERE environment = ? AND client_id = ? AND automation_id = ? AND action_id = ? AND status = 'pending'",
      ).bind(
        item.disposition,
        recordedAt,
        `automation:${resolution.automation_id}`,
        item.evidence_ref ?? null,
        resolution.environment,
        resolution.client_id,
        resolution.automation_id,
        item.action_id,
      ),
    );
  }
  await env.PLATFORM_OPS_DB.batch(statements);
}

async function handleActionResolution(request: Request, env: Env): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return failure("CONTENT_TYPE_REQUIRED", 415);
  }
  const raw = await request.text();
  const maxBytes = Number(env.MAX_EVENT_BYTES);
  if (!Number.isFinite(maxBytes) || maxBytes < 1) return failure("SERVER_CONFIGURATION_ERROR", 500);
  if (encode(raw).byteLength > maxBytes) return failure("PAYLOAD_TOO_LARGE", 413);

  const authFailure = await verifySignature(request, raw, env);
  if (authFailure) return authFailure;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("INVALID_JSON", 400);
  }
  const allowedClients = env.TEST_CLIENT_IDS.split(",").map((value) => value.trim()).filter(Boolean);
  const validated = validateActionResolutionCandidate(parsed, env.ENVIRONMENT, allowedClients);
  if (!validated.ok) return failure(validated.code, validated.status);
  const resolution = validated.resolution;

  const previous = await env.PLATFORM_OPS_DB.prepare(
    "SELECT resolution_id, correlation_id FROM platform_action_resolution_runs WHERE environment = ? AND client_id = ? AND idempotency_key = ?",
  ).bind(resolution.environment, resolution.client_id, resolution.idempotency_key)
    .first<{ resolution_id: string; correlation_id: string }>();
  if (previous) {
    return json({
      ok: true,
      data: {
        accepted: true,
        duplicate: true,
        resolution_id: previous.resolution_id,
        correlation_id: previous.correlation_id,
        environment: env.ENVIRONMENT,
      },
    });
  }

  for (const item of resolution.resolutions) {
    const target = await env.PLATFORM_OPS_DB.prepare(
      "SELECT status FROM platform_operator_actions WHERE environment = ? AND client_id = ? AND automation_id = ? AND action_id = ? AND dedup_key = ?",
    ).bind(
      resolution.environment,
      resolution.client_id,
      resolution.automation_id,
      item.action_id,
      item.dedup_key,
    ).first<{ status: string }>();
    if (!target) return failure("ACTION_NOT_FOUND", 404);
    if (target.status !== "open") return failure("ACTION_ALREADY_RESOLVED", 409);
  }

  await persistActionResolution(resolution, env);
  return json({
    ok: true,
    data: {
      accepted: true,
      duplicate: false,
      resolution_id: resolution.resolution_id,
      correlation_id: resolution.correlation_id,
      actions_resolved: resolution.resolutions.length,
      environment: env.ENVIRONMENT,
    },
  }, 202);
}

function health(env: Env): Response {
  const safety = {
    scenario_activation: env.ALLOW_SCENARIO_ACTIVATION,
    production_deploy: env.ALLOW_PRODUCTION_DEPLOY,
    public_send: env.ALLOW_PUBLIC_SEND,
    content_publish: env.ALLOW_CONTENT_PUBLISH,
    gbp_mutation: env.ALLOW_GBP_MUTATION,
    outreach_send: env.ALLOW_OUTREACH_SEND,
    dangerous_replay: env.ALLOW_DANGEROUS_REPLAY,
    site_launch: env.ALLOW_SITE_LAUNCH,
    experiment_launch: env.ALLOW_EXPERIMENT_LAUNCH,
    pricing_change: env.ALLOW_PRICING_CHANGE,
  };
  return json({
    ok: true,
    data: {
      service: "arcanium-platform-core",
      version: "0.2.0",
      environment: env.ENVIRONMENT,
      operations: [
        "A1-A15_EVENT",
        "A1-A15_RESULT",
        "A1-A15_ACTION",
        "A1-A15_ACTION_RESOLUTION",
        "A1-A15_RECONCILIATION",
        "A12_INCIDENT",
        "A13_PROJECT",
        "A14_EXPERIMENT",
        "A15_COST_IMPORT",
      ],
      production_actions_enabled: Object.values(safety).some((value) => value === "true"),
      safety,
    },
  });
}

const eventRoutes = new Set([
  "/v1/events",
  "/v1/a1/client-configs",
  "/v1/a13/projects",
  "/v1/a14/experiments",
  "/v1/a15/cost-imports",
]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") return health(env);
    if (request.method === "POST" && url.pathname === "/v1/results") {
      return handleAutomationResult(request, env);
    }
    if (request.method === "POST" && url.pathname === "/v1/action-resolutions") {
      return handleActionResolution(request, env);
    }
    if (request.method === "POST" && eventRoutes.has(url.pathname)) return handleEvent(request, env);
    return failure("NOT_FOUND", 404);
  },
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    const isDeadLetterQueue = batch.queue.endsWith("-dlq");
    for (const message of batch.messages) {
      const body = isRecord(message.body) ? message.body : {};
      const eventId = typeof body.event_id === "string" ? body.event_id : message.id;
      const forceFailure = body.test_force_failure === true;
      const disposition = isDeadLetterQueue
        ? "dead_letter"
        : forceFailure
          ? "retry_requested"
          : "acknowledged";

      await env.PLATFORM_OPS_DB.prepare(
        "INSERT OR REPLACE INTO platform_queue_delivery (event_id, message_id, queue_name, attempt, disposition, body_json, observed_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        eventId,
        message.id,
        batch.queue,
        message.attempts,
        disposition,
        JSON.stringify(body),
        now(),
      ).run();

      if (forceFailure && !isDeadLetterQueue) {
        message.retry();
      } else {
        message.ack();
      }
    }
  },
} satisfies ExportedHandler<Env>;
