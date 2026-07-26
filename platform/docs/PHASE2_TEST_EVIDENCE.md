# Phase 2 TEST evidence

Recorded 2026-07-26 Australia/Brisbane. All exercised scenarios were returned
to inactive. No production action was enabled.

## Deployment and local gates

- Worker: `arcanium-platform-core-test`
- Version: `4849fb52-0ce7-4971-b339-6c4de8cac2a1`
- Health version: `0.2.0`
- D1 migrations: `006_platform_core_registry.sql` and
  `007_queue_delivery_audit.sql`
- Production action flags: all `false`
- TypeScript: passed
- Vitest: 10/10 passed
- Wrangler bundle/deployment: passed
- Next.js production build: passed

## Make-to-Cloudflare roundtrips

| Automation | Make execution | Durable evidence |
|---|---|---|
| A1 | `cacd51df6fb445469f513711d978f3f5` | Client config `TEST-0001` / `1.0-phase2c` |
| A6 | `63886f1ae6de4426b16ec3f1e3d49163` | Audit event `event-phase2-a6-950b5c1eacbb4a36bb1ff87fc807d52f` |
| A8 | `477000cc227b43e1ad0a614282aae2c1` | Review event `event-phase2-a8-49b2d7040bfb4036b1fdd5dac5df75f2` |
| A13 | `8af7db5bec9248d4a79c7413151f1cd0` | Project `project-phase2-72a1b72d7d6349e98b83a06c6caf6319` |
| A14 | `500615bd3c404b4c91fd245ec3428875` | Experiment `experiment-phase2-41ca3f061892480ea2b40af7e8f8320b` |
| A15 | `6c6abc7a04954b96aa998b57167f0453` | Cost entry `entry-phase2-57271d97a8464a988c130e179fcc480c` |

All fifteen automation identifiers have a successful signed TEST ingress
execution in `readiness/TEST-0001/INGRESS_MATRIX.json`. For A2-A12 this is an
ingress baseline, not a claim that provider branches are implemented.

## Scheduled companion jobs

| Job | Schedule | TEST execution |
|---|---|---|
| A13 provisioning review/expiry | Daily 09:00 | `9ade4dcb49d541f3bf0265dada9ef031` |
| A14 CRO guardrail monitoring | Daily 09:00 | `d0dcce9a57e34ffd8a15e042bc972609` |
| A15 monthly close review | Monthly, day 1 09:00 | `9eadc6f0ceb14d1aad7f3100ef3fdb37` |
| A15 weekly capacity review | Monday 09:00 | `fa991c9b80414cc5ad963f2156f11065` |

The former unauthenticated HTTP placeholders now emit signed Platform Core
events. All four jobs remain inactive.

## Security, idempotency, and isolation

- An incorrect HMAC was rejected with HTTP 401 and `INVALID_SIGNATURE`.
- A13 was replayed with the same idempotency key and a new signed nonce.
- Duplicate execution `c5a72a229cf14aea9d5767891933497f` did not increase
  audit, idempotency, or project row counts.
- `TEST-0002` was accepted through A1 execution
  `d60cd419a20f418d98b2b81658c4ac62` and persisted with config version
  `1.0-isolation` and canonical domain `https://test-0002.invalid`.
- A signed request for non-allowlisted `TEST-9999` received HTTP 400. Read-only
  D1 verification found zero event-audit and zero client-registry rows.

## Queue delivery and dead-letter handling

- `test-platform-events` has one consumer: `arcanium-platform-core-test`.
- The legacy `test-platform-ops` Worker retains its HTTP service but no longer
  consumes the shared event queue.
- Normal fixture `event-queue-ack-e0d413f9b6224a6d90c8722881f29672`
  was acknowledged on attempt 1.
- Controlled failure fixture
  `event-queue-dlq-f085a017e2614667bea3b6ac69cb823f` recorded attempts 1-4,
  then arrived in `test-platform-events-dlq`.
- The DLQ consumer recorded `dead_letter` and acknowledged the fixture.

## Provider checks and remaining blockers

See `PROVIDER_VERIFICATION.md`. Resend, ClickSend, DataForSEO, Sentry, Google
Sheets/Drive, Search Console, GA4, and Business Profile completed controlled
TEST calls. The Sanity project and encrypted Make credential are configured;
the post-authorization live read remains pending due to temporary Make
connector unavailability.

Operator replay from the DLQ, A2-A12 provider branches, cost caps, named
approval owners, reconciliation, and rollback drills remain incomplete.
Production approval remains false.
