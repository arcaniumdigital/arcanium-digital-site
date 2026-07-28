# Schedule registry

All existing Make primaries and test clones are inactive. No Cloudflare Cron
trigger was found on the existing test Workers.

| Automation/job | Intended owner | Current state | Promotion rule |
|---|---|---|---|
| A1 governance review | Make | Inactive six-hour primary | Keep Make-owned |
| A2 reconciliation | Cloudflare | No Cron yet | Create only after Worker consumer test |
| A5 growth review | Make | Inactive weekly primary | Keep Make-owned |
| A7 GEO collection | Cloudflare | No Cron yet | Replace inactive Make schedule only after approval |
| A10 authority review | Make | Inactive monthly primary | Keep Make-owned |
| A11 reporting assembly | Make | Inactive monthly primary | Keep Make-owned |
| A13 review/expiry | Make | Signed daily TEST job proven; inactive | Keep Make-owned |
| A14 monitoring | Make | Signed daily TEST job proven; inactive | Keep Make-owned |
| A15 monthly close | Make | Signed monthly TEST job proven; inactive | Keep Make-owned |
| A15 capacity review | Make | Signed weekly TEST job proven; inactive | Keep Make-owned |

No job may be activated in both Make and Cloudflare. Any schedule change needs
a documented rollback and an updated readiness manifest.
