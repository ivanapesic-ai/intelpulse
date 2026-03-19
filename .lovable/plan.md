

# Fix Research Paper Relevance in OpenAlex Integration

## Problem
The current implementation uses the **deprecated** `title_and_abstract.search` filter in OpenAlex, which does not properly parse complex boolean queries. The domain context clause (`AND automotive OR vehicle...`) is being ignored, causing completely irrelevant papers (e.g., diabetes studies for "AV Software") to appear. Papers also show raw HTML tags like `<i>` in titles.

## Root Cause
- `title_and_abstract.search` is deprecated and doesn't support boolean AND/OR operators properly
- The complex query `("AV Software" OR "ADAS") AND (automotive OR vehicle)` gets partially parsed, matching generic terms like "software" across all domains

## Solution: Two-Layer Precision Filtering

### 1. Switch to `search` query parameter (supports boolean)
Use the recommended `search` parameter which properly handles `AND`, `OR`, `NOT`, and quoted phrases. This is OpenAlex's current recommended approach.

### 2. Add OpenAlex Topics domain filter
Instead of keyword-based domain scoping, use OpenAlex's structured `topics.domain.id` or `topics.field.id` filter to restrict results to Engineering and Computer Science fields. This is a categorical filter that cannot return diabetes papers.

Relevant OpenAlex domain/field IDs to scope to:
- Engineering domain
- Computer Science domain  
- Transportation-related subfields

### 3. Strip HTML from paper titles
Clean `<i>`, `</i>`, and other HTML tags from paper titles before storing.

## Changes

### `supabase/functions/fetch-research-signals/index.ts`
- Remove `title_and_abstract.search` from filter string
- Move search query to the `search` query parameter  
- Add `topics.domain.id` filter for Engineering + CS domains
- Keep `type:article|review|preprint` and date filters in the `filter` parameter
- Add HTML tag stripping for paper titles
- Simplify `buildSearchFilter` — no need for domain context keywords in the search query itself since Topics filter handles domain scoping

### Example API call (before → after)

**Before** (broken):
```
/works?filter=type:article,title_and_abstract.search:("ADAS" OR "AV Software") AND (automotive OR vehicle)
```

**After** (correct):
```
/works?search="ADAS" OR "Advanced Driver Assistance" OR "AV Software"&filter=type:article|review|preprint,topics.domain.id:domain1|domain2,from_publication_date:2025-03-19
```

### Technical details
- OpenAlex domain IDs will be looked up (e.g., `https://openalex.org/domains/2` for Engineering, `https://openalex.org/domains/1` for Physical Sciences)
- The `search` parameter costs $1/1000 calls vs $0.10 for filter-only, but we're already using search-type queries
- All existing count queries (total, 5yr, 2yr, yearly) will be updated to use the same approach
- Paper titles will be sanitized with a simple regex to strip HTML tags

