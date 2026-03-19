

# Comparison: Uploaded Plan File vs Currently Deployed Code

The uploaded file represents the **intended fixes from the last approved plan**. The currently deployed `supabase/functions/fetch-research-signals/index.ts` is **still the old version** — none of the plan's changes were applied. Here are the specific differences:

| Area | Deployed (Current) | Uploaded (Plan Target) |
|------|-------------------|----------------------|
| `MIN_ALIAS_LENGTH` | 3 | **4** |
| `buildSearchQuery` — raw keyword slug | Included (e.g., "sdv", "ems") | **Skipped entirely** — slugs match unrelated domains |
| `buildSearchQuery` — hyphenated aliases | Included | **Skipped** — they're slug-format duplicates |
| `buildSearchQuery` — deduplication | Simple `Set<string>` (case-sensitive) | **Case-insensitive** dedup via `seen` set |
| `baseFilter` | `type:article\|review\|preprint` | **+ `language:en`** |
| Top papers sort | `sort: "publication_date:desc"` | **No sort** — uses OpenAlex default relevance ranking |
| Results details | No `searchQuery` field | **Includes `searchQuery`** for debugging |
| Console log | 80 char substring | 120 char substring |

## Plan: Apply the Uploaded Version

The fix is straightforward — replace the deployed file with the uploaded version. All changes align with the previously approved plan:

1. Skip raw keyword slugs to prevent "sdv" matching "Sparse Dynamic Volume"
2. Increase alias minimum length to 4 to filter "ems", "sdv", etc.
3. Skip hyphenated aliases (redundant slug duplicates)
4. Add `language:en` filter
5. Remove explicit date sort so OpenAlex relevance ranking works properly
6. Add `searchQuery` to response details for easier debugging

### File to modify
- `supabase/functions/fetch-research-signals/index.ts` — replace with the uploaded version

