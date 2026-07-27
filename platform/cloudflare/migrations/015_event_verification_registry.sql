-- TEST event verification registry. Stores identifiers only; payloads remain in
-- the owning workflow system and are never persisted here.
CREATE TABLE IF NOT EXISTS platform_event_verifications (
  environment TEXT NOT NULL CHECK (environment IN ('test', 'production')),
  client_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  event_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  PRIMARY KEY (environment, client_id, idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_event_verifications_event_id
ON platform_event_verifications(environment, client_id, event_id);

CREATE INDEX IF NOT EXISTS idx_platform_event_verifications_correlation
ON platform_event_verifications(environment, client_id, correlation_id);
