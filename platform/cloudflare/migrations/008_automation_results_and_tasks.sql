-- Forward-only TEST migration for A1-A15 result, task, approval and
-- reconciliation state. Contains no provider secrets or raw sensitive payloads.
CREATE TABLE IF NOT EXISTS platform_automation_runs (
  result_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  input_count INTEGER NOT NULL,
  accepted_count INTEGER NOT NULL,
  rejected_count INTEGER NOT NULL,
  output_count INTEGER NOT NULL,
  error_code TEXT,
  error_classification TEXT,
  retryable INTEGER NOT NULL DEFAULT 0,
  limitations_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(environment, client_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_platform_automation_runs_lookup
  ON platform_automation_runs(environment, client_id, automation_id, completed_at);

CREATE TABLE IF NOT EXISTS platform_operator_actions (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  result_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  action_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  mutation_kind TEXT NOT NULL,
  approval_required INTEGER NOT NULL,
  owner_group TEXT,
  due_at TEXT,
  evidence_ref TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, action_id),
  UNIQUE(environment, client_id, automation_id, dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_platform_operator_actions_open
  ON platform_operator_actions(environment, client_id, automation_id, status, severity);

CREATE TABLE IF NOT EXISTS platform_approval_requests (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  mutation_kind TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  decided_at TEXT,
  decided_by TEXT,
  decision_evidence_ref TEXT,
  PRIMARY KEY(environment, client_id, action_id)
);

CREATE TABLE IF NOT EXISTS platform_reconciliation_results (
  result_id TEXT PRIMARY KEY,
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  expected_count INTEGER NOT NULL,
  observed_count INTEGER NOT NULL,
  balanced INTEGER NOT NULL,
  method TEXT NOT NULL,
  evidence_ref TEXT,
  reconciled_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_result_incidents (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  incident_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  result_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  severity TEXT NOT NULL,
  classification TEXT NOT NULL,
  error_code TEXT NOT NULL,
  retryable INTEGER NOT NULL,
  status TEXT NOT NULL,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  verification_evidence_ref TEXT,
  PRIMARY KEY(environment, client_id, incident_id),
  UNIQUE(environment, client_id, dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_platform_result_incidents_open
  ON platform_result_incidents(environment, client_id, status, severity, last_seen);
