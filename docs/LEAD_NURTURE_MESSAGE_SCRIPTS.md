# Lead nurture message scripts, version 3.2.0

This is the operator map for changing nurture copy and timing. Do not edit D1 rows or provider job payloads to change a message; those are delivery records, not templates.

## SMS copy

The live SMS bodies are in the production Cloudflare Worker `arcanium-funnel-prod`, in the source module labelled `src/messages.ts` inside the Worker editor:

1. Cloudflare Dashboard -> Workers & Pages -> `arcanium-funnel-prod` -> Edit code.
2. Search for `// src/messages.ts` or `var templates =`.
3. Edit the relevant template key, preview it, then deploy a new Worker version.

The active template keys and current copy are:

| Key | Current script |
| --- | --- |
| `PREBOOK_INSTANT_V3` | Hi `{{first_name}}`, thanks for requesting your Vendor Lead Opportunity Snapshot. Choose a time to review it: `{{booking_link}}`. Questions? Reply here. `{{operator_name}}`, `{{business_name}}`. |
| `PREBOOK_10M_V3` | Hi `{{first_name}}`, still choosing a time? Pick a slot that suits you. We can discuss the local vendor searches worth targeting. Questions? Reply here. `{{operator_name}}`, `{{business_name}}`. |
| `PREBOOK_24H_V3` | Hi `{{first_name}}`, local vendors are searching for agents ready to help them sell. Your Snapshot can show where Google Ads and your online presence may create more opportunities. Book a time: `{{booking_link}}`. `{{operator_name}}`, `{{business_name}}`. |
| `PREBOOK_7D_V3` | Hi `{{first_name}}`, I'll close this out for now. If you still want your Vendor Lead Opportunity Snapshot, book a time here: `{{booking_link}}`. `{{operator_name}}`, `{{business_name}}`. |
| `BOOKING_CONFIRMED_V3` | Hi `{{first_name}}`, thanks for booking your Vendor Lead Opportunity Snapshot call with `{{business_name}}` for `{{appointment_date}}` at `{{appointment_time}}` `{{timezone}}`. Before we speak, see our brochure: `{{brochure_link}}`. `{{operator_name}}` |
| `BOOKING_REMINDER_24H_V3` | Hi `{{first_name}}`, reminder: I'll call you tomorrow at `{{appointment_time}}` `{{timezone}}`. We'll discuss local vendor searches and the next practical steps. Need to reschedule? `{{reschedule_link}}`. `{{operator_name}}`, `{{business_name}}`. |
| `BOOKING_REMINDER_3H_V3` | Reminder: your Vendor Lead Opportunity Snapshot call starts in 3 hours at `{{appointment_time}}` `{{timezone}}`. `{{operator_name}}`, `{{business_name}}`. |
| `BOOKING_REMINDER_EARLY_V3` | Reminder: your Vendor Lead Opportunity Snapshot call is tomorrow at `{{appointment_time}}` `{{timezone}}`. `{{operator_name}}`, `{{business_name}}`. |

Keep the placeholder names unchanged. The copy contains no em dash or opt-out sentence. Inbound STOP messages still suppress the contact and cancel the remaining journey. The Worker also rejects messages over the configured SMS-part cap, suppressed contacts, replies, booked leads, missing consent, stale booking revisions, quiet-hour sends, and duplicate provider sends.

## Timing and journey rules

The schedules are in [`inngest/functions.ts`](../inngest/functions.ts):

- immediate SMS: created by the Cloudflare Worker when the form is accepted;
- follow-ups: 10 minutes, 24 hours, and 7 days;
- booked reminders: 24 hours and 3 hours before the booking, adjusted to the 07:00-20:00 Brisbane send window;
- cancellation: booking, reply, STOP, manual pause, or closed-lead events cancel the remaining journey.

## Operator email copy

The internal email bodies are Brevo transactional templates. Change them in Brevo -> Transactional -> Templates. The Worker selects them through these bindings:

- `BREVO_TEMPLATE_NEW_LEAD_ID`
- `BREVO_TEMPLATE_BOOKING_CREATED_ID`
- `BREVO_TEMPLATE_BOOKING_CANCELLED_ID`
- `BREVO_TEMPLATE_REPLY_ALERT_ID`
- `BREVO_TEMPLATE_INCIDENT_ID`
- `BREVO_TEMPLATE_DAILY_DIGEST_ID`

Brevo contact/deal syncing does not control SMS copy.

## Safe release checklist

1. Make the change in a non-production Worker version or duplicate Brevo template.
2. Preserve all placeholders and the existing backend STOP suppression.
3. Run the repository tests and deployment probe.
4. Test only with the approved operator address/number; do not use a client record.
5. Promote the version, then verify Cloudflare component health and Inngest runs.

The platform watchdog runs every 30 minutes. At two durable steps per run, this uses approximately 4,320 Inngest executions in a 30-day month before retries.
