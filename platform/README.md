# Arcanium Automation Platform

This directory contains the source-controlled TEST foundation for the A1-A15
automation platform. Production activation, public communications, site
launches, experiment launches, pricing changes, and provider spend are disabled
by default.

## Local verification

```text
npm --prefix platform/apps/platform-core ci
npm run check:platform
npm run test:platform
```

## Deployment order

1. Review the resource manifest and client configuration.
2. Run the platform checks and tests.
3. Apply forward-only D1 migrations to TEST.
4. Deploy with `platform/apps/platform-core/wrangler.test.jsonc`.
5. Run signed negative fixtures before golden-path fixtures.
6. Keep all Make platform scenarios inactive until the readiness record passes.

The canonical Worker entry point is `apps/platform-core/src/index.ts`. Files
named `index-v*`, `index-health*`, and `wrangler.test.v*` are historical audit
artifacts and are not compiled or deployed.
