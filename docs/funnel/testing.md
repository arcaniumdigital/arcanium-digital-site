# Funnel Verification

Run from the repository root:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:worker
pnpm exec playwright test
pnpm build
pnpm cf:check
```

The unit suite covers Australian mobile normalisation, STOP classification, message templates and segment limits, quiet-hour calculations, send gates, and Cal signature/event parsing. The isolated Worker suite applies the D1 migration and verifies intake rejection, durable acceptance, duplicate submission handling, context-cookie privacy, and health secrecy. Playwright verifies the successful form-to-calendar route, honest recoverable failure behaviour, and the clean `/audit` SMS route.

Provider acceptance tests must be completed in staging with provider test recipients before any production send flag is enabled. Delay Brevo and ClickSend by at least 20 seconds and verify the browser still reaches `/vendor-audit` immediately after D1 acceptance. Then exercise duplicate webhooks, reschedule/cancel revisions, STOP, ambiguous inbound matching, low ClickSend balance, a DLQ job, and an expired synthetic canary.

The production smoke test is complete only when `/health/funnel/<token>` returns HTTP 200 with `FUNNEL_OK`, the operator report shows the current schema/deployment versions, the homepage and public booking route are reachable, and no P1 incident is open.
