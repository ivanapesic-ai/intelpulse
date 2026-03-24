

## Plan: Signal Lineage UX Improvements + Data Pipeline Fixes

### Summary of Changes

1. **Move Signal Lineage from Deep Dive to Horizons page** — Each technology row in the Horizons table becomes expandable, revealing the lineage timeline inline. Remove lineage from TechnologyDeepDive.
2. **Filter out Chinese-language patent titles** — In the `identify-signal-lineage` edge function, skip patents where the title contains CJK characters.
3. **Expand OpenAlex to fetch papers from 2022+** — Currently fetches only last 1-2 years of top papers. Widen the `publication_year` filter to `2022-{currentYear}` and increase `per_page` to 10 for richer lineage data.
4. **Tooltips already exist** — The current `SignalLineageTimeline` already has SVG `<Tooltip>` on both nodes and connections showing titles and descriptions. The issue is that SVG circles are small (r=6) and paths are thin. Fix: increase node radius to 8, increase path hover hitbox with an invisible wider stroke underneath.

### Step 1 — Move lineage to Horizons page (expandable rows)

**`src/pages/mockups/HorizonsPage.tsx`**:
- Import `useSignalLineage`, `SignalLineageTimeline`, `Collapsible` components
- Make each table row expandable: clicking a row toggles a collapsible area below showing `SignalLineageTimeline` for that technology's `keywordId`
- Track expanded state as `expandedKeywordId: string | null`
- Only fetch lineage data for the currently expanded row (conditional query)

**`src/pages/mockups/TechnologyDeepDive.tsx`**:
- Remove the `SignalLineageTimeline` import, `useSignalLineage` hook call, and the lineage section (lines 645-650)

### Step 2 — Filter Chinese patents in lineage function

**`supabase/functions/identify-signal-lineage/index.ts`**:
- After fetching `patentItems`, filter out any where `title` matches CJK unicode range (`/[\u4e00-\u9fff\u3400-\u4dbf]/`)
- This keeps only patents with readable Latin-script titles

### Step 3 — Widen OpenAlex paper window for lineage

**`supabase/functions/identify-signal-lineage/index.ts`**:
- Currently the research data comes from `research_signals.top_papers` which only stores 5 recent papers
- To get historical depth, add a direct OpenAlex API call in the lineage function fetching top 10 papers from 2022 onwards, sorted by relevance
- This gives the LLM older research to link against newer patents/news

### Step 4 — Improve tooltip hover targets

**`src/components/intelligence/SignalLineageTimeline.tsx`**:
- Increase node circle radius from 6 to 8
- Add invisible wider stroke (strokeWidth=12, opacity=0) behind each bezier path as a hover target
- This makes tooltips much easier to trigger on both nodes and connections

### Files Modified

| File | Change |
|---|---|
| `src/pages/mockups/HorizonsPage.tsx` | Add expandable lineage rows per technology |
| `src/pages/mockups/TechnologyDeepDive.tsx` | Remove lineage section |
| `src/components/intelligence/SignalLineageTimeline.tsx` | Larger hover targets |
| `supabase/functions/identify-signal-lineage/index.ts` | Filter CJK patents, fetch OpenAlex 2022+ papers directly |

