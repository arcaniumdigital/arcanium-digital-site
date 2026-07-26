-- Forward-only TEST migration for A2 listing reconciliation.
-- Stores normalized listing state and compact operator evidence only.
CREATE TABLE IF NOT EXISTS listing_nonces (
  nonce TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_feeds (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  feed_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  last_verified_at TEXT,
  last_feed_hash TEXT,
  last_listing_count INTEGER NOT NULL DEFAULT 0,
  last_status TEXT NOT NULL DEFAULT 'never_verified',
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, feed_id)
);

CREATE TABLE IF NOT EXISTS listing_records (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  feed_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  lifecycle TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  canonical_url TEXT,
  sold_price_minor INTEGER,
  source_json TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_verified_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, feed_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_records_lifecycle
  ON listing_records(environment, client_id, feed_id, lifecycle, last_verified_at);

CREATE TABLE IF NOT EXISTS listing_sync_runs (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  feed_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT NOT NULL,
  preserve_last_known_good INTEGER NOT NULL,
  input_count INTEGER NOT NULL,
  accepted_count INTEGER NOT NULL,
  new_count INTEGER NOT NULL,
  updated_count INTEGER NOT NULL,
  sold_count INTEGER NOT NULL,
  withdrawn_count INTEGER NOT NULL,
  deleted_candidate_count INTEGER NOT NULL,
  operator_action_count INTEGER NOT NULL,
  overflow_action_count INTEGER NOT NULL,
  error_code TEXT,
  captured_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, run_id),
  UNIQUE(environment, client_id, feed_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS listing_operator_actions (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  feed_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  listing_id TEXT,
  action_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  reason TEXT NOT NULL,
  approval_required INTEGER NOT NULL,
  owner_group TEXT NOT NULL,
  evidence_ref TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, action_id),
  UNIQUE(environment, client_id, feed_id, dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_listing_operator_actions_open
  ON listing_operator_actions(environment, client_id, feed_id, status, severity);

CREATE TABLE IF NOT EXISTS listing_retry_queue_audit (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  feed_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, message_id, attempt)
);
