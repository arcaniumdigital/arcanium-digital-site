-- Forward-only TEST migration for A3 publication validation and URL governance.
-- Stores compact validation evidence and operator actions; never document bodies or secrets.
CREATE TABLE IF NOT EXISTS publication_nonces (
  nonce TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS publication_preflights (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  action TEXT NOT NULL,
  url TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  issue_count INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  consumed_at TEXT,
  PRIMARY KEY(environment, client_id, document_id, revision_id, action),
  UNIQUE(environment, client_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS publication_url_registry (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  url TEXT NOT NULL,
  document_id TEXT NOT NULL,
  page_type TEXT NOT NULL,
  ownership_key TEXT NOT NULL,
  status TEXT NOT NULL,
  last_revision_id TEXT NOT NULL,
  last_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, url),
  UNIQUE(environment, client_id, ownership_key)
);

CREATE TABLE IF NOT EXISTS publication_logs (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  publication_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  action TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  deterministic_passed INTEGER NOT NULL,
  live_verified INTEGER NOT NULL,
  issue_count INTEGER NOT NULL,
  operator_action_count INTEGER NOT NULL,
  overflow_action_count INTEGER NOT NULL,
  evidence_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, publication_id)
);

CREATE TABLE IF NOT EXISTS publication_issues (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  publication_id TEXT NOT NULL,
  issue_id TEXT NOT NULL,
  code TEXT NOT NULL,
  severity TEXT NOT NULL,
  field TEXT,
  safe_summary TEXT NOT NULL,
  approval_required INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, issue_id)
);

CREATE INDEX IF NOT EXISTS idx_publication_issues_open
  ON publication_issues(environment, client_id, status, severity, created_at);

CREATE TABLE IF NOT EXISTS publication_operator_actions (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  publication_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  owner_group TEXT NOT NULL,
  approval_required INTEGER NOT NULL,
  due_at TEXT,
  evidence_ref TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, action_id)
);

CREATE TABLE IF NOT EXISTS publication_retry_state (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  url TEXT NOT NULL,
  check_type TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  last_error_code TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, url, check_type)
);
