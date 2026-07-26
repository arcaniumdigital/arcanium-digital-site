# Current state — 2026-07-27

## Confirmed TEST resources

- Make organisation: ArcMcp (EU1), team My Team.
- A1-A15 TEST ingress scenarios: valid, successfully exercised, and inactive.
- A13-A15 scheduled companions: converted from unauthenticated placeholders to
  signed Platform Core events, successfully exercised, and inactive.
- Cloudflare Worker: `arcanium-platform-core-test`, version
  `cbb46b0e-cad1-4b4d-95f9-2f15d127da9e`.
- A2 Cloudflare Worker: `arcanium-listing-control-test`, version
  `6e63f659-5117-49bc-8fa6-f62403f7fa79`, TEST-only with all
  public/destructive action flags false and Make dispatch held.
- Cloudflare TEST D1 databases: platform operations, listing/content, and
  search/reporting.
- Cloudflare TEST event queue and DLQ: producer, retry, acknowledgement, and
  dead-letter delivery verified.
- Synthetic tenants: `TEST-0001` and isolated `TEST-0002`.

## Safety state

All production-affecting flags are false. No DNS record, production deployment,
site launch, experiment launch, pricing change, or production scenario was
performed. Every scenario exercised by this phase was returned to inactive.

## What is proven

1. Exact-body HMAC verification, timestamp windows, nonce replay prevention,
   payload validation, client allowlisting, and scoped idempotency.
2. Signed Make-to-Cloudflare ingress for every automation identifier A1-A15.
3. Durable domain writes for A1, A13, A14, and A15, plus a shared
   A1-A15 result/action/approval/reconciliation contract.
4. Queue acknowledgement and retry exhaustion through the DLQ.
5. Separate persisted configuration for `TEST-0001` and `TEST-0002`; a signed
   request for non-allowlisted `TEST-9999` was rejected and wrote no rows.
6. Safe connection checks for Resend, ClickSend, DataForSEO, Sentry, Google
   Sheets/Drive, Search Console, GA4, Business Profile, and Sanity.
7. Canonical A1-A15 golden fixture coverage and a uniform activation gate that
   requires scenario, connection, contract, A12 incident, provider workflow,
   tenant isolation, cost cap, approval owner, rollback, and explicit
   production-approval evidence.
8. A12 signed operations control from a dedicated HMAC intake through the
   Cloudflare queue, inactive Make iterator, shared signer, result endpoint,
   and verified action-resolution endpoint. Proof
   `a12-control-1785082830242` persisted one provider incident and health
   snapshot, delivered both queue events on attempt 1, recorded completed A12
   result `result:ops-incident-1785082830242`, resolved the incident with
   fixture evidence, and completed the matching operator action. The temporary
   Make-dispatch window was closed after proof.
9. A5 read-only provider-health branch through Search Console, GA4, and
   DataForSEO. The seven-module Make run completed and persisted a 3/3 balanced
   result without raw analytics rows, provider spend, or mutations.
10. A11 read-only analytics-health branch through Search Console and GA4. The
    six-module Make run completed and persisted a 2/2 balanced result without
    raw rows, report generation, or client delivery.
11. A4 read-only Business Profile account-health branch. The five-module Make
    run completed and persisted a 1/1 balanced result with all GBP mutation,
    review reply, post, category, profile, and Q&A actions disabled.
12. A6 read-only Sentry organisation-health branch. The five-module Make run
    completed and persisted a 1/1 balanced result without deployment,
    rollback, redirect, canonical, removal, or other technical mutation.
13. A7 read-only DataForSEO account-health branch. The five-module Make run
    completed and persisted a 1/1 balanced result without ordering GEO/AI
    visibility data, incurring provider spend, or mutating GBP.
14. A10 read-only DataForSEO account-health branch. The five-module Make run
    completed and persisted a 1/1 balanced result without ordering competitor
    data, incurring provider spend, sending outreach, or mutating content.
15. A8 read-only ClickSend history-health branch. The five-module Make run
    completed and persisted a 1/1 balanced result without sending SMS, email,
    or any other public communication.
16. A9 read-only Sanity dataset-health branch. The authenticated count query
    and signed result persisted a 1/1 balance without reading document bodies,
    creating drafts, mutating content, publishing, or communicating.
17. A3 read-only Sanity publication-provider health branch. The five-module
    Make run completed and persisted a 1/1 balanced result without preflight,
    draft, mutation, publishing, indexing, or communication.
18. A2 listing-control foundation: JSON and REAXML normalization,
    last-known-good safeguards, lifecycle/material-event reconciliation,
    approval-gated sold/removal actions, D1 state, Durable Object locking,
    capped compact operator actions, and queue delivery auditing. A signed
    synthetic run persisted three listings and the Make health branch recorded
    a balanced 1/1 result.
19. A2 queue-to-Make delivery now has a separate
    `ALLOW_MAKE_DISPATCH=false` deployment gate. Queued batches remain durably
    represented by the listing sync, operator-action, and queue-audit rows
    while default Make dispatch is held.
20. A2 same-run cross-store proof: signed Worker run
    `a2-cross-store-1785077536611` persisted a 3/3 listing sync and one
    approval-gated `sold_evidence` action, delivered its queue message on
    attempt 1, and produced the matching Platform Core result/action keys with
    balanced 1/1 reconciliation. Make execution
    `bcb83b9032204c4ea2efe55e4cd51478` completed all five modules; its warning
    is limited to the webhook response being unavailable for queued data.
21. A2 tenant isolation: signed run `a2-isolation-1785078078539` persisted
    exactly one `TEST-0002` listing under `tenant-isolation-feed`, with zero
    matching `TEST-0001` rows. A separately signed `TEST-9999` request was
    rejected with HTTP 400 and produced zero sync, listing, action, or queue
    rows. Its permitted queue batch was held because dispatch was false.
22. A2 source rollback drill: replay run `a2-rollback-1785078447830`
    restored `L-100` from the synthetic sold state to active, reconciled 3/3,
    emitted one UPDATED event, created no new action, and held its queue batch.
23. A2 signed action-resolution proof: replay run
    `a2-resolution-1785080485164` detected that the verified source no longer
    reported `L-100` as sold, superseded the original listing-side action,
    delivered the queue message on attempt 1, and sent a signed generic
    resolution through Make execution `d84427f6494542ca82d7a9db8efe226f`.
    Platform Core persisted the matching resolution, superseded the operator
    action and approval request, and retained the original audit history.
    The A2 source rollback and cross-store action lifecycle are now verified.

## Remaining external blockers

1. Sanity project metadata and its encrypted Make credential are configured.
   A read-only query passed through Make execution
   `ef7b094a11684dd593fd80aa134ec3fe`.
2. Remaining substantive work in A2-A4, A6-A10, and A11 is not yet complete;
   their current TEST scenarios are truthful signed-ingress/health baselines
   only. A3 now has verified Sanity publication-provider health, but its
   preflight, canonical validation, approval, publishing, post-publication
   verification, revalidation, and indexing routes remain incomplete.
   A2 now has its Worker-heavy reconciliation foundation and Make health
   branch. Its capped compact-action iterator and same-run Worker-to-Make queue
   path are verified in the inactive TEST scenario. Dispatch remains disabled
   by default, and signed cross-store action resolution is verified. The
   remaining operator task destinations,
   reporting annotation, alert/digest, live feed adapter credentials, website
   revalidation endpoint, IndexNow key, and public-page inspection remain
   incomplete.
   A5 now has a verified read-only provider-health branch, but the full compact
   search-growth aggregation and action-prioritisation workflow remains
   incomplete. A4 now has verified read-only account health, but review/post/
   performance event handling and approvals remain incomplete. A6 now has
   verified Sentry organisation health, but probes, deployment events,
   technical issue normalisation, and approval routes remain incomplete. A7
   and A10 now have verified DataForSEO account health, but their GEO/
   AI-visibility and competitor/citation data tasks, compact transformations,
   and approval routes remain incomplete. A8 now has verified ClickSend
   history health, but form normalisation, consent/routing logic, CRM writes,
   Resend assembly, delivery-state processing, and approval routes remain
   incomplete. A9 now has verified Sanity dataset health, but campaign
   evidence extraction, compact content drafting, approval, publishing, and
   measurement routes remain incomplete. A11 now has a
   verified read-only analytics-health branch, but
   its compact KPI transformation, approval, and reporting workflow remains
   incomplete. A12 now has verified signed incident intake, compact provider
   health persistence, queue-to-Make action creation, verified resolution,
   approval-gated recovery contracts, and dispatch rollback. Automatic
   provider polling, live provider cost feeds, approved recovery execution,
   and quarterly-review branches remain incomplete.
3. Cost caps, approval groups, reconciliation rules, and rollback methods are
   now declared for A1-A15. The result endpoint remotely enforces hard action
   ceilings, approval requirements, result balance, failure classification,
   and incident creation. Operator replay from the DLQ, scheduled
   reconciliation jobs, provider-resource isolation, and production rollback
   drills remain unproven.

Production approval remains false.

The shared Make signer now derives a nonce from `executionId` when legacy
scenario mappings leave the nonce field blank. Its TEST HMAC secret was rotated
and synchronized with Cloudflare. This restored the common signed-event path
without weakening replay protection.
