-- Forward-only TEST migration for queue delivery, retry and DLQ evidence.
CREATE TABLE IF NOT EXISTS platform_queue_delivery (
  event_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  queue_name TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  disposition TEXT NOT NULL,
  body_json TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  PRIMARY KEY(message_id, queue_name, attempt)
);

CREATE INDEX IF NOT EXISTS idx_platform_queue_delivery_event
  ON platform_queue_delivery(event_id, queue_name, attempt);
