# A1 access-check Worker

This TEST-only Cloudflare Worker performs stateless website and HTTP-provider access checks. Make never calls it directly. The A1 scenario signs a request to Platform Core, Platform Core verifies that signature, re-signs the internal request, and forwards it over a Cloudflare service binding.

## Endpoints

- `GET /health` — deployment and safety status.
- `POST /v1/check/site` — canonical origin, preferred host, robots.txt, and sitemap checks.
- `POST /v1/check/http-provider` — bounded status and latency check for an approved HTTPS provider URL.

Both POST routes require the internal HMAC headers issued by Platform Core. Requests are schema validated, timeout bounded, and restricted to HTTPS targets. The Worker does not store provider credentials, mutate providers, activate clients, or send public communications.

## TEST deployment

- Worker: `arcanium-access-checks-test`
- URL: `https://arcanium-access-checks-test.enquiries-432.workers.dev`
- Platform Core service binding: `ACCESS_CHECKS`
- Required secret on both Workers: `ACCESS_CHECKS_HMAC_SECRET`

Run locally from the repository root:

```powershell
npm.cmd --prefix platform/apps/access-checks run check
npm.cmd --prefix platform/apps/access-checks test
```

Deploy only the TEST configuration:

```powershell
npm.cmd --prefix platform/apps/access-checks run deploy:test
```

## Rollback

Use Cloudflare Workers version history to promote the last known-good TEST version, then run the health check and one signed A1 validation. Do not enable the Make schedule or any production flag as part of rollback.
