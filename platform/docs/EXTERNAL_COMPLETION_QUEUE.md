# External completion queue

This repository is locally verified with `npm run verify`. The following
steps require authenticated external access and must remain TEST-only.

1. Push `codex/platform-phase-2` and update draft PR #1.
2. Redeploy the final A3 publication-control Worker, then rerun its controlled
   Sanity/Make proof to verify atomic publication-token consumption.
3. For A4, create a new TEST HMAC secret, apply
   `014_a4_gbp_control.sql`, deploy `arcanium-gbp-control-test`, and
   capture one inactive-scenario proof. Keep `ALLOW_GBP_MUTATION=false`.
4. Provision the remaining provider adapters for A5-A15, connect them only to
   their canonical inactive Make scenarios, and record successful compact TEST
   proofs plus reconciliation evidence.
5. Review the draft PR and CI result, then run a final TEST-only end-to-end
   verification. Do not activate scenarios or production flags.

Production/client delivery is deliberately out of scope until every required
TEST proof is recorded and an explicit production approval is supplied.
