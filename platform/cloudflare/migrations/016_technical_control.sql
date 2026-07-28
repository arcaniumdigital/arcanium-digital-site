CREATE TABLE IF NOT EXISTS technical_nonces (
  nonce TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS technical_runs (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (environment, client_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS technical_issues (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  run_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL,
  approval_required INTEGER NOT NULL,
  status TEXT NOT NULL,
  safe_summary TEXT NOT NULL,
  verification_evidence TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (environment, client_id, dedup_key)
);

CREATE TABLE IF NOT EXISTS technical_incidents (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  safe_summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (environment, client_id, dedup_key)
);

CREATE TABLE IF NOT EXISTS technical_verifications (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  issue_dedup_key TEXT NOT NULL,
  verification_id TEXT NOT NULL,
  passed INTEGER NOT NULL,
  evidence_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (environment, client_id, verification_id)
);
