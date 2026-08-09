# Provider Configuration

All credentials belong in provider secret stores, Cloudflare Worker secrets, Vercel server-only variables, or the operator environment. Never paste credentials into source, URLs, browser variables, screenshots, or reports.

## Cal.com

- Configure the event slug and event type ID from the production Vendor Conversion Audit event.
- Register the authenticated webhook at `https://arcanium-funnel-prod.enquiries-432.workers.dev/webhooks/cal/bookings` for created, rescheduled, cancelled, ended/completed, and no-show events supported by the account.
- Store the signing secret as `CAL_WEBHOOK_SECRET`; confirm the provider check reports the expected URL and event slug.
- The embed passes signed correlation metadata only for the same accepted browser session. The SMS URL remains exactly `https://arcaniumdigital.com/audit`.

## ClickSend

- Use the approved connected sender `0413105755`. Replies arrive on that handset and must be monitored manually; the ClickSend inbound webhook is not treated as authoritative for this own-number sender.
- Configure delivery receipts at `https://arcanium-funnel-prod.enquiries-432.workers.dev/webhooks/clicksend/receipts/<strong-random-token>` and inbound SMS at `https://arcanium-funnel-prod.enquiries-432.workers.dev/webhooks/clicksend/inbound/<different-strong-random-token>`.
- Disable URL shortening. Obtain URL-message approval for the branded `/audit` link and verify sufficient balance above the configured reserve.
- Pre-book nurture is explicitly approved with manual reply/STOP monitoring on `0413105755`. Keep the weekly paid canary disabled. Production, ClickSend, URL, manual-reply, nurture, and booking-reminder flags may be enabled only with explicit operator approval.

## Brevo

- Create the funnel pipeline/stages, contact attributes, one-deal-per-lead convention, authenticated sender, and transactional templates listed in `.env.example`.
- Templates receive opaque IDs and aggregate/safe operational values. Inbound reply bodies remain in ClickSend’s monitored inbox and are not placed into logs or Queue payloads.
- A Brevo outage must not block D1 acceptance, SMS, or booking state updates.

## Inngest and monitoring

- Configure the Next.js serve endpoint `/api/inngest`, event key, signing key, and app ID.
- Confirm the heartbeat updates within 45 minutes and the D1/Queue canary completes within two minutes.
- Add an independent external monitor for the protected funnel health URL and public booking page, alerting through channels independent of the Worker.
