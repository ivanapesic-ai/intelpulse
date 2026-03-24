

## Plan: Admin Taxonomy + Ontology Alignment & My Signals Historical View

### Part 1 — Admin: Merge Taxonomy & Ontology into side-by-side truth

Currently the admin panel has two separate tabs: **Taxonomy** (KeywordManager showing keywords, aliases, mappings) and **Ontology** (TechnologyOntology showing co-occurrence clusters). The user wants them side-by-side to see how they relate.

**Change:** Replace the two separate tabs with a single **"Taxonomy & Ontology"** tab that uses a 2-column layout:
- **Left column**: KeywordManager (the keyword list with aliases, sources, mapping status)
- **Right column**: TechnologyOntology (clusters and connections derived from shared companies)

Both already read from `technology_keywords` — displaying them together lets the admin see which keywords map to which ontology clusters. Update the tab grid from 4 to 3 tabs (merge taxonomy+ontology, keep Data Sources, keep Status).

### Part 2 — My Signals: Historical signal timeline

Currently My Signals shows a snapshot card per watched technology with delta badges (current vs previous snapshot). The user wants to see **historical movement over time** — how signals have changed day by day since they started watching.

**Changes to MySignals page:**

1. **Add a time-series chart per watched technology** using the existing `keyword_signal_snapshots` table (which has daily snapshots of company_count, total_funding_usd, total_patents, total_employees, news_mention_count, composite_score).

2. **For each SignalCard**, add an expandable area (or always-visible chart below the stats) showing a multi-line chart (Recharts `LineChart`) with:
   - X-axis: snapshot dates
   - Lines for: composite score, company count, patents, news mentions
   - Time range: all snapshots available (the `useSignalSnapshots` hook already fetches by date range — increase default from 6 months to 12 months or use "all")

3. **Add a news timeline** per technology using the existing `NewsTimelineChart` component (weekly bar chart of news mentions) below the signal chart.

4. Update the page subtitle from "quarterly signal tracking" to "historical signal tracking".

### Files Modified

| File | Change |
|---|---|
| `src/pages/mockups/AdminPanel.tsx` | Merge Taxonomy + Ontology into one tab, reduce to 3 tabs |
| `src/pages/mockups/MySignals.tsx` | Add historical line charts per watched technology, expand snapshot window |
| `src/hooks/useSignalSnapshots.ts` | No change needed — already supports variable month ranges |

### Technical Details

**Signal chart**: Use Recharts `LineChart` with `ResponsiveContainer`. Each snapshot row becomes a data point. Normalize values for multi-axis display (composite is 0-1 scale, companies/patents are absolute numbers) — use dual Y-axis or normalize to percentage change from first snapshot.

**Data availability**: `keyword_signal_snapshots` is populated daily by the `daily-signal-snapshots` cron job (08:00 UTC). So historical data exists for any technology that's been tracked since the pipeline was set up.

