# Funnel Event Contracts

D1 is canonical. Browser analytics are secondary and contain no name, phone, email, message content, or recipient-specific booking token.

Canonical event names include `FORM_ATTEMPTED`, `LEAD_ACCEPTED`, `LEAD_REJECTED`, `VENDOR_AUDIT_VIEWED`, `CALENDAR_READY`, `CALENDAR_INTERACTED`, `BOOKING_LINK_CLICKED`, `SMS_ACCEPTED`, `SMS_DELIVERED`, `SMS_FAILED`, `REPLY_RECEIVED`, `STOP_RECEIVED`, `BOOKING_OBSERVED_BROWSER`, `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`, `MEETING_ENDED`, `NO_SHOW`, `CRM_SYNCED`, `DEAL_STAGE_CHANGED`, `INCIDENT_OPENED`, and `INCIDENT_RESOLVED`.

Every server event carries an opaque correlation ID, UTC event time, source, optional internal lead/booking ID, optional versioned message type, and safe metadata. Queue and Inngest payloads carry opaque IDs only. Webhook rows retain provider event keys and payload hashes for replay protection, never raw payloads.

Attribution stores the lead’s original source/UTMs, booking route source, last accepted/delivered pre-booking message before the booking, elapsed time to booking, correlation method/confidence, and Cal UID. Reporting describes message attribution as last-touch, not causation, because every recipient receives the same clean booking URL.

Meta `Lead` and GA4 `generate_lead` fire only after a `202 Accepted` response. A calendar click is not a canonical schedule; only an authenticated Cal webhook can create that state.
