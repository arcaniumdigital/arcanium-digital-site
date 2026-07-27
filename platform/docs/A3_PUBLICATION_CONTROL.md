# A3 publication control

## TEST deployment

- Worker: `arcanium-publication-control-test`
- Last live-tested source version: `edc5d639-7a3f-4433-9499-d7cc1ebd6da1`
- State store: TEST D1 `test-listing-content-state`
- Make scenario: inactive `6665243`
- Sanity project/dataset: `fefsnr86` / `production`

Every mutation or public-action flag is false in TEST:

- `ALLOW_SANITY_PUBLISH`
- `ALLOW_SANITY_UNPUBLISH`
- `ALLOW_INDEXNOW_SUBMIT`
- `ALLOW_WEBSITE_REVALIDATION`
- `ALLOW_LLM_REVIEW`
- `ALLOW_PUBLIC_SEND`

## Control flow

1. A trusted server sends the exact request body to `POST /v1/preflight` with
   timestamp, nonce, client and HMAC headers.
2. The Worker rejects replay, wrong environment/client, unsafe or unowned
   URLs, missing metadata, invalid canonical/schema/content, or absent
   approval evidence. A short-lived publication token is issued only when all
   checks pass.
3. `POST /v1/preflight/consume` binds that token to the client, publication,
   revision and requested operation. It is single-use and remains
   non-authorising while the corresponding action flag is false.
4. `POST /v1/live-verify` can inspect an allowlisted public URL with a capped
   timeout/body size and returns compact title, H1, canonical, JSON-LD, image
   alt and CTA checks.
5. `POST /v1/publication-result` stores the compact outcome, URL registry,
   validation issues and at most 15 deduplicated operator actions.
6. The inactive Make scenario signs a compact Platform Core event, performs an
   authenticated read-only Sanity dataset check, signs the compact result and
   returns a webhook response.

The reusable `src/sanity-publish-gate.ts` adapter keeps actual Sanity publish
behind the trusted preflight proxy and requires both a passed preflight token
and explicit publish permission before invoking its publish callback.

## Verified TEST evidence

- Worker preflight passed, issued a token and consumed it once.
- Publish and unpublish permission remained false.
- Result `result:pub-a3-make-proof-0001` persisted with four capped operator
  actions and zero overflow.
- Inactive Make execution `16926beb61414053b9bf1e9c74eff7d3`
  ran all five modules, including the Sanity HTTP 200 read.
- Make reports only a webhook-response warning because the controlled payload
  was run from its queue after the original listener ended; all modules ran.
- The scenario was left inactive and temporary Make API credentials were
  revoked.
- Twenty-two A3 unit/integration tests pass, including atomic single-use token
  consumption and replay rejection.

## Production blockers

- Integrate the publish gate into the deployed Sanity Studio or another
  trusted publication service.
- Redeploy the final atomic token-consumption hardening after Cloudflare access
  is available, then repeat the signed TEST proof.
- Implement authenticated automatic Worker-to-Make delivery.
- Prove live post-publication inspection, revalidation and IndexNow with
  dedicated test endpoints/keys.
- Complete cross-client provider-resource isolation and rollback drills.
- Rotate the previously exposed Sanity token and update the encrypted Make
  credential.
- Obtain explicit production approval before changing any action flag.
