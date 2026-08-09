# Guarded Cloudflare Reset

All commands require a short-lived API token supplied through `CLOUDFLARE_API_TOKEN`; never paste it into chat or commit it. The token needs read inventory and only the scoped edit permissions required by the reviewed plan.

1. Run `inventory.mjs` with the exact account and zone.
2. Populate and review `protected-resources.json` from the live inventory.
3. Build `reset-plan.json`; review every resource and its SHA-256 plan digest.
4. Export each D1 candidate as `<database-name>.sql` with Wrangler, then run `backup-reset-targets.mjs --d1-export-dir <private-directory>`. The backup receipt records and hashes both the row export and redacted metadata. Keep backups outside Git.
5. Run `apply-reset.mjs --dry-run` with the exact plan digest, account ID, zone ID, backup receipt, and scope string. Review its target list and receipt.
6. Run `apply-reset.mjs` with the same guards plus `--dry-run-receipt`; it will act only on the immutable plan.
7. Generate a second inventory and run `verify-clean-state.mjs`.

The apply script refuses incomplete inventories and never discovers targets at deletion time. This domain uses external authoritative DNS at Spaceship, not a Cloudflare zone. Inventory therefore requires `--allow-external-zone`, records public nameserver/apex/`www` evidence, and uses the guard `EXTERNAL_DNS_NOT_CLOUDFLARE`. The reset cannot target DNS or Worker routes. The apex, `www`, mail/authentication records, the Vercel project, the managed account ruleset, and the new canonical funnel resources belong in the protected manifest.
