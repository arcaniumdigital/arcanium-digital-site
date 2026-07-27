import {
  canPublishReply,
  cappedActions,
  reconcileReviews,
  reviewAction,
  reviewRevisionHash,
  type ReviewRecord,
  type StoredReview,
} from "./domain";

interface Statement { bind(...values: unknown[]): Statement; run(): Promise<unknown>; first<T>(): Promise<T | null>; }
interface Database { prepare(query: string): Statement; }

export interface Env {
  ENVIRONMENT: "test" | "production";
  TEST_CLIENT_IDS: string;
  A4_HMAC_SECRET?: string;
  ALLOW_GBP_MUTATION: "true" | "false";
  MAX_REVIEW_ACTIONS: string;
  GBP_DB: Database;
}

const encoder = new TextEncoder();

function response(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

function clients(env: Env): string[] { return env.TEST_CLIENT_IDS.split(",").map((value) => value.trim()).filter(Boolean); }

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function signedJson(request: Request, env: Env): Promise<unknown | Response> {
  const raw = await request.text();
  const timestamp = request.headers.get("x-automation-timestamp");
  const nonce = request.headers.get("x-automation-nonce");
  const supplied = request.headers.get("x-automation-signature")?.replace(/^sha256[:=]/i, "").toLowerCase();
  if (!env.A4_HMAC_SECRET || !timestamp || !nonce || !supplied) return response({ ok: false, error: "SIGNATURE_HEADERS_REQUIRED" }, 401);
  const timestampMs = Date.parse(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 300_000) return response({ ok: false, error: "TIMESTAMP_OUT_OF_WINDOW" }, 401);
  if (!/^[a-f0-9]{64}$/.test(supplied) || !constantTimeEqual(supplied, await hmac(env.A4_HMAC_SECRET, `${timestamp}.${nonce}.${raw}`))) {
    return response({ ok: false, error: "INVALID_SIGNATURE" }, 401);
  }
  try { return JSON.parse(raw); } catch { return response({ ok: false, error: "INVALID_JSON" }, 400); }
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

function parseReview(value: unknown): ReviewRecord | null {
  if (!isRecord(value) || typeof value.review_id !== "string" || typeof value.location_id !== "string" || typeof value.comment !== "string" || typeof value.update_time !== "string") return null;
  if (![1, 2, 3, 4, 5].includes(value.rating as number)) return null;
  return { review_id: value.review_id, location_id: value.location_id, rating: value.rating as ReviewRecord["rating"], comment: value.comment, update_time: value.update_time };
}

async function reconcile(request: Request, env: Env): Promise<Response> {
  const candidate = await signedJson(request, env);
  if (candidate instanceof Response) return candidate;
  if (!isRecord(candidate) || candidate.environment !== "test" || typeof candidate.client_id !== "string" || !clients(env).includes(candidate.client_id)) return response({ ok: false, error: "CLIENT_OR_ENVIRONMENT_NOT_ALLOWED" }, 403);
  if (typeof candidate.location_id !== "string" || !Array.isArray(candidate.reviews) || candidate.reviews.length > 25 || typeof candidate.scan_complete !== "boolean") return response({ ok: false, error: "INVALID_REVIEW_BATCH" }, 400);
  const reviews = candidate.reviews.map(parseReview);
  if (reviews.some((review) => review === null) || reviews.some((review) => review!.location_id !== candidate.location_id)) return response({ ok: false, error: "INVALID_REVIEW_RECORD" }, 400);
  const incoming = reviews as ReviewRecord[];
  const existing = await env.GBP_DB.prepare("SELECT review_id, location_id, revision_hash, missing_full_scans, status FROM gbp_reviews WHERE environment = ? AND client_id = ? AND location_id = ?")
    .bind("test", candidate.client_id, candidate.location_id).first<StoredReview>();
  const stored = existing ? [existing] : [];
  const result = reconcileReviews(stored, incoming, candidate.scan_complete);
  const actions = cappedActions(incoming.map(reviewAction), Number(env.MAX_REVIEW_ACTIONS));
  const now = new Date().toISOString();
  for (const review of result.upserts) {
    await env.GBP_DB.prepare("INSERT INTO gbp_reviews(environment, client_id, location_id, review_id, revision_hash, rating, severity, status, missing_full_scans, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, 'active', 0, ?) ON CONFLICT(environment, client_id, location_id, review_id) DO UPDATE SET revision_hash = excluded.revision_hash, rating = excluded.rating, severity = excluded.severity, missing_full_scans = 0, status = 'active', updated_at = excluded.updated_at")
      .bind("test", candidate.client_id, review.location_id, review.review_id, reviewRevisionHash(review), review.rating, reviewAction(review).severity, now).run();
  }
  return response({ ok: true, data: { received_count: incoming.length, upsert_count: result.upserts.length, deletion_review_count: result.deletionCandidates.length, actions, gbp_mutation_permitted: false } });
}

async function authoriseReply(request: Request, env: Env): Promise<Response> {
  const candidate = await signedJson(request, env);
  if (candidate instanceof Response) return candidate;
  if (!isRecord(candidate) || candidate.environment !== "test" || typeof candidate.client_id !== "string" || !clients(env).includes(candidate.client_id)) return response({ ok: false, error: "CLIENT_OR_ENVIRONMENT_NOT_ALLOWED" }, 403);
  const fields = ["approval_status", "approved_revision_hash", "requested_revision_hash", "requested_location_id", "approved_location_id"];
  if (fields.some((field) => typeof candidate[field] !== "string")) return response({ ok: false, error: "INVALID_APPROVAL_REQUEST" }, 400);
  return response({ ok: true, data: canPublishReply({ approval_status: candidate.approval_status as "approved" | "pending" | "rejected", approved_revision_hash: candidate.approved_revision_hash as string, requested_revision_hash: candidate.requested_revision_hash as string, requested_location_id: candidate.requested_location_id as string, approved_location_id: candidate.approved_location_id as string, allow_gbp_mutation: env.ALLOW_GBP_MUTATION === "true" }) });
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") return response({ ok: true, data: { service: "arcanium-gbp-control", environment: env.ENVIRONMENT, gbp_mutation_enabled: env.ALLOW_GBP_MUTATION === "true", max_review_actions: Number(env.MAX_REVIEW_ACTIONS), qanda_api_implemented: false } });
  if (request.method !== "POST" || !request.headers.get("content-type")?.includes("application/json")) return response({ ok: false, error: "NOT_FOUND" }, 404);
  if (url.pathname === "/v1/reviews/reconcile") return reconcile(request, env);
  if (url.pathname === "/v1/replies/authorise") return authoriseReply(request, env);
  return response({ ok: false, error: "NOT_FOUND" }, 404);
}
