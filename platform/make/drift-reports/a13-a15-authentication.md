# A13–A15 Make-to-Worker authentication drift

## Evidence

| Scenario | Current target | Current authentication | Required target |
|---|---|---|---|
| A13-01 (6691548) | arcmcp-platform-test /v1/a13/projects | none | arcanium-platform-core-test /v1/a13/projects with HMAC |
| A14-01 (6691550) | arcmcp-platform-test /v1/a14/experiments | none | arcanium-platform-core-test /v1/a14/experiments with HMAC |
| A15-01 (6691553) | arcmcp-platform-test /v1/a15/imports/costs | none | arcanium-platform-core-test /v1/a15/cost-imports with HMAC |

## Required patch

1. Create one test-only Make custom-app connection that stores the Worker HMAC
   secret as an encrypted password field.
2. Configure a signing module to send timestamp, nonce, correlation ID and the
   HMAC-SHA256 signature over the exact compact JSON body.
3. Patch only the three inactive test scenarios to use that module or
   equivalent authenticated HTTP configuration.
4. Validate valid, invalid signature, replay, idempotency, wrong-environment
   and cross-client fixtures before activation.

The primary scenarios and the existing test scenarios must remain inactive until
this patch and test evidence exist.
