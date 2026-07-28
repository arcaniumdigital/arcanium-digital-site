-- Forward-only TEST migration for the compact A12 operations control plane.
-- Contains no provider secrets, raw telemetry, or public/customer payloads.
CREATE TABLE IF NOT EXISTS a12_ops_events (
  event_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  provider TEXT NOT NULL,
  summary TEXT NOT NULL,
  incident_id TEXT,
  dedup_key TEXT NOT NULL,
  classification TEXT NOT NULL,
  retryable INTEGER NOT NULL,
  replay_kind TEXT NOT NULL,
  payload_ref TEXT,
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  UNIQUE(environment, client_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS a12_ops_incidents (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  incident_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  classification TEXT NOT NULL,
  error_code TEXT,
  summary TEXT NOT NULL,
  affected_count INTEGER NOT NULL,
  data_loss_window_minutes INTEGER NOT NULL,
  retryable INTEGER NOT NULL,
  replay_kind TEXT NOT NULL,
  owner_group TEXT NOT NULL,
  status TEXT NOT NULL,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  resolved_at TEXT,
  verification_evidence_ref TEXT,
  PRIMARY KEY(environment, client_id, incident_id),
  UNIQUE(environment, client_id, dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_a12_ops_incidents_open
  ON a12_ops_incidents(environment, client_id, status, severity, last_seen);

CREATE TABLE IF NOT EXISTS a12_ops_incident_timeline (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  incident_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence_ref TEXT,
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, incident_id, event_id)
);

CREATE TABLE IF NOT EXISTS a12_recovery_requests (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  recovery_id TEXT NOT NULL,
  incident_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  replay_kind TEXT NOT NULL,
  approval_id TEXT,
  approval_required INTEGER NOT NULL,
  approved INTEGER NOT NULL DEFAULT 0,
  executed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, recovery_id)
);

CREATE TABLE IF NOT EXISTS a12_provider_health (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  status TEXT NOT NULL,
  freshness_age_seconds INTEGER,
  checked_at TEXT NOT NULL,
  evidence_ref TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, provider, automation_id)
);

CREATE TABLE IF NOT EXISTS a12_cost_health (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  service_period TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  threshold_minor INTEGER NOT NULL,
  threshold_exceeded INTEGER NOT NULL,
  evidence_ref TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, provider, automation_id, service_period)
);

CREATE TABLE IF NOT EXISTS a12_control_reviews (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  review_id TEXT NOT NULL,
  review_type TEXT NOT NULL,
  owner_group TEXT NOT NULL,
  status TEXT NOT NULL,
  due_at TEXT,
  evidence_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, review_id)
);
