# TEST control extensions ? 2026-07-28

This record supplements the earlier provider-health evidence. All scenarios below were activated only for one synthetic test and then immediately returned inactive. No production action, public send, publication, provider order/spend, or profile mutation occurred.

| Automation | Controlled TEST evidence | Proven boundary | Still intentionally incomplete |
|---|---|---|---|
| A4 | Make `5af1057d131847c3bae6619a0679ed23` | Signed synthetic review reconciliation; GBP mutation disabled | Live review reply/post/profile actions |
| A5 | Make `3d6438c42f1c49b583dfa98e6c30b669` | Aggregate-only CTR/decay task selection; five-action cap; no spend | BigQuery/API collection and operating task destinations |
| A7 | Make `a4c5019afc844e6790d71275535c2275` | Capped local/GEO investigation action; no provider order/LLM/public action | Live local/GEO data collection and approved follow-up workflow |
| A8 | Make `0a548f11c9124c1e8168b4b3e7236e2f` | Signed synthetic receipt state; external delivery disabled | Consent, routing, CRM and confirmed provider delivery |
| A9 | Make `c0dc28e33a0f4d36946677d3c92f482a` | Approved evidence metadata reaches approval-pending draft state; no LLM/publish | Official source adapters, human approvals and A3 handoff |
| A10 | Make `f7814520410d43ce9e1bee25a7125ba7` | Authority task is stored as approval-required; no outreach/order/LLM | Provider collection, approved outreach/order flow and verification |
| A11 | Make `a4946bdb32ef404f9ed8bb42121afec0` | Reconciled internal report state; no raw analytics or public delivery | KPI transformation, approval/destination workflow and report send |

A6 remains a signed technical-control foundation and A1?A3/A12?A15 retain their earlier test evidence. Production activation remains false for every automation.
## Tenant-isolation evidence

A10 was independently exercised for TEST-0002 through inactive-by-default Make scenario 6733328 (hook 3461655), successful execution 54a7d1dc1a284ee98ef7d6f7c4185584. The TEST D1 aggregate returned one approval-required action for each of TEST-0001 and TEST-0002; no outreach, order, LLM, provider spend, or public action occurred.

A9 was independently exercised for TEST-0002 through inactive-by-default Make scenario 6733430 (hook 3461710), successful execution 40a80eb237614f8c966172c30fedc971. The TEST D1 aggregate returned one evidence record and one approval-pending draft per tenant, with LLM calls and publication enabled both at zero.

A7 was independently exercised for TEST-0002 through inactive-by-default Make scenario 6733460 (hook 3461725), successful execution 208914cbfca246b092569404acdabf62. The TEST D1 aggregate returned one separate capped GEO action per tenant; provider spend, LLM, and public actions remain disabled.

A5 was independently exercised for TEST-0002 through inactive-by-default Make scenario 6733488 (hook 3461735), successful execution c0027a5136c64c878e572a474fe0c1ba. The TEST D1 aggregate returned one isolated run and two manual-review actions per tenant, with LLM and provider-spend flags at zero.

A4 was independently exercised for TEST-0002 through inactive-by-default Make scenario 6733538 (hook 3461756), successful execution 017038015f5544769ae7d42765b39b5c. The TEST D1 aggregate returned one separate synthetic review per tenant; these standard-severity inputs created no reply/action, and GBP mutation remains disabled.

A8 was independently exercised for TEST-0002 through inactive-by-default Make scenario 6733570 (hook 3461770), successful execution 3f2f5b1fbe2a41b188b74e2d6a2e875e. The TEST D1 aggregate returned one separate received-only synthetic receipt per tenant; external delivery remains disabled.
