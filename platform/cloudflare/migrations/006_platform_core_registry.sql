-- Forward-only TEST migration. Contains no provider secrets or production data.
CREATE TABLE IF NOT EXISTS platform_client_registry (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  config_version TEXT NOT NULL,
  status TEXT NOT NULL,
  config_json TEXT NOT NULL,
  config_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, config_version)
);

CREATE INDEX IF NOT EXISTS idx_platform_client_registry_active
  ON platform_client_registry(environment, client_id, status);

CREATE TABLE IF NOT EXISTS platform_event_audit (
  event_id TEXT PRIMARY KEY,
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  severity TEXT NOT NULL,
  payload_ref TEXT,
  disposition TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_event_audit_correlation
  ON platform_event_audit(environment, client_id, correlation_id, created_at);

CREATE TABLE IF NOT EXISTS platform_reconciliation_cursor (
  consumer_name TEXT NOT NULL,
  environment TEXT NOT NULL,
  cursor_value TEXT,
  last_success_at TEXT,
  last_error_code TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(consumer_name, environment)
);
