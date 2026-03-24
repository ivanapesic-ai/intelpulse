

## Plan: Deep Dive Page Fixes

### Issues Identified

1. **C-O cards too large** — Challenge and Opportunity take 2/3 of the 3-col grid with empty space. Fix: stack them vertically in 1 column, give Signal Breakdown 2 columns.
2. **Company Landscape showing 0 companies** — The route is `/technology/ev` but the slug lookup uses `technology_keywords.keyword`. The keyword for Electric Vehicle is likely `electric_vehicle`, not `ev`. The `useTechnologyBySlug` hook does `.eq("keyword", slug)` which returns null for `ev`. Need to also check for partial matches or add fallback slug lookup.
3. **"Error loading market data: Bad Request"** — Since the slug doesn't match, `tech.keywordId` is undefined/null, causing the market intelligence query to fail or return bad request. This is a downstream effect of issue #2.
4. **Document Evidence section showing "Unknown" TRL** — All 4 mentions have TRL=null. The section currently shows even when all data is unknown/zero. Remove the entire Document Evidence section from the deep dive page as requested.
5. **Missing Market Intelligence sections** — Top Strategic Investors, Geographic Concentration, Funding Stage Distribution are already rendered via `<MarketIntelligence>` component (line 630), but fail because of the slug mismatch. Once #2 is fixed, these will appear.

### Step 1 — Fix slug lookup in `useTechnologyBySlug`

Add fallback: if `.eq("keyword", slug)` returns null, try `.ilike("keyword", `%${slug}%`)` or look up by `display_name`. Also add a check for common short slugs by querying with `slug` as a case-insensitive prefix match.

Better approach: update `useTechnologyBySlug` to first try exact match, then try matching the slug against any `keyword` that starts with the slug, then try `display_name` case-insensitive search.

### Step 2 — Redesign Strategic Assessment layout

Change from `lg:grid-cols-3` (Challenge | Opportunity | SignalBreakdown) to `lg:grid-cols-3` where Challenge+Opportunity stacked in 1 column (`lg:col-span-1`) and SignalBreakdown takes 2 columns (`lg:col-span-2`).

### Step 3 — Remove Document Evidence section

Delete the entire Document Evidence block (lines 660-693): TRL Distribution bars, Policy References card, and the `useDocumentMentions` hook usage. Remove the `docMentions` variable and the `TrlBars` component.

### Files Modified

| File | Change |
|---|---|
| `src/hooks/useTechnologyBySlug.ts` | Add fallback slug matching |
| `src/pages/mockups/TechnologyDeepDive.tsx` | Redesign C-O layout (stacked + 2-col signal), remove Document Evidence section |

