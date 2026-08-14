-- One-time, idempotent reconciliation for operator-test journeys that failed
-- while the production /api/inngest route returned 404 on 2026-08-09.
-- This script never creates a message job, provider job, outbox row, or event
-- for Inngest delivery.

UPDATE lead_journeys
SET status = 'STOPPED',
    next_due_at = NULL,
    stopped_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    stop_reason = 'INCIDENT_RECONCILIATION',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE journey_type = 'PREBOOKING'
  AND status = 'ACTIVE'
  AND lead_id IN (
    'lead_accb79c6-00c5-4a9a-86d5-e8c5063333ba',
    'lead_4b03c1e5-f0eb-436b-9b31-3591ef3c953b',
    'lead_3c6ef59a-a4d8-404e-b4ce-a94009ac97e3'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM message_jobs
    WHERE message_jobs.lead_id = lead_journeys.lead_id
      AND message_jobs.message_type <> 'PREBOOK_INSTANT_V3'
  );

UPDATE leads
SET lifecycle_state = 'CLOSED',
    journey_state = 'STOPPED_SUPPRESSED',
    manual_pause = 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE journey_state = 'ACTIVE'
  AND id IN (
    'lead_accb79c6-00c5-4a9a-86d5-e8c5063333ba',
    'lead_4b03c1e5-f0eb-436b-9b31-3591ef3c953b',
    'lead_3c6ef59a-a4d8-404e-b4ce-a94009ac97e3'
  )
  AND EXISTS (
    SELECT 1
    FROM lead_journeys
    WHERE lead_journeys.lead_id = leads.id
      AND lead_journeys.stop_reason = 'INCIDENT_RECONCILIATION'
  );

INSERT OR IGNORE INTO funnel_events (
  id, lead_id, booking_uid, event_type, event_at, source, correlation_id, message_type, metadata_json
) VALUES
  ('event_incident_reconcile_accb79c6', 'lead_accb79c6-00c5-4a9a-86d5-e8c5063333ba', NULL, 'JOURNEY_RECONCILED', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'operator', 'incident_inngest_route_404_20260809', NULL, '{"reason":"INNGEST_ROUTE_404","messageEffectsCreated":false}'),
  ('event_incident_reconcile_4b03c1e5', 'lead_4b03c1e5-f0eb-436b-9b31-3591ef3c953b', NULL, 'JOURNEY_RECONCILED', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'operator', 'incident_inngest_route_404_20260809', NULL, '{"reason":"INNGEST_ROUTE_404","messageEffectsCreated":false}'),
  ('event_incident_reconcile_3c6ef59a', 'lead_3c6ef59a-a4d8-404e-b4ce-a94009ac97e3', NULL, 'JOURNEY_RECONCILED', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'operator', 'incident_inngest_route_404_20260809', NULL, '{"reason":"INNGEST_ROUTE_404","messageEffectsCreated":false}');

INSERT INTO funnel_incidents (
  id, incident_key, severity, component, status, summary, safe_evidence_json,
  first_seen_at, last_seen_at, notified_at, resolved_at
) VALUES (
  'incident_inngest_route_404_20260809',
  'INNGEST_ROUTE_404:2026-08-09',
  'P1',
  'inngest',
  'RESOLVED',
  'Production Inngest route returned HTTP 404 during deployment gap',
  '{"failedLeadJourneys":3,"failedHeartbeats":10,"messageEffectsCreatedByReconciliation":false}',
  '2026-08-09T08:29:35.000Z',
  '2026-08-09T10:47:42.000Z',
  NULL,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(incident_key) DO UPDATE SET
  status = 'RESOLVED',
  last_seen_at = excluded.last_seen_at,
  resolved_at = excluded.resolved_at,
  safe_evidence_json = excluded.safe_evidence_json;
