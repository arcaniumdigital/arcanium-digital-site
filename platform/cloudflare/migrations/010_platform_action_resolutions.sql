-- Forward-only TEST migration for signed operator-action resolution.
CREATE TABLE IF NOT EXISTS platform_action_resolution_runs (
  resolution_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  resolution_count INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(environment, client_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_platform_action_resolution_runs_lookup
  ON platform_action_resolution_runs(environment, client_id, automation_id, occurred_at);

CREATE TABLE IF NOT EXISTS platform_action_resolution_items (
  resolution_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  disposition TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_ref TEXT,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY(resolution_id, action_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_action_resolution_items_action
  ON platform_action_resolution_items(environment, client_id, automation_id, action_id);
