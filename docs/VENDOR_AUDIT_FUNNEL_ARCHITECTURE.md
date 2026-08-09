# Vendor Audit Funnel Architecture Decision

The production website remains on Vercel at `arcaniumdigital.com` and `www.arcaniumdigital.com`. Authoritative DNS remains at Spaceship. Cloudflare does not manage this zone, so the funnel does not add a custom-domain route or change nameservers, apex, `www`, or email records.

Browser intake and booking analytics use the same-origin Vercel endpoints `/api/vendor-audit` and `/api/funnel-events`. Vercel forwards each bounded raw request to `https://arcanium-funnel-prod.enquiries-432.workers.dev` with a timestamped HMAC signature and the client address used only for Turnstile and a salted abuse hash. The Worker rejects direct or replayed browser requests. Provider webhooks use authenticated paths on the canonical `workers.dev` endpoint.

The only Cloudflare application stacks are `arcanium-funnel-prod` and `arcanium-funnel-staging`, each with its matching D1 database, main Queue, DLQ, Turnstile widget, schedules, and observability. Production and staging outbound send flags remain false until the live activation checklist passes.

D1 is authoritative for leads, consent, bookings, journeys, message jobs, provider jobs, webhook replay protection, incidents, and health. Queue handles immediate work and retries; Inngest holds long sleeps but must re-check D1 at each wake. Brevo is an operational projection, ClickSend is the SMS transport and human inbox, and Cal webhooks are authoritative for booking changes.
