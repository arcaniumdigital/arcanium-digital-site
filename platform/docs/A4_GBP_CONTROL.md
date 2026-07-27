# A4 GBP control foundation

The next A4 Worker will keep `ALLOW_GBP_MUTATION=false` by default. This
foundation already makes review severity deterministic, uses templates for
rating-only reviews, requires approval for negative or sensitive replies,
requires two complete scan misses before a deletion-review candidate, caps Make
batches at 25 and binds any future publish to one approved location and source
revision. Manual Q&A tasks are supported as operator actions; no discontinued
Q&A API is used.

No GBP OAuth credential, review reply, post, profile mutation or public send is
implemented or enabled by this foundation.
