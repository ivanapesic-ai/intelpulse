

## Data Consistency Audit Report

### Summary
After querying the database and cross-referencing with UI code, here are the findings:

---

### PASS — Company counts and funding are consistent

| Technology | `technologies` table count | Live `crunchbase_keyword_mapping` count | Match |
|---|---|---|---|
| All 18 active SDV technologies | Verified | Verified | **Yes** |

The `technologies.dealroom_company_count` and `technologies.total_funding_eur` match the live aggregation from `crunchbase_keyword_mapping` + `crunchbase_companies` for all 18 technologies. Funding uses a consistent 0.92 USD→EUR conversion.

---

### PASS — Explorer region stats use same data source

The `useTechnologyRegionStats` hook fetches from the same `crunchbase_keyword_mapping` table with paginated fetching (fixed earlier). China data: 103 company records present and correctly categorized.

When region = "all", the Explorer correctly uses `getRegionStats(..., "all")` which sums all companies globally — consistent with the `technologies` table totals.

---

### PASS — Dashboard uses same `useTechnologies()` hook

Dashboard filters with `tech.dealroomCompanyCount > 0 || tech.totalFundingEur > 0` — same logic as Explorer. Same data source, same filtering.

---

### ISSUE 1 — `patents_score` = 2 for ALL 18 technologies

Every single technology has `patents_score = 2` (Strong). This means the patent signal provides **zero differentiation**. Technologies with 0 patents (AV Simulation, AV Software, Vehicle to Grid) score the same as those with 28,692 patents (Electric Vehicle).

**Root cause**: The `recalculate-percentiles` function or the EPO lookup likely set all to 2, or the scoring trigger doesn't properly distinguish. The percentile-based scoring (top 20% = 2, middle 40% = 1, bottom 40% = 0) isn't working because only 18 items exist and many share the same EPO IPC codes.

**Impact**: `composite_score` is inflated for low-patent technologies.

---

### ISSUE 2 — `research_score` is nearly flat (15 × "2", 3 × "1")

Only SDV, Teledriving, and Vehicle as Software score 1; all others score 2. This provides minimal differentiation. The `total_research_works` values vary wildly (3,545 to 3.1M) but the scoring collapses them.

---

### ISSUE 3 — `composite_score` formula ignores visibility and research

The `composite_score` = `(investment + employees + patents) / 3`. It does NOT include `visibility_score` or `research_score`, even though these are displayed alongside it. The UI uses `log_composite_score` for sorting which is different from `composite_score` — this is intentional but may confuse users.

---

### ISSUE 4 — Dashboard "Highlights" are hardcoded

Line 108-113 in `Dashboard.tsx`: The "Highlights" section contains hardcoded text ("€89B aggregate funding across 142 companies") that doesn't update with real data.

---

### ISSUE 5 — Intelligence Dashboard uses different data source

The Intelligence Dashboard uses `useTechnologyIntelligence()` and `useDomainHierarchy()` rather than `useTechnologies()`. These pull from `keyword_overview` and `domain_overview` database views. While they *should* be consistent, they aggregate differently (using `crunchbase_keyword_mapping` directly) and may show slightly different totals if the views aren't refreshed after reprocessing.

---

### ISSUE 6 — `total_funding_eur` double-counting across technologies

Many companies map to multiple keywords. For example, a company tagged to both "Electric Vehicle" (665 companies) and "EV Charging" (250 companies) contributes its funding to **both** totals. This is correct per-technology, but the Dashboard sums all `totalFundingEur` across technologies (line 81), producing a massively inflated aggregate total that double/triple-counts the same companies.

---

### Recommended Fixes (Priority Order)

1. **Recalculate patent scores** with proper percentile distribution across the 18 active SDV technologies, or switch to absolute thresholds (e.g., >1000 = 2, >100 = 1, else 0)
2. **Fix research score thresholds** to provide better differentiation
3. **Replace hardcoded Highlights** with dynamic data from the actual dataset
4. **Add a disclaimer or fix the Dashboard aggregate totals** to avoid double-counting funding across technologies
5. **Verify `keyword_overview`/`domain_overview` views** are refreshed after Crunchbase reprocessing to keep Intelligence Dashboard in sync

