# Lead nurture message scripts

This is the operator map for changing nurture copy and timing. Do not edit D1 rows or provider job payloads to change a message; those are delivery records, not templates.

## SMS copy

The live SMS bodies are in the production Cloudflare Worker `arcanium-funnel-prod`, in the source module labelled `src/messages.ts` inside the Worker editor:

1. Cloudflare Dashboard -> Workers & Pages -> `arcanium-funnel-prod` -> Edit code.
2. Search for `// src/messages.ts` or `var templates =`.
3. Edit the relevant template key, preview it, then deploy a new Worker version.

The active template keys and current copy are:

| Key | Current script |
| --- | --- |
| `PREBOOK_INSTANT_V3` | Hi `{{first_name}}`, thanks for getting in touch. Book your 15-minute Vendor Conversion Audit here: `{{booking_link}}`. Questions? Reply here. `{{operator_name}}`, `{{business_name}}`. STOP to opt out. |
| `PREBOOK_10M_V3` | Still choosing a time? Book the closest suitable slot and reschedule later if needed: `{{booking_link}}`. `{{operator_name}}`, `{{business_name}}`. STOP to opt out. |
| `PREBOOK_24H_V3` | Hi `{{first_name}}`, vendors often Google an agent before deciding who to call. I'll show you the biggest online trust gap I can find in a 15-minute audit: `{{booking_link}}`. `{{operator_name}}`, `{{business_name}}`. STOP to opt out. |
| `PREBOOK_7D_V3` | Hi `{{first_name}}`, I'll close this out for now. If you still want your 15-minute Vendor Conversion Audit, book here: `{{booking_link}}`. `{{operator_name}}`, `{{business_name}}`. STOP to opt out. |
| `BOOKING_CONFIRMED_V3` | Hi `{{first_name}}`, thanks for booking your 15-minute Vendor Conversion Audit with `{{business_name}}` for `{{appointment_date}}` at `{{appointment_time}}` `{{timezone}}`. Before we speak, see our brochure: `{{brochure_link}}`. Looking forward to helping. `{{operator_name}}` |
| `BOOKING_REMINDER_24H_V3` | Hi `{{first_name}}`, reminder: I'll call you tomorrow at `{{appointment_time}}` `{{timezone}}`. I'll review your current online presence, identify the main opportunity and explain the next practical steps. Need to reschedule? `{{reschedule_link}}`. `{{operator_name}}`, `{{business_name}}`. |
| `BOOKING_REMINDER_3H_V3` | Reminder: your 15-minute Vendor Conversion Audit starts in 3 hours at `{{appointment_time}}` `{{timezone}}`. `{{operator_name}}`, `{{business_name}}`. |
| `BOOKING_REMINDER_EARLY_V3` | Reminder: your 15-minute Vendor Conversion Audit is tomorrow at `{{appointment_time}}` `{{timezone}}`. `{{operator_name}}`, `{{business_name}}`. |

Keep the placeholder names unchanged. Pre-booking marketing messages must retain the STOP instruction. The Worker also rejects messages over the configured SMS-part cap, suppressed contacts, replies, booked leads, missing consent, stale booking revisions, quiet-hour sends, and duplicate provider sends.

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
2. Preserve all placeholders and the STOP wording where required.
3. Run the repository tests and deployment probe.
4. Test only with the approved operator address/number; do not use a client record.
5. Promote the version, then verify Cloudflare component health and Inngest runs.

The platform watchdog runs every 30 minutes. At two durable steps per run, this uses approximately 4,320 Inngest executions in a 30-day month before retries.
