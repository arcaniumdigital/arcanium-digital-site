# Make scenario drift report — A1–A12

All platform scenarios are inactive. This report compares module graphs only;
connections, filters, mappings, failure routes, and provider permissions still
require direct verification before promotion.

| Automation | Primary modules | TEST modules | Classification |
|---|---:|---:|---|
| A1 | 14 | 3 | Client-config ingress repaired and proven; provider provisioning incomplete |
| A2 | 9 | 3 | Safe signed ingress proven; provider workflow incomplete |
| A3 | 9 | 3 | Safe signed ingress proven; provider workflow incomplete |
| A4 | 9 | 3 | Safe signed ingress proven; provider workflow incomplete |
| A5 | 10 | 3 | Safe signed ingress proven; scheduled/provider workflow incomplete |
| A6 | 9 | 3 | Signed audit-only ingress repaired; technical/remediation branches incomplete |
| A7 | 9 | 3 | Safe signed ingress proven; scheduled/provider workflow incomplete |
| A8 | 9 | 3 | Signed review-only ingress repaired; listing/publishing branches incomplete |
| A9 | 11 | 3 | Safe signed ingress proven; provider workflow incomplete |
| A10 | 8 | 3 | Safe signed ingress proven; scheduled/provider workflow incomplete |
| A11 | 9 | 3 | Safe signed ingress proven; scheduled/reporting workflow incomplete |
| A12 | 9 | 4 | Signed incident/action/resolution control proven; live polling and approved recovery execution incomplete |

## Required patches before promotion

- A1 requires TEST provider provisioning and reconciliation branches.
- A6 and A8 ingress now uses Platform Core connection `9288408`; their provider,
  mutation, publishing, and remediation branches remain blocked.
- A2–A5, A7, and A9–A11 signed TEST ingress is proven. Their provider
  mappings, reconciliation, scheduling, failure routes, and output delivery
  remain to be implemented and verified.
- A12 signed incident intake, compact provider-health persistence, action
  creation, verified resolution, and dispatch rollback are proven. Live
  provider polling, cost ingestion, approved recovery execution, and quarterly
  review remain incomplete.
- No production scenario may be activated from this report.
