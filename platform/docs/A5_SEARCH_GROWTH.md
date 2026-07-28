# A5 search-growth foundation

The local A5 foundation accepts aggregate family/page metrics only: it never
returns raw Search Console or BigQuery rows to Make. It produces deterministic,
manual-review-only CTR, decay, ownership-conflict and technical-review actions,
deduplicates them and returns at most five per client. The optional LLM
narrative is monthly-only and disabled by default; it cannot alter actions.

No BigQuery, Search Console, GA4, DataForSEO, indexing, content change or public
communication is configured or enabled.
