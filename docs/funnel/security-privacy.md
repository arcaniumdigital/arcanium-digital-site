# Security and Privacy Controls

- No name, phone, email, lead ID, token, or correlation secret appears in visitor URLs.
- The booking context cookie has at least 128 bits of entropy; only its SHA-256 hash is stored.
- Internal endpoints require HMAC, timestamp freshness, and a single-use nonce.
- Cal signatures cover the raw request body and are compared in constant time.
- ClickSend webhooks use high-entropy unguessable path tokens and strict body limits.
- Turnstile fails closed and verifies success, action, and an environment-specific hostname allowlist.
- Provider credentials and configuration IDs are Worker/Vercel secrets, never browser variables.
- Logs contain only opaque IDs and redacted error codes. Sentry default PII capture is disabled.
- Inbound SMS plaintext is not stored in D1. STOP creates a phone-wide suppression.
- Generated inventories/backups are private and ignored by Git. Reset operations require account, zone, plan digest, backup receipt, and exact-scope confirmation.

The included privacy notice and SMS consent wording are engineering drafts and require business/legal approval before production activation.
