-- Forward-only TEST migration for listing-side operator-action resolution audit.
CREATE TABLE IF NOT EXISTS listing_action_resolutions (
  environment TEXT NOT NULL,
  client_id TEXT NOT NULL,
  feed_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  resolution_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  disposition TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_ref TEXT,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY(environment, client_id, resolution_id, action_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_action_resolutions_action
  ON listing_action_resolutions(environment, client_id, feed_id, action_id, recorded_at);
