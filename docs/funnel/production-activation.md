# Production Activation Checklist

1. Review legal/privacy wording and approve the unchecked SMS consent copy.
2. Confirm the reset plan digest and backups; apply only the reviewed legacy-resource manifest.
3. Provision production/staging resources and apply migrations with SMS flags off.
4. Deploy the Worker, then Vercel, then sync Inngest.
5. Validate Turnstile success, failure, expiry, hostname, action, and replay rejection.
6. Submit one test-mode lead and confirm D1 acceptance/navigation is independent of 20-second provider delays.
7. Validate Brevo contact/deal/internal email, Cal booking/reschedule/cancel, ClickSend accepted/receipt/reply/STOP, Queue retry, DLQ incident, and recovery alert.
8. Run the full automated suite and public route smoke checks.
9. Confirm protected health and all three UptimeRobot monitors recover cleanly.
10. Enable ClickSend/two-way/URL approval first, then `ALLOW_PRODUCTION_SMS`, then approved nurture/reminder flags one at a time.
11. Watch the first real lead end-to-end. Do not enable the weekly paid canary unless separately approved.

Activation is incomplete while any P1 incident is open, a provider check is stale, the canary or heartbeat is stale, schema/deployment versions disagree, or the live consent wording is unapproved.
