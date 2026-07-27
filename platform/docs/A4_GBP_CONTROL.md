# A4 GBP control foundation

The next A4 Worker will keep `ALLOW_GBP_MUTATION=false` by default. This
foundation already makes review severity deterministic, uses templates for
rating-only reviews, requires approval for negative or sensitive replies,
requires two complete scan misses before a deletion-review candidate, caps Make
batches at 25 and binds any future publish to one approved location and source
revision. A signed Worker interface accepts compact reconciliation and reply
authorisation requests, but returns denied while mutation is disabled. Manual
Q&A tasks are supported as operator actions; no discontinued Q&A API is used.

No GBP OAuth credential, review reply, post, profile mutation or public send is
implemented or enabled by this foundation.

`wrangler.test.jsonc` is deployment-ready for the TEST D1 database and has no
public mutation flag enabled. It still requires a newly created
`A4_HMAC_SECRET`, a migration run, deployment, and a controlled inactive Make
proof before it can be described as provider-workflow verified.
