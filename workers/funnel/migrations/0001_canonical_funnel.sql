PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  submission_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  email TEXT,
  source_page TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  fbclid_hash TEXT,
  gclid_hash TEXT,
  marketing_sms_consent INTEGER NOT NULL,
  consent_version TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  privacy_notice_version TEXT NOT NULL,
  consent_recorded_at TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL DEFAULT 'NEW',
  booking_state TEXT NOT NULL DEFAULT 'NOT_BOOKED',
  journey_state TEXT NOT NULL DEFAULT 'PENDING',
  suppression_state TEXT NOT NULL DEFAULT 'NONE',
  manual_pause INTEGER NOT NULL DEFAULT 0,
  replied_at TEXT,
  brevo_contact_id TEXT,
  brevo_deal_id TEXT,
  current_booking_uid TEXT,
  latest_message_type TEXT,
  latest_message_sent_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (marketing_sms_consent IN (0, 1)),
  CHECK (manual_pause IN (0, 1)),
  CHECK (booking_state IN ('NOT_BOOKED','BOOKED','RESCHEDULED','CANCELLED','COMPLETED','NO_SHOW')),
  CHECK (journey_state IN ('PENDING','ACTIVE','PAUSED_REPLY','PAUSED_MANUAL','STOPPED_BOOKED','STOPPED_SUPPRESSED','COMPLETED','FAILED'))
);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone_e164);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_booking_state ON leads(booking_state);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE TABLE IF NOT EXISTS booking_context_sessions (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  session_hash TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'homepage_form',
  expires_at TEXT NOT NULL,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  cal_booking_uid TEXT NOT NULL UNIQUE,
  prior_cal_booking_uid TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  event_type_id TEXT,
  event_type_slug TEXT,
  attendee_email TEXT,
  attendee_phone_e164 TEXT,
  correlation_method TEXT NOT NULL,
  correlation_confidence TEXT NOT NULL,
  booking_source TEXT,
  attributed_message_type TEXT,
  start_at_utc TEXT NOT NULL,
  end_at_utc TEXT NOT NULL,
  attendee_timezone TEXT,
  reschedule_url TEXT,
  cancellation_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  cancelled_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  CHECK (status IN ('BOOKED','RESCHEDULED','CANCELLED','COMPLETED','NO_SHOW'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_lead ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(start_at_utc);

CREATE TABLE IF NOT EXISTS lead_journeys (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  journey_type TEXT NOT NULL,
  inngest_run_id TEXT,
  booking_uid TEXT NOT NULL DEFAULT '',
  booking_revision INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  next_due_at TEXT,
  started_at TEXT NOT NULL,
  stopped_at TEXT,
  stop_reason TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  UNIQUE (lead_id, journey_type, booking_uid, booking_revision)
);

CREATE TABLE IF NOT EXISTS message_jobs (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  booking_uid TEXT NOT NULL DEFAULT '',
  booking_revision INTEGER NOT NULL DEFAULT 0,
  message_type TEXT NOT NULL,
  template_version TEXT NOT NULL,
  rendered_body_hash TEXT,
  due_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  provider_status TEXT,
  provider_parts INTEGER,
  provider_price REAL,
  provider_currency TEXT,
  side_effect_state TEXT NOT NULL DEFAULT 'NOT_STARTED',
  last_error_code TEXT,
  last_error_message_redacted TEXT,
  created_at TEXT NOT NULL,
  claimed_at TEXT,
  sent_at TEXT,
  delivered_at TEXT,
  cancelled_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  UNIQUE (lead_id, message_type, booking_uid, booking_revision),
  CHECK (status IN ('PENDING','QUEUED','CLAIMED','SENDING','ACCEPTED','DELIVERED','RETRYING','SIDE_EFFECT_UNKNOWN','CANCELLED','SKIPPED','FAILED_PERMANENT'))
);
CREATE INDEX IF NOT EXISTS idx_message_jobs_due ON message_jobs(status, due_at);
CREATE INDEX IF NOT EXISTS idx_message_jobs_provider ON message_jobs(provider_message_id);

CREATE TABLE IF NOT EXISTS provider_jobs (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  booking_uid TEXT,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  side_effect_state TEXT NOT NULL DEFAULT 'NOT_STARTED',
  idempotency_key TEXT NOT NULL UNIQUE,
  safe_payload_json TEXT NOT NULL,
  provider_reference TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  claimed_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
CREATE INDEX IF NOT EXISTS idx_provider_jobs_status ON provider_jobs(status, created_at);

CREATE TABLE IF NOT EXISTS inbound_messages (
  id TEXT PRIMARY KEY,
  provider_event_id TEXT NOT NULL UNIQUE,
  provider_message_id TEXT,
  lead_id TEXT,
  from_phone_e164 TEXT NOT NULL,
  to_number TEXT,
  normalised_intent TEXT,
  body_ciphertext TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE TABLE IF NOT EXISTS suppressions (
  id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  processing_status TEXT NOT NULL,
  error_code TEXT,
  UNIQUE (provider, provider_event_key)
);

CREATE TABLE IF NOT EXISTS funnel_events (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  booking_uid TEXT,
  event_type TEXT NOT NULL,
  event_at TEXT NOT NULL,
  source TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  message_type TEXT,
  metadata_json TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
CREATE INDEX IF NOT EXISTS idx_funnel_events_lead ON funnel_events(lead_id, event_at);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  published_at TEXT,
  last_error_code TEXT
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox(status, created_at);

CREATE TABLE IF NOT EXISTS funnel_incidents (
  id TEXT PRIMARY KEY,
  incident_key TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL,
  component TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  safe_evidence_json TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  notified_at TEXT,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS component_health (
  component TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  last_success_at TEXT,
  last_failure_at TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  safe_detail_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS canary_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  queued_at TEXT,
  completed_at TEXT,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS abuse_windows (
  abuse_key TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (abuse_key, window_started_at)
);

INSERT OR REPLACE INTO component_health (
  component, status, last_success_at, consecutive_failures, safe_detail_json, updated_at
) VALUES (
  'schema', 'healthy', CURRENT_TIMESTAMP, 0, '{"schemaVersion":"1"}', CURRENT_TIMESTAMP
);
