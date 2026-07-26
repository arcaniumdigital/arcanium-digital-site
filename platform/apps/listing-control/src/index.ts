import {
  parseFeed,
  reconcileListings,
  stableHash,
  type NormalizedListing,
  type ReconciliationResult,
} from "./domain";

export { parseFeed, reconcileListings, stableHash } from "./domain";
export type { NormalizedListing, ReconciliationResult } from "./domain";

interface SyncRequest {
  run_id: string;
  idempotency_key: string;
  client_id: string;
  feed_id: string;
  source_type: "json" | "reaxml";
  captured_at: string;
  raw_feed: string;
}

export interface Env {
  ENVIRONMENT: "test" | "production";
  LISTING_HMAC_SECRET?: string;
  TEST_CLIENT_IDS: string;
  MAX_FEED_BYTES: string;
  REPLAY_WINDOW_SECONDS: string;
  MAX_OPERATOR_ACTIONS: string;
  MAX_COUNT_DROP_RATIO: string;
  MAX_FEED_AGE_SECONDS: string;
  ALLOW_PRODUCTION_DEPLOY: "true" | "false";
  ALLOW_PUBLIC_WRITE: "true" | "false";
  ALLOW_SOLD_PRICE_PUBLISH: "true" | "false";
  ALLOW_DESTRUCTIVE_URL_CHANGE: "true" | "false";
  ALLOW_INDEXNOW_SUBMIT: "true" | "false";
  ALLOW_WEBSITE_REVALIDATION: "true" | "false";
  LISTING_DB: D1Database;
  FEED_LOCKS: DurableObjectNamespace;
  LISTING_ACTIONS: Queue;
}

const noStore = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200): Response => Response.json(body, { status, headers: noStore });
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const now = () => new Date().toISOString();
const encode = (value: string) => new TextEncoder().encode(value);

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function verifySignature(request: Request, rawBody: string, env: Env): Promise<Response | null> {
  const timestamp = request.headers.get("X-Automation-Timestamp");
  const nonce = request.headers.get("X-Automation-Nonce");
  const supplied = request.headers.get("X-Automation-Signature");
  if (!env.LISTING_HMAC_SECRET) return json({ ok: false, error: "SERVER_HMAC_NOT_CONFIGURED" }, 500);
  if (!timestamp || !nonce || !supplied) return json({ ok: false, error: "AUTH_HEADERS_REQUIRED" }, 401);
  const timestampMs = Date.parse(timestamp);
  const windowSeconds = Number(env.REPLAY_WINDOW_SECONDS);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > windowSeconds * 1000) {
    return json({ ok: false, error: "TIMESTAMP_OUT_OF_WINDOW" }, 401);
  }
  const key = await crypto.subtle.importKey(
    "raw",
    encode(env.LISTING_HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = hex(await crypto.subtle.sign("HMAC", key, encode(`${timestamp}.${nonce}.${rawBody}`)));
  const actual = supplied.replace(/^sha256[:=]/i, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(actual) || !constantTimeEqual(expected, actual)) {
    return json({ ok: false, error: "INVALID_SIGNATURE" }, 401);
  }
  const inserted = await env.LISTING_DB.prepare(
    "INSERT OR IGNORE INTO listing_nonces (nonce, expires_at) VALUES (?, ?)",
  ).bind(nonce, Math.floor(Date.now() / 1000) + windowSeconds).run();
  return (inserted.meta.changes ?? 0) === 1
    ? null
    : json({ ok: false, error: "REPLAY_REJECTED" }, 409);
}

function validateRequest(candidate: unknown, env: Env): SyncRequest | null {
  if (!isRecord(candidate)) return null;
  const fields = ["run_id", "idempotency_key", "client_id", "feed_id", "source_type", "captured_at", "raw_feed"];
  if (fields.some((field) => typeof candidate[field] !== "string" || !(candidate[field] as string))) return null;
  if (!["json", "reaxml"].includes(candidate.source_type as string)) return null;
  if (!env.TEST_CLIENT_IDS.split(",").map((item) => item.trim()).includes(candidate.client_id as string)) return null;
  return candidate as unknown as SyncRequest;
}

async function loadPrevious(env: Env, request: SyncRequest): Promise<NormalizedListing[]> {
  const result = await env.LISTING_DB.prepare(
    "SELECT listing_id, lifecycle, content_hash, canonical_url, sold_price_minor, source_json FROM listing_records WHERE environment = ? AND client_id = ? AND feed_id = ?",
  ).bind(env.ENVIRONMENT, request.client_id, request.feed_id).all();
  return result.results.map((row) => {
    const source = JSON.parse(String(row.source_json)) as Record<string, unknown>;
    return {
      listingId: String(row.listing_id),
      lifecycle: String(row.lifecycle) as NormalizedListing["lifecycle"],
      address: typeof source.address === "string" ? source.address : null,
      canonicalUrl: row.canonical_url ? String(row.canonical_url) : null,
      soldPriceMinor: row.sold_price_minor === null ? null : Number(row.sold_price_minor),
      imageUrls: Array.isArray(source.imageUrls) ? source.imageUrls.filter((item): item is string => typeof item === "string") : [],
      contentHash: String(row.content_hash),
      source,
    };
  });
}

async function persistRun(
  env: Env,
  request: SyncRequest,
  listings: NormalizedListing[],
  result: ReconciliationResult,
): Promise<void> {
  const completedAt = now();
  const statements = [
    env.LISTING_DB.prepare(
      "INSERT OR IGNORE INTO listing_sync_runs (environment, client_id, feed_id, run_id, idempotency_key, source_type, status, preserve_last_known_good, input_count, accepted_count, new_count, updated_count, sold_count, withdrawn_count, deleted_candidate_count, operator_action_count, overflow_action_count, error_code, captured_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      env.ENVIRONMENT, request.client_id, request.feed_id, request.run_id,
      request.idempotency_key, request.source_type, result.status,
      result.preserveLastKnownGood ? 1 : 0, result.inputCount, result.acceptedCount,
      result.counts.new, result.counts.updated, result.counts.sold,
      result.counts.withdrawn, result.counts.deletedCandidates,
      result.operatorActions.length, result.overflowActionCount, result.errorCode,
      request.captured_at, completedAt,
    ),
  ];

  if (result.accepted) {
    statements.push(env.LISTING_DB.prepare(
      "INSERT INTO listing_feeds (environment, client_id, feed_id, source_type, last_verified_at, last_feed_hash, last_listing_count, last_status, last_error_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', NULL, ?, ?) ON CONFLICT(environment, client_id, feed_id) DO UPDATE SET source_type=excluded.source_type, last_verified_at=excluded.last_verified_at, last_feed_hash=excluded.last_feed_hash, last_listing_count=excluded.last_listing_count, last_status='verified', last_error_code=NULL, updated_at=excluded.updated_at",
    ).bind(
      env.ENVIRONMENT, request.client_id, request.feed_id, request.source_type,
      request.captured_at, stableHash(listings.map((item) => item.contentHash)),
      listings.length, completedAt, completedAt,
    ));
    for (const listing of listings) {
      statements.push(env.LISTING_DB.prepare(
        "INSERT INTO listing_records (environment, client_id, feed_id, listing_id, lifecycle, content_hash, canonical_url, sold_price_minor, source_json, first_seen_at, last_verified_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(environment, client_id, feed_id, listing_id) DO UPDATE SET lifecycle=excluded.lifecycle, content_hash=excluded.content_hash, canonical_url=excluded.canonical_url, sold_price_minor=excluded.sold_price_minor, source_json=excluded.source_json, last_verified_at=excluded.last_verified_at, updated_at=excluded.updated_at",
      ).bind(
        env.ENVIRONMENT, request.client_id, request.feed_id, listing.listingId,
        listing.lifecycle, listing.contentHash, listing.canonicalUrl,
        listing.soldPriceMinor, JSON.stringify({
          address: listing.address,
          imageUrls: listing.imageUrls,
        }), completedAt, request.captured_at, completedAt,
      ));
    }
  }
  for (const item of result.operatorActions) {
    statements.push(env.LISTING_DB.prepare(
      "INSERT OR IGNORE INTO listing_operator_actions (environment, client_id, feed_id, run_id, action_id, dedup_key, listing_id, action_type, severity, reason, approval_required, owner_group, evidence_ref, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)",
    ).bind(
      env.ENVIRONMENT, request.client_id, request.feed_id, request.run_id,
      item.actionId, item.dedupKey, item.listingId, item.actionType, item.severity,
      item.reason, item.approvalRequired ? 1 : 0, item.ownerGroup,
      `listing-control://${request.run_id}/${item.dedupKey}`, completedAt, completedAt,
    ));
  }
  await env.LISTING_DB.batch(statements);
}

async function processSync(request: SyncRequest, env: Env): Promise<Response> {
  const lockId = env.FEED_LOCKS.idFromName(`${env.ENVIRONMENT}:${request.client_id}:${request.feed_id}`);
  const lock = env.FEED_LOCKS.get(lockId);
  const lockResponse = await lock.fetch("https://lock.internal/acquire", { method: "POST" });
  if (lockResponse.status === 409) return json({ ok: false, error: "FEED_LOCKED" }, 409);
  try {
    const duplicate = await env.LISTING_DB.prepare(
      "SELECT run_id FROM listing_sync_runs WHERE environment = ? AND client_id = ? AND feed_id = ? AND idempotency_key = ?",
    ).bind(env.ENVIRONMENT, request.client_id, request.feed_id, request.idempotency_key).first();
    if (duplicate) return json({ ok: true, duplicate: true, run_id: duplicate.run_id }, 200);
    const parseResult = parseFeed(request.source_type, request.raw_feed);
    const previous = await loadPrevious(env, request);
    const result = reconcileListings({
      parseResult,
      previous,
      capturedAt: request.captured_at,
      maxFeedAgeSeconds: Number(env.MAX_FEED_AGE_SECONDS),
      maxCountDropRatio: Number(env.MAX_COUNT_DROP_RATIO),
      maxOperatorActions: Math.min(20, Number(env.MAX_OPERATOR_ACTIONS)),
    });
    await persistRun(env, request, parseResult.listings, result);
    await env.LISTING_ACTIONS.send({
      schema_version: "1.0",
      automation_id: "A2",
      event_type: "listing.sync_batch",
      environment: env.ENVIRONMENT,
      client_id: request.client_id,
      feed_id: request.feed_id,
      run_id: request.run_id,
      summary: {
        status: result.status,
        preserve_last_known_good: result.preserveLastKnownGood,
        input_count: result.inputCount,
        accepted_count: result.acceptedCount,
        ...result.counts,
      },
      operator_actions: result.operatorActions,
      overflow_action_count: result.overflowActionCount,
      action_flags: {
        public_write: false,
        sold_price_publish: false,
        destructive_url_change: false,
        indexnow_submit: false,
        website_revalidation: false,
      },
    });
    return json({ ok: true, run_id: request.run_id, result }, result.accepted ? 202 : 422);
  } finally {
    await lock.fetch("https://lock.internal/release", { method: "POST" });
  }
}

export class ListingFeedLock implements DurableObject {
  private locked = false;

  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/acquire" && request.method === "POST") {
      if (this.locked) return new Response("locked", { status: 409 });
      this.locked = true;
      await this.state.storage.setAlarm(Date.now() + 60_000);
      return new Response("acquired");
    }
    if (pathname === "/release" && request.method === "POST") {
      this.locked = false;
      await this.state.storage.deleteAlarm();
      return new Response("released");
    }
    return new Response("not found", { status: 404 });
  }

  alarm(): void {
    this.locked = false;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "arcanium-listing-control",
        environment: env.ENVIRONMENT,
        production_enabled: false,
        actions: {
          public_write: env.ALLOW_PUBLIC_WRITE === "true",
          sold_price_publish: env.ALLOW_SOLD_PRICE_PUBLISH === "true",
          destructive_url_change: env.ALLOW_DESTRUCTIVE_URL_CHANGE === "true",
          indexnow_submit: env.ALLOW_INDEXNOW_SUBMIT === "true",
          website_revalidation: env.ALLOW_WEBSITE_REVALIDATION === "true",
        },
      });
    }
    if (url.pathname !== "/v1/listing-sync" || request.method !== "POST") {
      return json({ ok: false, error: "NOT_FOUND" }, 404);
    }
    if (env.ENVIRONMENT !== "test" || env.ALLOW_PRODUCTION_DEPLOY === "true") {
      return json({ ok: false, error: "TEST_ONLY" }, 403);
    }
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > Number(env.MAX_FEED_BYTES)) {
      return json({ ok: false, error: "FEED_TOO_LARGE" }, 413);
    }
    const authError = await verifySignature(request, rawBody, env);
    if (authError) return authError;
    let candidate: unknown;
    try {
      candidate = JSON.parse(rawBody);
    } catch {
      return json({ ok: false, error: "INVALID_REQUEST_JSON" }, 400);
    }
    const syncRequest = validateRequest(candidate, env);
    return syncRequest ? processSync(syncRequest, env) : json({ ok: false, error: "INVALID_REQUEST" }, 400);
  },

  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const body = isRecord(message.body) ? message.body : {};
      await env.LISTING_DB.prepare(
        "INSERT OR IGNORE INTO listing_retry_queue_audit (environment, client_id, feed_id, run_id, message_id, event_type, attempt, status, error_code, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'delivered', NULL, ?)",
      ).bind(
        env.ENVIRONMENT,
        String(body.client_id ?? "unknown"),
        String(body.feed_id ?? "unknown"),
        String(body.run_id ?? "unknown"),
        message.id,
        String(body.event_type ?? "listing.sync_batch"),
        message.attempts,
        now(),
      ).run();
      message.ack();
    }
  },
};
