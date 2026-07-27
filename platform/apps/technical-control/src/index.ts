import { canCloseIssue, canRollback, groupFindings, type Finding } from "./domain";

interface Statement { bind(...values: unknown[]): Statement; run(): Promise<unknown>; }
interface Database { prepare(query: string): Statement; }
export interface Env { ENVIRONMENT: "test" | "production"; TEST_CLIENT_IDS: string; TECHNICAL_HMAC_SECRET?: string; MAX_GROUPED_ACTIONS: string; ALLOW_PRODUCTION_ROLLBACK: "true" | "false"; TECHNICAL_DB: Database; }
type EventType = "DEPLOYMENT_RESULT" | "CRAWL_RESULT" | "INCIDENT" | "PERFORMANCE_RESULT" | "TASK_RESOLVED";
type Input = { request_id: string; idempotency_key: string; correlation_id: string; client_id: string; environment: "test" | "production"; event_type: EventType; payload: Record<string, unknown> };
const encoder = new TextEncoder(); const now = () => new Date().toISOString();
function response(value: unknown, status = 200): Response { return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } }); }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function clients(env: Env): string[] { return env.TEST_CLIENT_IDS.split(",").map((value) => value.trim()).filter(Boolean); }
async function digest(value: string): Promise<string> { const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))); return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function hmac(secret: string, value: string): Promise<string> { const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))); return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function equal(left: string, right: string): boolean { if (left.length !== right.length) return false; let difference = 0; for (let i = 0; i < left.length; i += 1) difference |= left.charCodeAt(i) ^ right.charCodeAt(i); return difference === 0; }
async function signed(request: Request, env: Env): Promise<unknown | Response> {
  const raw = await request.text(); const timestamp = request.headers.get("x-automation-timestamp"); const nonce = request.headers.get("x-automation-nonce"); const signature = request.headers.get("x-automation-signature")?.replace(/^sha256[:=]/i, "").toLowerCase();
  if (!env.TECHNICAL_HMAC_SECRET || !timestamp || !nonce || !signature) return response({ ok: false, error: "SIGNATURE_HEADERS_REQUIRED" }, 401);
  const timestampMs = Date.parse(timestamp); if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 300000) return response({ ok: false, error: "TIMESTAMP_OUT_OF_WINDOW" }, 401);
  if (!/^[a-f0-9]{64}$/.test(signature) || !equal(signature, await hmac(env.TECHNICAL_HMAC_SECRET, `${timestamp}.${nonce}.${raw}`))) return response({ ok: false, error: "INVALID_SIGNATURE" }, 401);
  try { await env.TECHNICAL_DB.prepare("INSERT INTO technical_nonces(nonce, expires_at) VALUES(?, ?)").bind(nonce, Math.floor(timestampMs / 1000) + 300).run(); } catch { return response({ ok: false, error: "REPLAY_REJECTED" }, 409); }
  await env.TECHNICAL_DB.prepare("DELETE FROM technical_nonces WHERE expires_at <= ?").bind(Math.floor(Date.now() / 1000)).run();
  try { return JSON.parse(raw); } catch { return response({ ok: false, error: "INVALID_JSON" }, 400); }
}
function parse(value: unknown, env: Env): Input | Response {
  if (!isRecord(value) || typeof value.request_id !== "string" || typeof value.idempotency_key !== "string" || typeof value.correlation_id !== "string" || typeof value.client_id !== "string" || !isRecord(value.payload)) return response({ ok: false, error: "INVALID_EVENT" }, 400);
  if (value.environment !== env.ENVIRONMENT || (env.ENVIRONMENT === "test" && !clients(env).includes(value.client_id))) return response({ ok: false, error: "CLIENT_OR_ENVIRONMENT_NOT_ALLOWED" }, 403);
  if (!["DEPLOYMENT_RESULT", "CRAWL_RESULT", "INCIDENT", "PERFORMANCE_RESULT", "TASK_RESOLVED"].includes(value.event_type as string)) return response({ ok: false, error: "UNSUPPORTED_EVENT_TYPE" }, 400);
  return value as Input;
}
function findings(value: unknown): Finding[] { if (!Array.isArray(value) || value.length > 100) return []; return value.filter((item): item is Finding => isRecord(item) && ["deployment", "crawl", "incident", "performance"].includes(item.kind as string) && typeof item.cluster === "string" && Number.isInteger(item.affected_count) && ["info", "warning", "critical"].includes(item.severity as string) && Number.isInteger(item.persistent_runs)); }
async function process(input: Input, env: Env): Promise<Response> {
  const timestamp = now(); const payloadHash = await digest(JSON.stringify(input.payload));
  try { await env.TECHNICAL_DB.prepare("INSERT INTO technical_runs(environment, client_id, idempotency_key, request_id, correlation_id, event_type, payload_hash, status, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, 'received', ?, ?)").bind(input.environment, input.client_id, input.idempotency_key, input.request_id, input.correlation_id, input.event_type, payloadHash, timestamp, timestamp).run(); } catch { return response({ ok: true, duplicate: true, data: { request_id: input.request_id } }); }
  if (input.event_type === "TASK_RESOLVED") {
    const issue = input.payload.issue_dedup_key; const verification = input.payload.verification;
    if (typeof issue !== "string" || !isRecord(verification) || typeof verification.id !== "string" || typeof verification.evidence_ref !== "string" || typeof verification.passed !== "boolean") return response({ ok: false, error: "INVALID_TASK_RESOLUTION" }, 400);
    await env.TECHNICAL_DB.prepare("INSERT INTO technical_verifications(environment, client_id, issue_dedup_key, verification_id, passed, evidence_ref, created_at) VALUES(?, ?, ?, ?, ?, ?, ?)").bind(input.environment, input.client_id, issue, verification.id, verification.passed ? 1 : 0, verification.evidence_ref, timestamp).run();
    if (canCloseIssue(verification.passed)) await env.TECHNICAL_DB.prepare("UPDATE technical_issues SET status = 'closed', verification_evidence = ?, updated_at = ? WHERE environment = ? AND client_id = ? AND dedup_key = ?").bind(verification.evidence_ref, timestamp, input.environment, input.client_id, issue).run();
    return response({ ok: true, data: { closed: canCloseIssue(verification.passed), issue_dedup_key: issue } }, 202);
  }
  const actions = groupFindings(findings(input.payload.findings), Math.min(Number(env.MAX_GROUPED_ACTIONS) || 20, 20));
  for (const action of actions) await env.TECHNICAL_DB.prepare("INSERT INTO technical_issues(environment, client_id, dedup_key, run_id, kind, severity, approval_required, status, safe_summary, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, 'open', ?, ?) ON CONFLICT(environment, client_id, dedup_key) DO UPDATE SET run_id = excluded.run_id, severity = excluded.severity, approval_required = excluded.approval_required, safe_summary = excluded.safe_summary, updated_at = excluded.updated_at").bind(input.environment, input.client_id, action.dedup_key, input.request_id, action.kind, action.severity, action.approval_required ? 1 : 0, action.safe_summary, timestamp).run();
  if (input.event_type === "INCIDENT" && typeof input.payload.incident_key === "string") await env.TECHNICAL_DB.prepare("INSERT INTO technical_incidents(environment, client_id, dedup_key, severity, status, safe_summary, created_at, updated_at) VALUES(?, ?, ?, ?, 'open', ?, ?, ?) ON CONFLICT(environment, client_id, dedup_key) DO UPDATE SET severity = excluded.severity, updated_at = excluded.updated_at").bind(input.environment, input.client_id, input.payload.incident_key, input.payload.severity === "critical" ? "critical" : "warning", typeof input.payload.summary === "string" ? input.payload.summary.slice(0, 500) : "Technical incident", timestamp, timestamp).run();
  const rollback = canRollback({ policy_approved: input.payload.rollback_policy_approved === true && env.ALLOW_PRODUCTION_ROLLBACK === "true", environment: input.environment, reversible: input.payload.reversible === true, severity: input.payload.severity === "critical" ? "critical" : "warning" });
  await env.TECHNICAL_DB.prepare("UPDATE technical_runs SET status = 'processed', updated_at = ? WHERE environment = ? AND client_id = ? AND idempotency_key = ?").bind(timestamp, input.environment, input.client_id, input.idempotency_key).run();
  return response({ ok: true, data: { request_id: input.request_id, action_count: actions.length, actions, rollback_permitted: rollback, raw_data_stored: false } }, 202);
}
export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/health") return response({ ok: true, data: { service: "arcanium-technical-control", environment: env.ENVIRONMENT, max_grouped_actions: Math.min(Number(env.MAX_GROUPED_ACTIONS) || 20, 20), production_rollback_enabled: env.ALLOW_PRODUCTION_ROLLBACK === "true" } });
  if (request.method !== "POST" || path !== "/v1/events" || !request.headers.get("content-type")?.includes("application/json")) return response({ ok: false, error: "NOT_FOUND" }, 404);
  const candidate = await signed(request, env); if (candidate instanceof Response) return candidate; const input = parse(candidate, env); return input instanceof Response ? input : process(input, env);
}
export default { fetch(request: Request, env: Env): Promise<Response> { return handleRequest(request, env); } };
