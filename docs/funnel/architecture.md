# Vendor Audit Funnel Architecture

The website remains on Vercel and authoritative DNS remains at Spaceship. A dedicated Cloudflare Worker at `arcanium-funnel-prod.enquiries-432.workers.dev` owns intake, authenticated internal endpoints, Cal and ClickSend webhooks, health checks, D1, Queue, DLQ, and scheduled monitoring. Browser requests use same-origin Vercel routes (`/api/vendor-audit` and `/api/funnel-events`) that sign and proxy the raw request to the Worker. This preserves the apex and `www` records and does not require a Cloudflare zone migration.

The canonical visitor path is:

`homepage form → D1 transaction → HTTP 202 → /vendor-audit → Cal.com booking`

The request never waits for ClickSend, Brevo, Inngest, or Queue delivery. D1 is the source of truth; Brevo is an operational projection. A short-lived opaque cookie is hashed in D1 and resolved server-to-server so Cal can be prefilled without contact details in the URL. Every SMS uses the same clean `/audit` link, which sets only an aggregate `sms` source cookie and redirects with HTTP 303.

Provider side effects are split into separate idempotent jobs. SMS, Brevo synchronization, internal email, and Inngest emission cannot cause each other to repeat. Ambiguous provider timeouts stop in `SIDE_EFFECT_UNKNOWN` and require reconciliation.

Inngest holds long sleeps; the Worker remains authoritative at each wake. Cal webhooks update booking state transactionally, stop all matching pre-booking journeys, and create a new revision-scoped reminder journey. ClickSend inbound STOP creates a global phone suppression and cancels every active journey for that number.

Production sends start disabled. Activation requires the three SMS flags plus ClickSend, two-way, and URL approval flags to pass the send gate.
