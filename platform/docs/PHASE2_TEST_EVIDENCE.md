# Phase 2 TEST evidence

Recorded through 2026-07-27 Australia/Brisbane. All exercised scenarios were returned
to inactive. No production action was enabled.

## Deployment and local gates

- Worker: `arcanium-platform-core-test`
- A2 Worker: `arcanium-listing-control-test`, current version
  `6e63f659-5117-49bc-8fa6-f62403f7fa79`
- A3 Worker: `arcanium-publication-control-test`, current version
  `7ddd399f-e8a2-417e-b0e3-2cb6da026bbf`
- A4 Worker: `arcanium-gbp-control-test`, current version
  `7296e820-88b1-4e88-9368-e9152a025332`; its read-only health proof
  confirmed TEST environment and `gbp_mutation_enabled=false`
- Current version: `cbb46b0e-cad1-4b4d-95f9-2f15d127da9e`
- Health version: `0.2.0`
- D1 migrations: `006_platform_core_registry.sql`,
  `007_queue_delivery_audit.sql`, and
  `008_automation_results_and_tasks.sql`,
  `010_platform_action_resolutions.sql`, and
  `012_a12_ops_control.sql`; A2 listing D1 migrations
  `009_listing_control.sql` and `011_listing_action_resolutions.sql`
- Production action flags: all `false`
- Public send, content publish, GBP mutation, outreach send, and dangerous
  replay flags: all `false`
- Dedicated A12 ops HMAC intake: configured; Make A12 dispatch: `false`
- TypeScript: passed
- Relevant Worker Vitest suites: 64/64 passed
- Wrangler bundle/deployment: passed
- Next.js production build: passed

## Make-to-Cloudflare roundtrips

| Automation | Make execution | Durable evidence |
|---|---|---|
| A1 | `cacd51df6fb445469f513711d978f3f5` | Client config `TEST-0001` / `1.0-phase2c` |
| A2 | Worker run `a2-initial-1785058511884` plus controlled Make run at 2026-07-26 19:38 AEST | Three synthetic JSON listings normalized and persisted; queue delivery audited on attempt 1; Make result `result:a2-health-1785058717712` balanced 1/1 |
| A2 | Worker run `a2-resolution-1785080485164` plus Make execution `d84427f6494542ca82d7a9db8efe226f` | Verified source replay superseded one stale sold-evidence action and its approval across both D1 stores; queue delivered on attempt 1; all five Make modules succeeded |
| A3 | Worker proof `pub-a3-make-proof-0001` plus Make execution `16926beb61414053b9bf1e9c74eff7d3` | Signed preflight/token/result path passed; Sanity read returned 200; four capped actions persisted; all mutation/public permissions false |
| A4 | controlled webhook run at 2026-07-26 17:58 AEST | Result `result:a4-gbp-1785052729231`; Business Profile account read completed; balanced 1/1; no GBP mutation |
| A5 | controlled webhook run at 2026-07-26 17:50 AEST | Result `result:a5-provider-1785052234506`; Search Console + GA4 + DataForSEO completed; balanced 3/3 |
| A6 | controlled webhook run at 2026-07-26 18:05 AEST | Result `result:a6-sentry-1785053136505`; Sentry organisation read completed; balanced 1/1; no technical mutation |
| A6 | `63886f1ae6de4426b16ec3f1e3d49163` | Audit event `event-phase2-a6-950b5c1eacbb4a36bb1ff87fc807d52f` |
| A7 | controlled webhook run at 2026-07-26 18:19 AEST | Result `result:a7-provider-1785053957681`; DataForSEO account read completed; balanced 1/1; no task order, spend, or GBP mutation |
| A8 | `477000cc227b43e1ad0a614282aae2c1` | Review event `event-phase2-a8-49b2d7040bfb4036b1fdd5dac5df75f2` |
| A8 | controlled webhook run at 2026-07-26 18:30 AEST | Result `result:a8-clicksend-1785054599487`; ClickSend SMS history read completed; balanced 1/1; no communication sent |
| A9 | controlled queued webhook run at 2026-07-26 18:37 AEST | Result `result:a9-sanity-1785055010475`; Sanity dataset count read completed; balanced 1/1; no document mutation or publish |
| A10 | controlled webhook run at 2026-07-26 18:21 AEST | Result `result:a10-provider-1785054097475`; DataForSEO account read completed; balanced 1/1; no competitor task, spend, outreach, or content mutation |
| A11 | controlled webhook run at 2026-07-26 17:54 AEST | Result `result:a11-analytics-1785052443686`; Search Console + GA4 completed; balanced 2/2; no report sent |
| A12 | proof `a12-control-1785082830242`; Make executions `35e7f71c412741eb9e15c7c4223c6364` and `6529a2c2960444a2bac7c427df48f865` | Signed provider incident and verified resolution; both queue events delivered on attempt 1; result `result:ops-incident-1785082830242`; action completed with fixture evidence |
| A13 | `8af7db5bec9248d4a79c7413151f1cd0` | Project `project-phase2-72a1b72d7d6349e98b83a06c6caf6319` |
| A14 | `500615bd3c404b4c91fd245ec3428875` | Experiment `experiment-phase2-41ca3f061892480ea2b40af7e8f8320b` |
| A15 | `6c6abc7a04954b96aa998b57167f0453` | Cost entry `entry-phase2-57271d97a8464a988c130e179fcc480c` |

All fifteen automation identifiers have a successful signed TEST ingress
execution in `readiness/TEST-0001/INGRESS_MATRIX.json`. For A2-A12 this is an
ingress baseline, not a claim that provider branches are implemented.

The shared `/v1/results` endpoint now validates and durably records compact
provider results for A1-A15. It enforces the lower of the implementation-spec
action ceiling and configured cap, requires approval for publish/email/SMS/GBP/
outreach/destructive/replay actions, rejects unsafe retry classifications,
requires completed results to reconcile, and opens a deduplicated A12 incident
for failed or unbalanced runs.

The A12 TEST clone is now
`TEST CLONE - A12 - Operations Control Actions`. It accepts only capped compact
request arrays from the Platform Core queue, iterates a maximum of 25 signed
result or resolution requests, and never executes recovery. The dedicated
`/v1/ops/events` intake validates tenant, environment, strict schema, HMAC,
timestamp, nonce, incident state, idempotency, unsafe retry classification,
and resolution evidence. Proof `a12-control-1785082830242` persisted incident
and provider-health state, delivered both events on attempt 1, recorded a
completed A12 result, then completed the action through a signed resolution.
The two Make runs completed all four modules; their warnings were limited to
the webhook-response module being unable to respond to data that had queued
while the listener was closed. The scenario is `Immediately as data arrives`,
inactive, and Worker dispatch was restored to `false`.

The A5 TEST clone is now
`TEST CLONE — A5 — Search Provider Health + Result`. Its seven modules
completed successfully: webhook, signed event, Search Console `GET /v3/sites`,
GA4 `GET /accountSummaries`, DataForSEO `GET /appendix/user_data`, signed
result, and webhook response. D1 recorded provider
`search-console+ga4+dataforseo`, counts 3/3/0, output 3, and a balanced 3/3
reconciliation. These are authenticated read-only health/account-visibility
checks, not a claim that the full A5 search-growth analysis is implemented.
The scenario was restored to immediate webhook scheduling and left inactive.

The A11 TEST clone is now
`TEST CLONE — A11 — Analytics Health + Result`. Its six modules completed
successfully: webhook, signed event, Search Console `GET /v3/sites`, GA4
`GET /accountSummaries`, signed result, and webhook response. D1 recorded
provider `search-console+ga4`, counts 2/2/0, output 2, and a balanced 2/2
reconciliation. No raw analytics rows entered Make and no draft or report was
sent. This proves authenticated provider health, not the full A11 KPI
transformation/reporting workflow. The scenario was restored to immediate
webhook scheduling and left inactive.

The A4 TEST clone is now
`TEST CLONE — A4 — GBP Account Health + Result`. Its five modules completed:
webhook, signed event, Business Profile `GET /v1/accounts`, signed result, and
webhook response. D1 recorded provider `google-business-profile`, counts
1/1/0, output 1, and a balanced 1/1 reconciliation. The response confirmed no
GBP mutation. This proves authenticated account visibility only; review,
performance, post and approval routes are not yet implemented. The scenario
was restored to immediate webhook scheduling and left inactive.

The A6 TEST clone is now
`TEST CLONE — A6 — Sentry Health + Result`. Its five modules completed:
webhook, signed event, Sentry `List Organizations`, signed result, and webhook
response. D1 recorded provider `sentry`, counts 1/1/0, output 1, and a balanced
1/1 reconciliation. No raw issue stream entered Make and no deployment,
rollback, redirect, canonical or removal action occurred. This proves
authenticated organisation health only, not the full technical-control
workflow. The scenario was restored to immediate webhook scheduling and left
inactive.

The A3 TEST clone is now
`TEST CLONE - A3 - Publication Validation + Sanity Read + Result`. The
publication-control Worker validates signed exact-body preflight requests,
replay/client/environment/URL ownership, metadata, canonical, content, schema
and approval evidence before issuing a short-lived revision-bound token. Its
result endpoint persists compact publication state, validation issues and at
most 15 deduplicated operator actions. Controlled proof
`pub-a3-make-proof-0001` passed preflight, consumed its token once and stored
four actions with zero overflow while both publish permissions remained false.
Make execution `16926beb61414053b9bf1e9c74eff7d3` ran all five modules:
webhook, signed Platform Core event, authenticated Sanity production-dataset
count, signed compact result and webhook response. Make labels the execution
as a warning only because queued manual data could not respond to the original
listener; all five modules ran. The scenario remains inactive. No document
body entered Make and no mutation, publication, revalidation, indexing, LLM
or public communication occurred.

The A7 TEST clone is now
`TEST CLONE - A7 - GEO Provider Health + Result`. Its five modules completed:
webhook, signed event, DataForSEO `GET /appendix/user_data`, signed result, and
webhook response. D1 recorded provider `dataforseo`, counts 1/1/0, output 1,
and a balanced 1/1 reconciliation. No GEO grid or AI-visibility task was
ordered, no provider spend occurred, and no GBP mutation was attempted. This
proves authenticated account health only, not the full local-visibility
workflow. The scenario uses immediate webhook scheduling and remains inactive.

The A10 TEST clone is now
`TEST CLONE - A10 - Competitor Provider Health + Result`. Its five modules
completed: webhook, signed event, DataForSEO `GET /appendix/user_data`, signed
result, and webhook response. D1 recorded provider `dataforseo`, counts 1/1/0,
output 1, and a balanced 1/1 reconciliation. No competitor-data task was
ordered and no spend, outreach, or content mutation occurred. This proves
authenticated account health only, not the full citations/backlinks/entity
workflow. The scenario uses immediate webhook scheduling and remains inactive.

The A8 TEST clone is now
`TEST CLONE - A8 - ClickSend History Health + Result`. Its five modules
completed: webhook, signed event, ClickSend `GET /v3/sms/history`, signed
result, and webhook response. D1 recorded provider `clicksend`, counts 1/1/0,
output 1, and a balanced 1/1 reconciliation. The run read only five history
records; it sent no SMS or email and changed no lead, CRM, or public
communication state. This proves authenticated provider-history health only,
not the full forms/enquiry/delivery workflow. The scenario uses immediate
webhook scheduling and remains inactive.

The A9 TEST clone is now
`TEST CLONE - A9 - Sanity Dataset Health + Result`. Its first four substantive
modules completed: webhook, signed event, authenticated Sanity production
dataset `count(*)` query, and signed result. D1 recorded provider `sanity`,
counts 1/1/0, output 1, and a balanced 1/1 reconciliation. The webhook-response
module warned only because the request had queued after the first run-once
listener expired; provider read, signing, and persistence all succeeded. No
document body entered Make, and no draft, mutation, publish, or communication
occurred. This proves authenticated dataset health only, not the full campaign-
evidence/content workflow. The scenario uses immediate webhook scheduling and
remains inactive.

The A2 listing-control TEST Worker is deployed at
`arcanium-listing-control-test.enquiries-432.workers.dev`. Its first signed
synthetic JSON run normalized and persisted three listings, emitted three
`NEW` events, queued one compact `listing.sync_batch`, and recorded queue
delivery on attempt 1. All public-write, sold-price, destructive URL,
IndexNow, and revalidation flags are false. Eleven domain tests cover JSON and
REAXML parsing, malformed/empty/stale feeds, abnormal count drops,
last-known-good preservation, lifecycle events, approval-gated sold/removal
decisions, action overflow, and absence of Google Indexing API behavior. Two
queue tests cover held delivery and missing-endpoint fail-closed behavior.

The current stable version `6e63f659-5117-49bc-8fa6-f62403f7fa79` retains
the independent
`ALLOW_MAKE_DISPATCH=false` gate. The consumer records queued batches as
`held_for_operator_workflow` instead of calling Make. The listing sync and
capped operator actions remain durable in D1, so disabling delivery does not
discard the operator work represented by the batch. The Make endpoint is not a
deployed binding; even an accidental flag change is fail-closed and retries
with `MAKE_ENDPOINT_NOT_CONFIGURED`.

The earlier A2 health baseline was replaced by
`TEST CLONE - A2 - Compact Operator Actions`. The scenario uses immediate
webhook scheduling and remains inactive.

`make/test/a2-operator-actions.patched.json` is the source-controlled capped
iterator and Platform Core result/task mapping. The five-module graph is
imported and saved as `TEST CLONE - A2 - Compact Operator Actions` in inactive
scenario `6665242` with immediate webhook scheduling. Controlled run
`a2-operator-1785060436971` exposed an over-escaped `mutation_kind` expression;
Platform Core rejected the malformed JSON and no result or public action was
persisted. After correction, Make execution
`700c30dbb6af4cd78dc75ef10c7b740d` completed 5/5 operations for run
`a2-operator-1785060916010`. Platform D1 records a completed 1/1 result, one
open `listing_review` action with `mutation_kind=none` and no approval
requirement, and balanced 1/1 reconciliation. This proves the manual
Worker-shaped Make iterator path.

The same-run gate is proven by signed Worker run
`a2-cross-store-1785077536611`. Listing D1 records a completed 3/3 sync,
one sold transition, one open approval-gated `sold_evidence` action, no
overflow, and queue delivery on attempt 1. Draining the accepted webhook batch
through inactive Make execution `bcb83b9032204c4ea2efe55e4cd51478`
persisted the identical action and dedup keys in Platform D1, a completed 1/1
result, and balanced 1/1 reconciliation. Make reports a warning only because a
queued webhook cannot return its response to the original caller; all five
modules ran.

The isolated test used temporary Worker version
`fca2ad7d-48ac-40a3-a6c7-d8086fdd3956`. The deployment was restored, the
temporary Make endpoint secret was deleted, and final health reports
`make_dispatch_enabled=false` with every public/destructive flag false. Only
the original `LISTING_HMAC_SECRET` remains. Cloudflare rollback restored the
code and original HMAC secret but retained newer variable/secret bindings, so
the false configuration was explicitly redeployed and the temporary endpoint
secret explicitly deleted. The later signed action-resolution proof repeated
that restoration discipline: original HMAC restored, false dispatch
configuration explicitly redeployed, and temporary endpoint secret deleted.

A2 tenant isolation is also proven. Signed Worker run
`a2-isolation-1785078078539` persisted one active `ISO-200` listing for
`TEST-0002` under `tenant-isolation-feed`; the same feed has zero `TEST-0001`
rows. The queue audit records `held_for_operator_workflow` on attempt 1 because
dispatch was false. A separately signed `TEST-9999` request returned HTTP 400,
and D1 contains zero rejected-client sync, listing, action, or queue rows. The
temporary signing-secret version was rolled back to the original HMAC version;
final health and secret inventory remained unchanged.

The declared source-snapshot rollback method was first drilled with run
`a2-rollback-1785078447830`. Replaying the prior three-listing snapshot
restored `L-100` from sold to active, completed 3/3, emitted one UPDATED event,
created zero new actions, and recorded its queue batch as
`held_for_operator_workflow`.

Signed replay `a2-resolution-1785080485164` then completed the operator
lifecycle. Listing D1 records a 3/3 no-mutation sync, the historical
`sold_evidence` action as `superseded`, one matching resolution audit row, and
queue delivery on attempt 1. The generic signed-request Make blueprint sent
that resolution to `/v1/action-resolutions`; execution
`d84427f6494542ca82d7a9db8efe226f` succeeded in all five modules. Platform D1
records the same resolution/action/dedup keys, superseded the original
operator action and pending approval, and identifies `automation:A2` with the
listing resolution evidence. Scenario `6665242` was saved with immediate
webhook scheduling and left inactive. Final Worker health reports dispatch
false and every public/destructive flag false; secret inventory contains only
`LISTING_HMAC_SECRET`. Therefore A2
`source_snapshot_rollback_verified`, `operator_action_resolution_verified`,
and `rollback_tested` are true.

`packages/test-fixtures/golden-events.json` supplies canonical safe TEST input
for A1-A15. `readiness/TEST-0001/ACTIVATION_GATES.json` records the uniform
activation evidence. All TEST contract gates pass; every production activation
remains blocked by its remaining evidence gates and explicit production
approval.

## Scheduled companion jobs

| Job | Schedule | TEST execution |
|---|---|---|
| A13 provisioning review/expiry | Daily 09:00 | `9ade4dcb49d541f3bf0265dada9ef031` |
| A14 CRO guardrail monitoring | Daily 09:00 | `d0dcce9a57e34ffd8a15e042bc972609` |
| A15 monthly close review | Monthly, day 1 09:00 | `9eadc6f0ceb14d1aad7f3100ef3fdb37` |
| A15 weekly capacity review | Monday 09:00 | `fa991c9b80414cc5ad963f2156f11065` |

The former unauthenticated HTTP placeholders now emit signed Platform Core
events. All four jobs remain inactive.

## Security, idempotency, and isolation

- An incorrect HMAC was rejected with HTTP 401 and `INVALID_SIGNATURE`.
- A13 was replayed with the same idempotency key and a new signed nonce.
- Duplicate execution `c5a72a229cf14aea9d5767891933497f` did not increase
  audit, idempotency, or project row counts.
- `TEST-0002` was accepted through A1 execution
  `d60cd419a20f418d98b2b81658c4ac62` and persisted with config version
  `1.0-isolation` and canonical domain `https://test-0002.invalid`.
- A signed request for non-allowlisted `TEST-9999` received HTTP 400. Read-only
  D1 verification found zero event-audit and zero client-registry rows.

## Queue delivery and dead-letter handling

- `test-platform-events` has one consumer: `arcanium-platform-core-test`.
- The legacy `test-platform-ops` Worker retains its HTTP service but no longer
  consumes the shared event queue.
- Normal fixture `event-queue-ack-e0d413f9b6224a6d90c8722881f29672`
  was acknowledged on attempt 1.
- Controlled failure fixture
  `event-queue-dlq-f085a017e2614667bea3b6ac69cb823f` recorded attempts 1-4,
  then arrived in `test-platform-events-dlq`.
- The DLQ consumer recorded `dead_letter` and acknowledged the fixture.

## Provider checks and remaining blockers

See `PROVIDER_VERIFICATION.md`. Resend, ClickSend, DataForSEO, Sentry, Google
Sheets/Drive, Search Console, GA4, Business Profile, and Sanity completed
controlled TEST calls. Sanity returned HTTP 200 in A3 execution
`16926beb61414053b9bf1e9c74eff7d3`; all five modules ran and the only warning
was the unavailable response channel for queued manual webhook data.

The A3 test exposed a missing legacy `nonce` mapping in the shared Make custom
app. The app now uses the Make `executionId` as a nonce fallback, and the shared
TEST HMAC secret was rotated and synchronized with the Worker. The Worker keeps
field-specific missing-auth diagnostics while still rejecting incomplete,
invalid, or replayed signatures.

Cost caps, approval groups, reconciliation rules, and rollback methods are
declared for A1-A15. Shared result enforcement and durable reconciliation are
now live in TEST. A3 has a verified validation/control foundation but still
needs redeployment/retest of the final atomic token-consumption hardening,
deployed Sanity-gate integration, automatic dispatch, live-page proof,
revalidation, IndexNow, isolation and rollback. Operator replay from the DLQ,
the remaining substantive A2/A4 and A6-A10 provider branches (A4 and A6-A10
account/provider health are verified), the full A5 analysis branch,
the full A11 reporting branch, automatic A12 provider polling and live cost
feeds, approved A12 recovery execution, quarterly review, provider-resource
isolation, and rollback drills outside the verified A2 source and A12 dispatch
paths remain incomplete. Production approval remains false.
