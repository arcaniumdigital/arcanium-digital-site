-- Forward-only TEST schema for A4 compact GBP review reconciliation.
-- Stores no contact destinations, OAuth credentials or full public reply text.
CREATE TABLE IF NOT EXISTS gbp_control_nonces (
  nonce TEXT PRIMARY KEY, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS gbp_reviews (
  environment TEXT NOT NULL, client_id TEXT NOT NULL, location_id TEXT NOT NULL,
  review_id TEXT NOT NULL, revision_hash TEXT NOT NULL, rating INTEGER NOT NULL,
  severity TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
  missing_full_scans INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, location_id, review_id)
);
CREATE TABLE IF NOT EXISTS gbp_review_actions (
  environment TEXT NOT NULL, client_id TEXT NOT NULL, action_id TEXT NOT NULL,
  location_id TEXT NOT NULL, review_id TEXT, action_type TEXT NOT NULL,
  severity TEXT NOT NULL, approval_required INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, action_id)
);
CREATE TABLE IF NOT EXISTS gbp_publication_audit (
  environment TEXT NOT NULL, client_id TEXT NOT NULL, audit_id TEXT NOT NULL,
  location_id TEXT NOT NULL, source_revision_hash TEXT NOT NULL, approval_id TEXT NOT NULL,
  action_type TEXT NOT NULL, outcome TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, audit_id)
);
