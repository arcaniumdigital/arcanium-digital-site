# Provider verification - TEST only

Recorded 2026-07-26 Australia/Brisbane. Verification scenarios were isolated
TEST checks and returned to inactive. No production scenario or deployment was
activated.

| Provider | Scenario | Execution | Result |
|---|---:|---|---|
| Resend | `6700484` | `7f27a6859e3841a99f799f530ab7ad32` | Passed; one TEST email delivered to the approved test recipient |
| ClickSend history | `6700486` | `7a6468ad560f4e718f8d3f0dbb0e01ed` | Passed; authenticated read-only SMS history call after credit was added |
| Google Sheets | `6700507` | `b5521987cb8346dcbbf47d16fa70a4bb` | Passed on replacement connection `9299159`; created one TEST evidence workbook |
| Search Console | `6703612` | `b7509bb402584aae8b3c75d9fb73c0bc` | Passed; `sc-domain:arcaniumdigital.com` visible as `siteOwner` |
| GA4 | `6703613` | `7bfc8742fe9049629c71eef5ac28e9c6` | Passed; account `arcaniumdigital` and property `Arcanium Digital` visible |
| Business Profile | `6703614` | `bc935236084c4e7eaf3b5798e4a9ae17` | Passed; location `Arcanium Digital` visible |
| DataForSEO | `6700523` | `58310b4ce56d497ab35103fd81a88a87` | Passed with a zero-cost account-data read |
| Sentry | `6700539` | `cf112e2dba9c4427b34832565e209ba7` | Passed with an organisation-list read |
| Sanity | `6665243` | `ef7b094a11684dd593fd80aa134ec3fe` | Passed; authenticated read-only `production` dataset query returned HTTP 200 |

## Connected provider-health branches

- A5 TEST scenario `6665246` reuses the verified Search Console connection
  `9299162`, GA4 connection `9299173`, and DataForSEO connection `9246246`.
- Its controlled seven-operation run completed all three authenticated
  read-only calls and persisted result `result:a5-provider-1785052234506` with
  a balanced 3/3 reconciliation.
- The branch performs no query-row loops, provider spend, search mutation,
  client reporting, or public communication. Full search-growth analysis
  remains blocked pending its aggregation/task implementation.
- A11 TEST scenario `6665253` reuses Search Console `9299162` and GA4
  `9299173`. Its controlled six-operation run persisted
  `result:a11-analytics-1785052443686` with balanced 2/2 reconciliation and
  explicitly sent no report.
- A4 TEST scenario `6665244` reuses Business Profile connection `9299176`.
  Its controlled five-operation run persisted
  `result:a4-gbp-1785052729231` with balanced 1/1 reconciliation and
  explicitly performed no GBP mutation.
- A6 TEST scenario `6665247` reuses Sentry connection `9270294`. Its
  controlled five-operation run persisted
  `result:a6-sentry-1785053136505` with balanced 1/1 reconciliation and
  explicitly performed no technical mutation.
- A7 TEST scenario `6674990` reuses DataForSEO connection `9246246`. Its
  controlled five-operation run persisted
  `result:a7-provider-1785053957681` with balanced 1/1 reconciliation. It
  ordered no GEO/AI visibility task, incurred no spend, and performed no GBP
  mutation.
- A10 TEST scenario `6665251` reuses DataForSEO connection `9246246`. Its
  controlled five-operation run persisted
  `result:a10-provider-1785054097475` with balanced 1/1 reconciliation. It
  ordered no competitor-data task and performed no spend, outreach, or
  content mutation.
- A8 TEST scenario `6665248` reuses ClickSend connection `9218600`. Its
  controlled five-operation run persisted
  `result:a8-clicksend-1785054599487` with balanced 1/1 reconciliation. It
  performed only `GET /v3/sms/history`; no SMS or email was sent.
- A9 TEST scenario `6665249` reuses the encrypted Sanity API-key credential
  `207338`. Its controlled queued run persisted
  `result:a9-sanity-1785055010475` with balanced 1/1 reconciliation after an
  authenticated production-dataset `count(*)` query. It read no document
  bodies and performed no content mutation or publish action.
- A3 TEST scenario `6665243` now reuses the same encrypted Sanity credential
  in a five-module publication-provider health flow. Its controlled run
  persisted `result:a3-sanity-1785055340442` with balanced 1/1
  reconciliation. It performed only the dataset count query and explicitly
  made no publish or indexing request.

## Google ownership and scope

Credential request `ca593de9-7837-4f08-86a7-ad7c654c8ab1` is fully
authorized:

- Sheets/Drive connection `9299159`: spreadsheets and `drive.file`
- Search Console connection `9299162`: `webmasters.readonly`
- GA4 connection `9299173`: `analytics.readonly`
- Business Profile connection `9299176`: `business.manage`

The prior mismatched Google connections are not used by these verification
scenarios.

## ClickSend delivery caveat

The first post-credit SMS execution
`f0da705631d14600947d7a5ca4dfa80d` reached the provider but Make failed while
mapping ClickSend's response (`toJSON` was unavailable). It was not retried, to
avoid a duplicate SMS. The scenario was converted to a read-only history check,
which passed. Handset delivery of that one send remains operator-confirmed
rather than automation-confirmed.

## Sanity

- Organisation: `oXzX64BpF`
- Project: `fefsnr86`
- Dataset: `production`
- Make secure credential request:
  `8264b2d5-5072-4d15-bd93-991303372726`

The encrypted Make credential is installed as an HTTP API-key credential with
the required `Bearer` prefix. A direct module check returned HTTP 200, followed
by a successful four-operation A3 webhook execution through the shared HMAC
signer, Cloudflare Worker, and Sanity read. The API token is intentionally
absent from source control and scenario blueprints. Because the token was
pasted into chat, rotate it in Sanity and update the encrypted Make key before
production approval.
