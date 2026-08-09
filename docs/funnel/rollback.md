# Rollback

The Vercel website and Cloudflare Worker roll back independently.

For frontend regression, restore the prior Vercel deployment while leaving Worker/D1/Queue intact. The form endpoint can be disabled at Vercel without deleting lead state.

For Worker regression, immediately set `ALLOW_PRODUCTION_SMS=false`, `ALLOW_PREBOOK_NURTURE=false`, and `ALLOW_BOOKING_REMINDERS=false`. Roll the Worker back to the previous version, preserving D1. Do not reverse a D1 migration destructively; add a forward repair migration.

For provider misconfiguration, disable only that provider branch. Canonical D1 acceptance and Cal booking state must continue. Requeue provider jobs only after confirming no side effect occurred.

For Cloudflare reset recovery, use the plan-matched private backup receipt. Worker bundles can be redeployed under their original names; D1 row exports must be imported to a new database and validated before binding. DNS and Vercel records in `protected-resources.json` are never reset targets.
