# Vendor Audit source recovery

The production Vercel deployment `dpl_2QWWsSTEBUBKJEyVwTjDdTfqSke8` was built from a dirty CLI working tree. The recovered source was found in the linked project directory and its `app/api/vendor-audit/route.ts` matches the deployed route contract:

`POST /api/vendor-audit` -> encrypted `LEAD_WEBHOOK_URL` -> Make webhook `3476472`.

`LEAD_INGRESS_MODE` is server-side only. Its default is `make`, which retains the recovered Make payload and retry behavior. `cloudflare` is opt-in and requires `LIVE_NURTURE_INGRESS_URL` plus `LIVE_NURTURE_INGRESS_HMAC_SECRET`; it accepts only real supplied email, IANA timezone, and explicit SMS consent. It makes one signed request to the Worker and does not fall back to or duplicate into Make.

No variable beginning with `NEXT_PUBLIC_` may contain either ingress configuration value or an HMAC secret.
