# Manual Setup Checklist

## Cloudflare

- Confirm account `432cead2590c126874503304ecfdfc69`, the external-DNS guard `EXTERNAL_DNS_NOT_CLOUDFLARE`, Spaceship authoritative nameservers, and the protected Vercel apex/`www` records.
- Generate the full inventory, protected-resource manifest, reviewed reset plan, backup receipt, and post-reset inventory.
- Create `arcanium-funnel-prod`, `arcanium-funnel-staging`, matching D1 databases, main Queues, and DLQs.
- Apply `workers/funnel/migrations`; confirm schema version `1`.
- Keep the canonical Worker on its `workers.dev` endpoint and configure Vercel’s same-origin signed proxy; do not change the Spaceship or Vercel DNS records.
- Create production and staging Turnstile widgets and store secrets only in Worker secret storage.
- Put every required secret listed in `.env.example` into the appropriate production/staging secret manager.
- Confirm Workers Logs, traces, Cron schedules, Queue consumers, DLQ consumer, and the protected health route.

## Vercel and Inngest

- Add all public and server-only Vercel variables from `.env.example`.
- Sync `/api/inngest`; verify the three `-v4` functions are registered in the production app.
- Send a test heartbeat and verify D1 `component_health.inngest` updates.

## Cal.com

- Use the approved Vendor Conversion Audit event slug and require name, email, and best mobile number.
- Configure the exact webhook URL, secret, and booking created/rescheduled/cancelled/no-show/completed triggers.
- Confirm mobile extraction against a real webhook payload and test reschedule/cancellation URLs.

## Brevo

- Create the pipeline/stages, contact attributes, authenticated sender, internal templates, and operator recipient.
- Record every numeric ID in secret/config storage and send a test internal email.

## ClickSend

- Confirm the existing approved reply-capable Australian sender, API credentials, business registration, URL-message approval, inbound webhook, receipt webhook, reserve balance, and auto-recharge. Do not provision another number solely for this funnel.
- Test an allowlisted number, delivery receipt, normal reply, and STOP before enabling production flags.

## Independent monitoring

- Create UptimeRobot five-minute monitors for the protected health keyword `FUNNEL_OK`, homepage marker, and vendor-audit booking marker.
- Configure down and recovery alerts; keep the health token out of any public status page.
