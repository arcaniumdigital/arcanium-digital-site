# Current state — 2026-07-26

## Confirmed TEST resources

- Make organisation: ArcMcp (EU1), team My Team.
- A1-A15 TEST ingress scenarios: valid, successfully exercised, and inactive.
- A13-A15 scheduled companions: converted from unauthenticated placeholders to
  signed Platform Core events, successfully exercised, and inactive.
- Cloudflare Worker: `arcanium-platform-core-test`, version
  `bb58a853-7af2-4d32-953a-711c1048b466`.
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
8. A12 signed result ingress from Make through the shared signer to Cloudflare
   and D1. The verified fixture persisted a completed TEST run, one
   non-mutating operator action, and a balanced 1/1 reconciliation with no
   incident.

## Remaining external blockers

1. Sanity project metadata and its encrypted Make credential are configured.
   A read-only query passed through Make execution
   `ef7b094a11684dd593fd80aa134ec3fe`.
2. The A2-A11 provider branches are not yet implemented; their current TEST
   scenarios are truthful signed-ingress baselines only. A12 now has a
   verified result/reconciliation ingress, but its full provider-health,
   recovery, and quarterly-review branches remain incomplete.
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
