-- Forward-only test migration for A13-A15 durable state.
CREATE TABLE IF NOT EXISTS a13_projects (
  project_id TEXT PRIMARY KEY, environment TEXT NOT NULL, client_id TEXT NOT NULL,
  status TEXT NOT NULL, source_url TEXT, target_repo TEXT, target_project TEXT,
  preview_url TEXT, launch_approved_at TEXT, launched_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS a13_url_inventory (
  project_id TEXT NOT NULL, source_url TEXT NOT NULL, url_type TEXT NOT NULL,
  status_code INTEGER, canonical_url TEXT, content_hash TEXT, action_status TEXT NOT NULL,
  PRIMARY KEY(project_id, source_url)
);
CREATE TABLE IF NOT EXISTS a13_redirects (
  project_id TEXT NOT NULL, source_path TEXT NOT NULL, destination_path TEXT NOT NULL,
  redirect_type INTEGER NOT NULL, status TEXT NOT NULL, approved_at TEXT,
  PRIMARY KEY(project_id, source_path)
);
CREATE TABLE IF NOT EXISTS a13_launch_checks (
  project_id TEXT NOT NULL, check_id TEXT NOT NULL, status TEXT NOT NULL,
  detail_json TEXT NOT NULL, checked_at TEXT NOT NULL, PRIMARY KEY(project_id, check_id)
);
CREATE TABLE IF NOT EXISTS a13_approval_actions (
  action_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, client_id TEXT NOT NULL,
  action_type TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL,
  consumed_at TEXT, consumed_by TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS a14_experiments (
  experiment_id TEXT PRIMARY KEY, environment TEXT NOT NULL, client_id TEXT NOT NULL,
  name TEXT NOT NULL, hypothesis_version TEXT NOT NULL, page_scope_json TEXT NOT NULL,
  primary_metric TEXT NOT NULL, status TEXT NOT NULL, assignment_version TEXT NOT NULL,
  minimum_runtime_days INTEGER, minimum_sample INTEGER, started_at TEXT, stopped_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS a14_variants (
  experiment_id TEXT NOT NULL, variant_id TEXT NOT NULL, name TEXT NOT NULL,
  allocation_basis_points INTEGER NOT NULL, config_json TEXT NOT NULL, status TEXT NOT NULL,
  PRIMARY KEY(experiment_id, variant_id)
);
CREATE TABLE IF NOT EXISTS a14_assignments (
  experiment_id TEXT NOT NULL, subject_hash TEXT NOT NULL, variant_id TEXT NOT NULL,
  assigned_at TEXT NOT NULL, assignment_version TEXT NOT NULL,
  PRIMARY KEY(experiment_id, subject_hash)
);
CREATE TABLE IF NOT EXISTS a14_daily_metrics (
  experiment_id TEXT NOT NULL, variant_id TEXT NOT NULL, metric_date TEXT NOT NULL,
  exposures INTEGER NOT NULL DEFAULT 0, confirmed_conversions INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0, metric_json TEXT NOT NULL, closed_at TEXT NOT NULL,
  PRIMARY KEY(experiment_id, variant_id, metric_date)
);
CREATE TABLE IF NOT EXISTS a14_guardrail_events (
  event_id TEXT PRIMARY KEY, experiment_id TEXT NOT NULL, guardrail_code TEXT NOT NULL,
  severity TEXT NOT NULL, observed_value REAL, threshold_value REAL, status TEXT NOT NULL,
  occurred_at TEXT NOT NULL, resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS a14_results (
  experiment_id TEXT NOT NULL, analysis_version TEXT NOT NULL, result_status TEXT NOT NULL,
  result_json TEXT NOT NULL, generated_at TEXT NOT NULL, PRIMARY KEY(experiment_id, analysis_version)
);
CREATE TABLE IF NOT EXISTS a14_decisions (
  experiment_id TEXT PRIMARY KEY, decision TEXT NOT NULL, decision_reason TEXT NOT NULL,
  decided_by TEXT NOT NULL, decided_at TEXT NOT NULL, permanent_change_ref TEXT
);

CREATE TABLE IF NOT EXISTS a15_cost_entries (
  entry_id TEXT PRIMARY KEY, environment TEXT NOT NULL, client_id TEXT, provider TEXT NOT NULL,
  automation_id TEXT, service_period TEXT NOT NULL, source_type TEXT NOT NULL,
  external_record_id TEXT NOT NULL, currency TEXT NOT NULL, amount_minor INTEGER NOT NULL,
  allocation_status TEXT NOT NULL, metadata_json TEXT NOT NULL, imported_at TEXT NOT NULL,
  UNIQUE(environment, provider, external_record_id)
);
CREATE TABLE IF NOT EXISTS a15_revenue_entries (
  entry_id TEXT PRIMARY KEY, environment TEXT NOT NULL, client_id TEXT NOT NULL,
  service_period TEXT NOT NULL, revenue_type TEXT NOT NULL, external_record_id TEXT NOT NULL,
  currency TEXT NOT NULL, amount_minor INTEGER NOT NULL, status TEXT NOT NULL,
  metadata_json TEXT NOT NULL, imported_at TEXT NOT NULL,
  UNIQUE(environment, revenue_type, external_record_id)
);
CREATE TABLE IF NOT EXISTS a15_effort_entries (
  entry_id TEXT PRIMARY KEY, environment TEXT NOT NULL, client_id TEXT, automation_id TEXT,
  work_type TEXT NOT NULL, external_record_id TEXT NOT NULL, effort_minutes INTEGER,
  effort_units REAL, cost_minor INTEGER, service_period TEXT NOT NULL,
  metadata_json TEXT NOT NULL, imported_at TEXT NOT NULL,
  UNIQUE(environment, work_type, external_record_id)
);
CREATE TABLE IF NOT EXISTS a15_entitlements (
  client_id TEXT NOT NULL, package_version TEXT NOT NULL, effective_from TEXT NOT NULL,
  effective_to TEXT, entitlement_json TEXT NOT NULL, status TEXT NOT NULL, updated_at TEXT NOT NULL,
  PRIMARY KEY(client_id, package_version, effective_from)
);
CREATE TABLE IF NOT EXISTS a15_monthly_close (
  environment TEXT NOT NULL, client_id TEXT NOT NULL, year_month TEXT NOT NULL,
  allocation_method_version TEXT NOT NULL, status TEXT NOT NULL, revenue_minor INTEGER,
  direct_cost_minor INTEGER, shared_cost_minor INTEGER, labour_cost_minor INTEGER,
  contribution_minor INTEGER, margin_basis_points INTEGER, limitation_json TEXT NOT NULL,
  closed_at TEXT, updated_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, year_month, allocation_method_version)
);
CREATE TABLE IF NOT EXISTS a15_capacity_snapshots (
  environment TEXT NOT NULL, snapshot_date TEXT NOT NULL, workstream TEXT NOT NULL,
  available_minutes INTEGER, committed_minutes INTEGER, backlog_minutes INTEGER,
  risk_status TEXT NOT NULL, forecast_json TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY(environment, snapshot_date, workstream)
);
CREATE TABLE IF NOT EXISTS a15_learning_aggregates (
  aggregate_key TEXT NOT NULL, period TEXT NOT NULL, metric_name TEXT NOT NULL,
  cohort_definition TEXT NOT NULL, sample_size INTEGER NOT NULL, metric_json TEXT NOT NULL,
  privacy_status TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY(aggregate_key, period, metric_name)
);
