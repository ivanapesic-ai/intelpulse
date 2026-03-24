

## Plan: Intelligence Dashboard Cleanup + Telematics Merge

### Changes

**1. Merge Telematics into SDV** (database + taxonomy-filters.ts)
- Set `excluded_from_sdv = true` on Telematics in `technology_keywords`
- Add "telematics" to `DUPLICATE_KEYWORDS` mapping to "Software Defined Vehicle"
- Add "Telematics" to SDV's aliases array
- Result: 11 core technologies

**2. Strategy Matrix cleanup** (GartnerMatrixSampler.tsx)
- Remove `<Badge>Radar + Quadrant Fusion</Badge>` 
- Move "Maturity rings with strategic positioning overlay" as subtitle under "Strategy Matrix"
- Remove `max-w-xl` constraint — make the radar fill available width (use `max-w-2xl` or `max-w-3xl`)
- Increase bubble sizes: base from 32 to 44, funding bonus from 16 to 20, text from 7px to 9px
- Replace domain-based colors with a palette of 11+ distinct colors assigned per-technology (no legend needed — remove the domain legend entirely)
- Update `getSmartLabel` to add missing entries: "Sensor Fusion" → "SenFu", "AV Software" → "AV-SW", "Software Defined Vehicle" → "SDV", "Energy Management Systems" → "EMS", "Battery Management Systems" → "BMS", "Telematics" → "Telm" (if still visible)

**3. Detail panel: remove sector badges** (TechnologyDetailPanel.tsx)
- Remove the entire `sectorTags` rendering block (lines 47-61) — no "No sector assigned" text, no sector badges at all

**4. Signal Breakdown cleanup** (SignalBreakdown.tsx)
- Remove "4-signal model: H1 Now · H2 Emerging · H3 Vision" subtitle
- Remove all `horizon` fields and the H1/H2/H3 badges from each signal row
- Reorder signals: Investment → Research → Patents → Market Response
- Rename title from "Early Indicators of New Technologies" to "Signal Breakdown"

### Files Modified
- `src/lib/taxonomy-filters.ts` — add telematics mapping
- `src/components/intelligence/GartnerMatrixSampler.tsx` — layout, sizing, colors
- `src/components/intelligence/TechnologyDetailPanel.tsx` — remove sector badges
- `src/components/intelligence/SignalBreakdown.tsx` — reorder, remove H1/H2/H3
- Database: `technology_keywords` table (telematics exclusion + SDV aliases)

