

## Plan: Clean Up Intelligence Dashboard

### Changes

**1. Remove domain/keyword counters** (IntelligenceDashboard.tsx)
- Delete the `<div>` showing "{displayDomainCount} domains • {displayKeywordCount} keywords" from the search card
- Remove the related `useMemo` computations (`alignedKeywords`, `displayKeywordCount`, `displayDomainCount`) and unused imports

**2. Keep only Hybrid View, rename it** (GartnerMatrixSampler.tsx)
- Remove the Tabs component entirely — render only `HybridRadarQuadrant` directly
- Rename the card title from "Technology Intelligence Views" to "Strategy Matrix"
- Remove the subtitle "Strategic positioning and maturity analysis"
- Keep the badge "Radar + Quadrant Fusion" and its description as context for the visualization

**3. Improve bubble labels for readability** (GartnerMatrixSampler.tsx — HybridRadarQuadrant)
- Instead of showing just 2 letters (e.g. "VE" for three different techs), use **abbreviated but distinguishable labels**: truncate to ~6 characters (e.g. "EV Chr", "V2G", "V2X", "V-SW") so each bubble is identifiable without hovering
- Increase minimum bubble size slightly to accommodate the longer text
- Add a **color-coding by domain/category**: assign each technology a color from the existing `techColors` palette based on its domain, so technologies in the same domain share a color. This provides an additional visual differentiator
- Add a small **legend** below the chart mapping colors to domain names

### Files Modified
- `src/pages/mockups/IntelligenceDashboard.tsx`
- `src/components/intelligence/GartnerMatrixSampler.tsx`

