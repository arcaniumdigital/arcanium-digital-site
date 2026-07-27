interface Statement { bind(...values: unknown[]): Statement; run(): Promise<unknown>; }
interface Database { prepare(query: string): Statement; }
export interface Env { ENVIRONMENT: "test" | "production"; TEST_CLIENT_IDS: string; EVIDENCE_HMAC_SECRET?: string; MAX_FRESHNESS_ACTIONS: string; EVIDENCE_DB: Database; }
type EventType = "CAMPAIGN_EVIDENCE_SUBMITTED" | "DRAFT_JOB_REQUESTED" | "MONTHLY_FRESHNESS";
type Approval = { factual: boolean; rights: boolean; editorial: boolean };
type Evidence = { evidence_id: string; source_url: string; source_type: "official" | "public_research" | "private_campaign"; geography: string; period: string; release_date: string; retrieved_at: string; methodology_version: string; expires_at: string; limitations: string[]; approval: Approval };
type Input = { request_id: string; idempotency_key: string; correlation_id: string; client_id: string; environment: "test" | "production"; event_type: EventType; payload: Record<string, unknown> };
const encoder = new TextEncoder(); const timestamp = () => new Date().toISOString();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown, max = 500): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const allowedClients = (env: Env) => env.TEST_CLIENT_IDS.split(",").map((value) => value.trim()).filter(Boolean);
async function hmac(secret: string, value: string) { const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)))].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function hash(value: string) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function same(left: string, right: string) { if (left.length !== right.length) return false; let difference = 0; for (let i = 0; i < left.length; i += 1) difference |= left.charCodeAt(i) ^ right.charCodeAt(i); return difference === 0; }
function rawDataPresent(value: unknown): boolean { if (!record(value)) return false; return Object.keys(value).some((key) => ["dataset", "raw_data", "document_body", "content_body", "metrics_rows"].includes(key)); }
async function signed(request: Request, env: Env): Promise<unknown | Response> {
  const raw = await request.text(); const at = request.headers.get("x-automation-timestamp"); const nonce = request.headers.get("x-automation-nonce"); const signature = request.headers.get("x-automation-signature")?.replace(/^sha256[:=]/i, "").toLowerCase();
  if (!env.EVIDENCE_HMAC_SECRET || !at || !nonce || !signature) return json({ ok: false, error: "SIGNATURE_HEADERS_REQUIRED" }, 401);
  const ms = Date.parse(at); if (!Number.isFinite(ms) || Math.abs(Date.now() - ms) > 300000) return json({ ok: false, error: "TIMESTAMP_OUT_OF_WINDOW" }, 401);
  if (!/^[a-f0-9]{64}$/.test(signature) || !same(signature, await hmac(env.EVIDENCE_HMAC_SECRET, `${at}.${nonce}.${raw}`))) return json({ ok: false, error: "INVALID_SIGNATURE" }, 401);
  try { await env.EVIDENCE_DB.prepare("INSERT INTO evidence_nonces(nonce, expires_at) VALUES(?, ?)").bind(nonce, Math.floor(ms / 1000) + 300).run(); } catch { return json({ ok: false, error: "REPLAY_REJECTED" }, 409); }
  await env.EVIDENCE_DB.prepare("DELETE FROM evidence_nonces WHERE expires_at <= ?").bind(Math.floor(Date.now() / 1000)).run();
  try { return JSON.parse(raw); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
}
function parse(candidate: unknown, env: Env): Input | Response {
  if (!record(candidate) || !string(candidate.request_id) || !string(candidate.idempotency_key) || !string(candidate.correlation_id) || !string(candidate.client_id) || !record(candidate.payload)) return json({ ok: false, error: "INVALID_EVENT" }, 400);
  if (candidate.environment !== env.ENVIRONMENT || (env.ENVIRONMENT === "test" && !allowedClients(env).includes(candidate.client_id))) return json({ ok: false, error: "CLIENT_OR_ENVIRONMENT_NOT_ALLOWED" }, 403);
  if (!["CAMPAIGN_EVIDENCE_SUBMITTED", "DRAFT_JOB_REQUESTED", "MONTHLY_FRESHNESS"].includes(candidate.event_type as string)) return json({ ok: false, error: "UNSUPPORTED_EVENT_TYPE" }, 400);
  if (rawDataPresent(candidate.payload) || JSON.stringify(candidate.payload).length > 12000) return json({ ok: false, error: "RAW_OR_OVERSIZED_DATA_NOT_ACCEPTED" }, 400);
  return candidate as Input;
}
function evidence(value: unknown): Evidence | null {
  if (!record(value) || !string(value.evidence_id) || !string(value.source_url, 2000) || !string(value.geography) || !string(value.period) || !string(value.release_date) || !string(value.retrieved_at) || !string(value.methodology_version) || !string(value.expires_at) || !record(value.approval) || !Array.isArray(value.limitations) || value.limitations.length === 0 || value.limitations.length > 20 || value.limitations.some((item) => !string(item, 500))) return null;
  try { const url = new URL(value.source_url); if (url.protocol !== "https:") return null; } catch { return null; }
  if (!["official", "public_research", "private_campaign"].includes(value.source_type as string) || typeof value.approval.factual !== "boolean" || typeof value.approval.rights !== "boolean" || typeof value.approval.editorial !== "boolean") return null;
  return value as Evidence;
}
export function isDraftEligible(item: Evidence, now = Date.now()) { return item.approval.factual && item.approval.rights && item.approval.editorial && Date.parse(item.release_date) <= now && Date.parse(item.expires_at) > now; }
async function saveEvidence(item: Evidence, input: Input, env: Env) {
  const time = timestamp(); const status = isDraftEligible(item) ? "approved_for_draft" : "blocked";
  await env.EVIDENCE_DB.prepare("INSERT INTO campaign_evidence(environment, client_id, evidence_id, correlation_id, source_url, source_type, geography, period, release_date, retrieved_at, methodology_version, source_hash, limitations_json, factual_approved, rights_approved, editorial_approved, expires_at, status, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(environment, client_id, evidence_id) DO UPDATE SET correlation_id=excluded.correlation_id, source_url=excluded.source_url, source_type=excluded.source_type, geography=excluded.geography, period=excluded.period, release_date=excluded.release_date, retrieved_at=excluded.retrieved_at, methodology_version=excluded.methodology_version, source_hash=excluded.source_hash, limitations_json=excluded.limitations_json, factual_approved=excluded.factual_approved, rights_approved=excluded.rights_approved, editorial_approved=excluded.editorial_approved, expires_at=excluded.expires_at, status=excluded.status, updated_at=excluded.updated_at").bind(input.environment, input.client_id, item.evidence_id, input.correlation_id, item.source_url, item.source_type, item.geography, item.period, item.release_date, item.retrieved_at, item.methodology_version, await hash(`${item.source_url}|${item.release_date}|${item.methodology_version}`), JSON.stringify(item.limitations), item.approval.factual ? 1 : 0, item.approval.rights ? 1 : 0, item.approval.editorial ? 1 : 0, item.expires_at, status, time, time).run();
  return status;
}
async function process(input: Input, env: Env): Promise<Response> {
  const received = timestamp();
  try { await env.EVIDENCE_DB.prepare("INSERT INTO evidence_runs(environment, client_id, idempotency_key, request_id, correlation_id, event_type, payload_hash, status, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, 'received', ?, ?)").bind(input.environment, input.client_id, input.idempotency_key, input.request_id, input.correlation_id, input.event_type, await hash(JSON.stringify(input.payload)), received, received).run(); } catch { return json({ ok: true, duplicate: true, data: { request_id: input.request_id } }, 202); }
  if (input.event_type === "MONTHLY_FRESHNESS") {
    const items = input.payload.items; if (!Array.isArray(items) || items.length > 100) return json({ ok: false, error: "INVALID_FRESHNESS_ITEMS" }, 400);
    const cap = Math.min(Math.max(Number(env.MAX_FRESHNESS_ACTIONS) || 20, 1), 20); const expired = items.filter((item) => record(item) && string(item.record_id) && string(item.expires_at) && Date.parse(item.expires_at) <= Date.now()).slice(0, cap);
    for (const item of expired as Array<Record<string, string>>) await env.EVIDENCE_DB.prepare("INSERT INTO content_freshness_issues(environment, client_id, dedup_key, correlation_id, issue_type, status, created_at, updated_at) VALUES(?, ?, ?, ?, 'expired_source', 'open', ?, ?) ON CONFLICT(environment, client_id, dedup_key) DO UPDATE SET correlation_id=excluded.correlation_id, status='open', updated_at=excluded.updated_at").bind(input.environment, input.client_id, `expired:${item.record_id}`, input.correlation_id, received, received).run();
    await env.EVIDENCE_DB.prepare("UPDATE evidence_runs SET status='processed', updated_at=? WHERE environment=? AND client_id=? AND idempotency_key=?").bind(received, input.environment, input.client_id, input.idempotency_key).run();
    return json({ ok: true, data: { action_count: expired.length, action_cap: cap, external_actions_enabled: false, content_publish_enabled: false } }, 202);
  }
  const item = evidence(input.payload.evidence); if (!item) return json({ ok: false, error: "INVALID_EVIDENCE_METADATA" }, 400);
  const status = await saveEvidence(item, input, env);
  if (input.event_type === "DRAFT_JOB_REQUESTED" && isDraftEligible(item)) await env.EVIDENCE_DB.prepare("INSERT INTO content_draft_jobs(environment, client_id, evidence_id, correlation_id, job_type, status, llm_called, content_publish_enabled, created_at, updated_at) VALUES(?, ?, ?, ?, 'evidence_draft', 'approval_pending', 0, 0, ?, ?) ON CONFLICT(environment, client_id, evidence_id, job_type) DO UPDATE SET correlation_id=excluded.correlation_id, updated_at=excluded.updated_at").bind(input.environment, input.client_id, item.evidence_id, input.correlation_id, received, received).run();
  await env.EVIDENCE_DB.prepare("UPDATE evidence_runs SET status='processed', updated_at=? WHERE environment=? AND client_id=? AND idempotency_key=?").bind(received, input.environment, input.client_id, input.idempotency_key).run();
  return json({ ok: true, data: { evidence_id: item.evidence_id, status, draft_job_created: input.event_type === "DRAFT_JOB_REQUESTED" && isDraftEligible(item), llm_called: false, content_publish_enabled: false, raw_data_stored: false } }, 202);
}
export async function handleRequest(request: Request, env: Env): Promise<Response> { const path = new URL(request.url).pathname; if (request.method === "GET" && path === "/health") return json({ ok: true, data: { service: "arcanium-evidence-control", environment: env.ENVIRONMENT, max_freshness_actions: Math.min(Math.max(Number(env.MAX_FRESHNESS_ACTIONS) || 20, 1), 20), llm_enabled: false, content_publish_enabled: false } }); if (request.method !== "POST" || path !== "/v1/events" || !request.headers.get("content-type")?.includes("application/json")) return json({ ok: false, error: "NOT_FOUND" }, 404); const candidate = await signed(request, env); if (candidate instanceof Response) return candidate; const input = parse(candidate, env); return input instanceof Response ? input : process(input, env); }
export default { fetch: (request: Request, env: Env) => handleRequest(request, env) };
