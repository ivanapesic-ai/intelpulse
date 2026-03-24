

## Plan: Fix Patent Data Gaps, TRL Extraction, and C-O Score Alignment

### Root Cause Analysis

**Three distinct problems found:**

1. **Patents showing 0 for many technologies** (V2G, AV Software, EV Motor, Bidirectional Charging, etc.)
   - The daily patent enrichment only updates `patents_count` on individual Crunchbase companies
   - `aggregate_patent_scores` then sums company patents per keyword — but many companies mapped to these keywords have 0 patents in Crunchbase (e.g., AV Software has 52 mapped companies but 0 total company patents)
   - The EPO IPC-based keyword search (`useEpoKeywordSearch`) exists in the frontend hook but is never used in the automated pipeline — it's only available as a manual admin action
   - **Fix**: Add a keyword-level patent enrichment step that queries EPO by IPC codes (already mapped in `KEYWORD_TO_IPC_MAP`) and writes the `totalCount` directly to the `technologies` table, bypassing the company-level aggregation

2. **TRL mostly null after reparse**
   - After reparsing, only 5 out of 19 technologies with mentions have TRL values extracted
   - The AI prompt asks for TRL but the model often returns `null` when the document doesn't explicitly state a TRL number
   - The `technologies.avg_trl_mentioned` column is stale — it wasn't recalculated after the reparse cleared old mentions
   - **Fix**: (a) Enhance the parse-document prompt to instruct the AI to always infer a TRL estimate even when not explicitly stated, using the maturity_level mapping already in the prompt (emerging=TRL 2-3, early_adoption=TRL 5-6, mainstream=TRL 8); (b) After reparse, trigger `aggregate_document_insights` for all keywords to refresh the `technologies` table

3. **C-O scores misaligned** (BMS="limited opportunity", Autonomous Driving="high opportunity")
   - `regulatory_status` is "unknown" and `growth_rate_pct` is NULL for ALL 36 technologies
   - The fallback in `score_all_technologies` uses `COALESCE(growth_rate_pct, 15)` — every technology gets the same 15% growth rate
   - Opportunity score is dominated by funding size and company count, so low-company-count technologies (BMS=72 companies but low funding) get low opportunity while high-funding ones (Autonomous Driving) get high
   - **Fix**: Populate `regulatory_status` and `growth_rate_pct` for the core technologies using AI-assisted research, then re-run `score_all_technologies`

---

### Step 1 — Keyword-level patent enrichment edge function update

Update `epo-patent-lookup` to add a new action `enrich_keywords` that:
- Takes all active keywords from `technology_keywords`
- For each, looks up IPC codes from a server-side mapping (port `KEYWORD_TO_IPC_MAP` into the edge function)
- Calls `searchByIPC` with `recentOnly=true` for the first IPC code per keyword
- Writes `total_patents` directly to the `technologies` table via service role
- Add this as a second step in the daily `daily-epo-patent-enrich` cron job

### Step 2 — Fix TRL extraction in parse-document

Update the AI prompt in `parse-document/index.ts` to add explicit instruction:
> "IMPORTANT: Always provide a trl_mentioned value. If the document does not explicitly state a TRL number, infer it from context: if the technology is described as emerging/research/pilot → TRL 2-4; if early commercial/deployment → TRL 5-7; if mainstream/widely adopted → TRL 8-9. Never return null for trl_mentioned."

### Step 3 — Add post-reparse aggregation trigger

After all documents are reparsed, the system should automatically call `aggregate_document_insights` for each keyword. Add a "Refresh TRL Scores" button to the admin panel that loops through active keywords and calls the RPC, then refreshes the materialized view.

### Step 4 — Populate regulatory_status and growth_rate_pct

Create a migration that sets realistic values for the core 11 SDV technologies based on known market data:

| Technology | regulatory_status | growth_rate_pct |
|---|---|---|
| Autonomous Driving | Evolving regulation | 25 |
| Software Defined Vehicle | Minimal regulation | 30 |
| Electric Vehicle | Strong regulation (EU mandate) | 22 |
| EV Charging | Supportive regulation (AFIR) | 28 |
| EV Battery | Strong regulation (Battery Reg) | 18 |
| Battery Management Systems | Moderate regulation | 15 |
| V2X | Emerging regulation | 20 |
| V2G | Emerging regulation | 35 |
| LiDAR | Minimal regulation | 22 |
| Sensor Fusion | Minimal regulation | 20 |
| Bidirectional Charging | Emerging regulation | 30 |

Then re-run `score_all_technologies` and `refresh_technology_intelligence`.

### Step 5 — Update score_all_technologies to use regulatory_status properly

The current function maps `reg_status` to the challenge function but uses `'Some gaps'` as fallback. Update to use actual values: `'Strong regulation'` → higher challenge score (good for opportunity but adds compliance burden), `'Minimal regulation'` → lower challenge.

---

### Files Modified

| File | Change |
|---|---|
| `supabase/functions/epo-patent-lookup/index.ts` | Add `enrich_keywords` action with IPC mapping |
| `supabase/functions/parse-document/index.ts` | Enhance TRL extraction prompt |
| `src/pages/mockups/AdminPanel.tsx` | Add "Refresh TRL Scores" button |
| New migration SQL | Populate `regulatory_status` and `growth_rate_pct` for core technologies |

