# Inngest route 404 incident — 2026-08-09

## Cause

The production Inngest app was registered before the Next.js `/api/inngest` route was present in the active production deployment. Inngest received the site's HTML 404 response before its SDK could respond.

## Impact

- Ten scheduled heartbeat runs failed.
- Three operator-test prebooking journeys failed.
- Each affected test lead's instant message was already delivered by the funnel Worker.
- No 10-minute, 24-hour, or 7-day message job was created for those three journeys.
- No client lead was affected.

## Recovery

`2026-08-09-inngest-route-404-reconciliation.sql` stops only the three exact operator-test journeys, records an audit event, and closes this incident. It does not create an outbox row, message job, provider job, or Inngest event.

## Prevention

- `/api/inngest` exposes an explicit lightweight health contract while preserving the SDK's signed `GET`, `POST`, and `PUT` handlers.
- A 30-minute watchdog verifies both the public Inngest route and the internal funnel heartbeat, with five retry attempts.
- The internal heartbeat is responsible for stale job/journey reconciliation and durable incident recording.
- Production promotion must verify `/api/inngest?probe=deployment` before considering the deployment healthy.
- `/audit` redirects to the live `/vendor-audit` page so existing nurture links cannot strand a lead on a 404.
