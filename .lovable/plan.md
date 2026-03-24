

## Plan: Frontend Migration to `technology_intelligence`

### Pre-requisite: Add `technology_id` to materialized view

The view is missing `t.id AS technology_id`. Many consumers use `tech.id` as key. Single migration to drop and recreate the view with this column added.

### Step 1 — Rewrite `useTechnologies()` 

Replace the `technologies` + `technology_keywords!inner` join with `SELECT * FROM technology_intelligence`. Map columns to the existing `Technology` interface. No client-side SDV filtering needed — the view already excludes inactive/non-SDV.

Keep `useTechnology(id)` as a `.eq("technology_id", id).single()` on the view.

Keep `useKeywords()`, `useUpdateKeywordTags()`, `useAITagMapping()`, `useKeywordStats()` unchanged — they operate on `technology_keywords` directly and aren't part of the scoring layer.

### Step 2 — Rewrite `useTechnologyIntelligence()`

Same approach — `SELECT * FROM technology_intelligence`. Map to existing `TechnologyIntelligence` interface. `useSingleTechnologyIntelligence(keywordId)` becomes `.eq("keyword_id", keywordId).single()`.

Keep `useAggregateDocumentInsights()` and `useCalculateAllCOScores()` mutations — but update their `onSuccess` to invalidate `["technology-intelligence"]` only (the unified key).

### Step 3 — Rewrite `useDomainHierarchy`

- `useDomainOverview()`: Query `technology_intelligence` with client-side grouping by `domain_id`/`domain_name`, aggregating counts and funding.
- `useKeywordOverview()`: Each row in `technology_intelligence` IS a keyword overview. Direct mapping.
- Keep exported interfaces, `QUADRANT_CONFIG`, `MATURITY_CONFIG`, `formatCompactNumber` unchanged.

### Step 4 — Simplify `useCOScoringEngine`

- **Remove** `useScoredTechnologies()` — zero external consumers (confirmed by search).
- **Remove** `useQuadrantDistribution()` — zero external consumers.
- **Remove** `calculateChallengeScore()` and `calculateOpportunityScore()` — client-side simulation functions no longer needed since canonical SQL functions exist.
- **Keep** `useApplyCOScores()` mutation — still needed for admin recalculation. Update its `onSuccess` to call `refresh_technology_intelligence()` via RPC, then invalidate `["technology-intelligence"]`.
- **Keep** `getQuadrant()` utility and `QUADRANT_CONFIG` constant.
- **Keep** `ScoringFactors` interface (might be used elsewhere).

### Step 5 — Update `SignalBreakdown` to read from `signal_definitions`

Add a small `useQuery` for `signal_definitions` table. Use `label` and `display_order` from the DB rows to drive signal ordering and naming instead of the hardcoded `SIGNAL_DEFINITIONS` object. Fallback to current hardcoded values if query fails.

### Step 6 — Unify query keys in `useDataSync`

Replace scattered key arrays with a single `"technology-intelligence"` key that all hooks share. After any data import or recalculation, one `invalidateQueries(["technology-intelligence"])` refreshes everything.

Update `SCORING_QUERY_KEYS` to include `"technology-intelligence"` and remove `"co-scored-technologies"`.

### Files Modified

| File | Change |
|---|---|
| New migration SQL | Add `technology_id` to materialized view |
| `src/hooks/useTechnologies.ts` | Rewrite `useTechnologies()` and `useTechnology()` to read from view |
| `src/hooks/useTechnologyIntelligence.ts` | Rewrite both hooks to read from view |
| `src/hooks/useDomainHierarchy.ts` | Rewrite to aggregate from view |
| `src/hooks/useCOScoringEngine.ts` | Remove 4 unused exports, update `useApplyCOScores` invalidation |
| `src/components/intelligence/SignalBreakdown.tsx` | Read signal config from `signal_definitions` |
| `src/hooks/useDataSync.ts` | Add `"technology-intelligence"` to key arrays |

### What stays unchanged
- All page components (same interfaces consumed)
- `useTechnologyRegionStats` (needs direct `crunchbase_keyword_mapping` for per-region breakdowns)
- Admin mutation hooks (`useAITagMapping`, `useUpdateKeywordTags`)
- `useKeywords`, `useKeywordStats`

