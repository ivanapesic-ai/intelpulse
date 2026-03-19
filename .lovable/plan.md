

# Technology Deep-Dive Page (`/technology/:slug`) — Updated Plan

## Overview
A new protected page providing a complete single-technology view organized around the Three Horizons narrative. All data pulled from existing sources.

## Note on Patents (H2)
The patent section uses `useEpoKeywordSearch` as a mutation triggered on mount. This hits the EPO API live each page load. **Accepted for v1** — if rate-limiting or latency becomes an issue, we'll add DB caching with on-demand refresh later.

## Files to Create

### 1. `src/pages/mockups/TechnologyDeepDive.tsx`
Main page component. Uses `useParams()` to resolve `:slug` → keyword ID, then loads all sections:

- **Header**: display_name, composite score badge (emerald ≥1.5 / amber ≥0.5 / red), domain tag from `ontology_concepts`, description
- **Score Cards**: 5 horizontal cards — Investment, Employees, Patents, TRL, Visibility. Each shows 0-2 color-coded score + raw value (e.g. "€15B", "847 patents")
- **H1 "Today"**: News via `useNews` filtered by keyword — recent articles with source, date, link
- **H2 "Tomorrow"**: Patent data via `useEpoKeywordSearch` mutation fired on mount — top applicants, IPC codes, recent patents. *Live API call, no caching for v1.*
- **H3 "The Future"**: Research via query on `research_signals` — YoY growth, top institutions, publication counts
- **Company Landscape**: `useCompaniesForTechnology` — table sorted by funding + region donut (EU/US/China/Rest from `hqCountry`)
- **Related Technologies**: Query `technology_cooccurrences` both directions, render as clickable Link tags to `/technology/:slug`
- **Document Evidence**: Query `document_technology_mentions` — TRL distribution bars, policy references

### 2. `src/hooks/useTechnologyBySlug.ts`
Queries `technology_keywords` where `keyword = slug`, joins to `technologies` for scores, fetches domain from `ontology_concepts` via `ontology_concept_id`.

### 3. `src/hooks/useCooccurrences.ts`
Queries `technology_cooccurrences` where `keyword_id_a = id OR keyword_id_b = id`, joins to `technology_keywords` for display names/slugs, sorted by `cooccurrence_count` desc.

### 4. `src/hooks/useDocumentMentions.ts`
Queries `document_technology_mentions` by `keyword_id`. Computes TRL distribution (low 1-3, mid 4-6, high 7-9). Extracts policy references.

## Files to Modify

### 5. `src/App.tsx`
Add route `/technology/:slug` → `ProtectedRoute` → `TechnologyDeepDive`

### 6. Make technology names clickable
- `TechnologyDetailPanel.tsx` — wrap name in Link
- `TechnologyCard.tsx` — wrap name in Link
- `TechnologyExplorer.tsx` — list items link to deep-dive
- `Dashboard.tsx` — top technologies link
- `HeatmapMatrix.tsx` — cell click navigates

## Technical Notes
- Region classification: EU = DE/FR/IT/ES/NL/SE/etc., US = "United States", CN = "China", rest = "Other"
- TRL bar chart: simple Tailwind div-based horizontal bars, no charting library
- Co-occurrences: `.or()` filter on both `keyword_id_a` and `keyword_id_b`
- Score badge colors reuse existing `getCompositeScoreLabel` pattern

