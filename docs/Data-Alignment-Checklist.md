# Data Alignment Checklist (UI)

Use this checklist when you want *everything* aligned across Explorer, Intelligence, dashboards, radars, and detail panels.

## 0) Define the canonical sources (required)
- **Technology list (what appears):** `useTechnologies()` + `isSDVRelevant()` + `is_active` + `excluded_from_sdv`
- **Global market totals (companies / funding / employees):** `technologies` aggregated fields (shown on cards)
- **Region totals (EU / US):** `useTechnologyRegionStats()` (only when region filter is active)
- **Market detail breakdowns (top investors / geo / stages):** `useMarketIntelligence()`

If any page uses a different source for the *same* metric, it will drift.

## 1) List alignment (same items everywhere)
For each view (Explorer grid, Intelligence matrix, Radar, etc.):
- [ ] Uses `isSDVRelevant()` filter
- [ ] Enforces `technology_keywords.is_active = true`
- [ ] Respects `excluded_from_sdv = true` duplicates/noise
- [ ] Same sorting rule or explicitly documented differences

## 2) Metric alignment (same totals for the same thing)
For a given Technology (e.g., “Software Defined Vehicle”):
- [ ] Explorer card totals match Explorer detail (Overview + Market Summary)
- [ ] Intelligence detail panel totals match Explorer totals
- [ ] If rounding differs, only display differs (e.g., 1.30 vs 1.34) — underlying values are the same

## 3) Region filter alignment
- [ ] When Region = **Both/All**, show **canonical global totals** (do **not** override with region aggregation)
- [ ] When Region = **Europe** or **USA**, show region aggregation (and hide items with 0 in that region)

## 4) Disclosure alignment (aliases)
- [ ] If alias enrichment is used, the UI discloses which aliases contributed to totals

## 5) Quick audit output format (what you should ask Lovable to deliver)
Ask for a table:

| Page/View | Technology | Metric | Expected source | Actual source | Status | Fix |
|---|---|---|---|---|---|---|

## Copy/paste prompt template

> **Alignment Audit (strict):**
> 1) Create a checklist for alignment across Explorer, Intelligence, and any Radar/Matrix views.
> 2) For each view, verify (a) the technology list matches the canonical filter rules and (b) the displayed market totals come from the canonical aggregated technology record.
> 3) Produce a mismatch table (Page/View, Technology, Metric, Expected source, Actual source, Fix).
> 4) Implement only the fixes necessary to make the metrics consistent (no redesign).
