# Funnel Operations Runbook

Generate the protected, aggregate-only operator view with `pnpm funnel:report` after setting `FUNNEL_INTERNAL_API_URL` and `FUNNEL_INTERNAL_HMAC_SECRET` in the operator environment. The report includes health freshness, latest lead/webhook/canary times, job/booking/message states, DLQ count, deployment/schema versions, and open incidents without customer PII.

Check the protected health endpoint first. A response without `FUNNEL_OK` is deliberately unhealthy. Review open P1 incidents, the latest queue canary, Inngest heartbeat, stale jobs, DLQ entries, deployment version, and migration version.

For an SMS failure, inspect the canonical `message_jobs` row by opaque job ID. Never retry `ACCEPTED`, `DELIVERED`, or `SIDE_EFFECT_UNKNOWN` jobs. Reconcile an unknown side effect against ClickSend history/receipts before a human creates a replacement job. A Brevo failure is a separate provider job and must not replay SMS.

For a missing booking, verify the Cal signature result and event key, then inspect correlation in this order: signed session, normalized mobile, unique email, direct booking. Never match by name. A valid direct booking remains canonical and should receive confirmation/reminders while raising an operator warning.

For replies or STOP, verify the inbound event was deduplicated, the phone-wide jobs/journeys were cancelled, and STOP has an active suppression. Do not store or paste message bodies into logs or tickets.

For a stale canary, confirm Cron fired, the outbox published, Queue consumed, and the DLQ is empty. Do not use a paid SMS as the five-minute canary.

Recovery order: disable production SMS, preserve evidence, repair the failing component, run unit/Worker/E2E tests, run the synthetic canary, verify health, then re-enable only the minimum approved flag.
