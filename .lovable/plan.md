

# Fix Research Paper Relevance and Recency

## Problems Identified

1. **Stale data in DB**: Papers showing 2023-2024 dates because the enrichment hasn't been re-run since the last code fix
2. **Irrelevant results**: "Brain tumor segmentation" and "deep learning in insurance" appearing for Software Defined Vehicle. The `topics.domain.id:1` (Physical Sciences) filter is far too broad — it covers all of physics, math, chemistry, etc.
3. **Year filtering**: Using `from_publication_date` with a rolling 12-month window still picks up old papers. The OpenAlex API supports cleaner `publication_year` range filters

## Evidence from User's OpenAlex Search

Searching "software defined vehicle" with "Since 2025" filter on OpenAlex directly returns 937 highly relevant works like "Software-Defined Vehicles: The Future of Automobile Industry" (2025). Our function is returning brain tumor papers instead.

## Solution

### `supabase/functions/fetch-research-signals/index.ts`

1. **Remove `topics.domain.id:1` filter entirely** — it is too broad and counterproductive. The search query with quoted automotive terms already provides sufficient domain scoping. OpenAlex's `search` parameter does relevance ranking natively.

2. **Use `publication_year` filter** instead of `from_publication_date` for cleaner filtering:
   - Total works: no year filter
   - 5-year: `publication_year:2021-2026`
   - 2-year: `publication_year:2024-2026`
   - Top papers: `publication_year:2025-2026` (current + previous year), sorted by `publication_date:desc`
   - Growth rate: use `publication_year:YYYY` for each year

3. **Reduce alias noise** — skip aliases that are too generic (less than 3 chars) or overlap with other technology keywords (e.g., "ADAS" as alias for AV Software causes cross-contamination). Add a minimum term length filter.

4. **Keep HTML stripping** for paper titles

### Expected Outcome

After deploying and re-running enrichment:
- SDV will show papers like "Software-Defined Vehicles: The Future of Automobile Industry" (2025)
- No more medical/insurance papers
- Only 2025+ papers in the "Latest Papers" cards

