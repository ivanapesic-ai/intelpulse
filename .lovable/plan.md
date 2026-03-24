

## Plan: Semantic Layer SQL Migration (Steps 1–10)

All verified against live database. Both `ontology_domains` and `ontology_concepts.domain_id` exist. Both `keyword_overview` and `domain_overview` confirmed joining `automotive_companies` (bug).

### Single Migration File

One SQL migration containing all steps in order:

**Step 1 — Hotfix: Fix `keyword_overview` view**
- `CREATE OR REPLACE VIEW keyword_overview` — change `automotive_companies ac` → `crunchbase_companies cc`, update column refs (`ac.total_funding_usd` → `cc.total_funding_usd`, `ac.patents_count` → `cc.patents_count`)

**Step 2 — Fix `domain_overview` view**  
- Same fix: `automotive_companies ac` → `crunchbase_companies cc`

**Step 3 — Create `signal_definitions` table**
- Columns: `id serial PK`, `signal_key text UNIQUE`, `label text`, `source_tables text[]`, `scoring_weight numeric`, `score_function text`, `display_order int`, `is_composite_input boolean`, `created_at timestamptz`
- Seed 6 rows: Investment (0.30, composite), Employees (0.25, composite), Patents (0.25, composite), Research (0, not composite), Visibility (0, not composite), TRL (0, not composite)
- RLS: public SELECT, admin ALL

**Step 4 — Create `platform_config` table**
- Columns: `key text PK`, `value text`, `description text`, `updated_at timestamptz`
- Seed: `usd_eur_rate` = 0.92, `composite_formula` = 'weighted_log_ratio'
- RLS: public SELECT, admin ALL

**Step 5 — Add columns to `technologies`**
- `regulatory_status text DEFAULT 'unknown'`
- `growth_rate_pct numeric DEFAULT NULL`

**Step 6 — Create 8 canonical SQL functions**

All `SECURITY DEFINER`, `STABLE`, reading from `technologies` table (which already has pre-aggregated values):

| Function | Source column | Thresholds |
|---|---|---|
| `get_investment_score(uuid)` | `total_funding_eur` | ≥5B→2, ≥500M→1, else 0 |
| `get_employees_score(uuid)` | `total_employees` | ≥50k→2, ≥5k→1, else 0 |
| `get_patents_score(uuid)` | `total_patents` | ≥10k→2, ≥500→1, else 0 |
| `get_research_score(uuid)` | `total_research_works` | ≥100k→2, ≥10k→1, else 0 |
| `get_visibility_score(uuid)` | calls existing `calculate_market_response_score` | delegates |
| `get_company_count(uuid)` | `COUNT(DISTINCT)` from `crunchbase_keyword_mapping` | raw count |
| `get_total_funding(uuid)` | `SUM(total_funding_usd)` × `platform_config.usd_eur_rate` from `crunchbase_companies` | raw numeric |
| `get_maturity_score(uuid)` | weighted log-ratio (funding 30%, patents 25%, employees 25%, companies 20%) | 0–2 continuous |

Each function takes `p_keyword_id uuid` and joins through `technologies.keyword_id`.

**Step 7 — Create `technology_intelligence` materialized view**

```sql
SELECT
  tk.id AS keyword_id, tk.display_name AS name, tk.keyword AS slug, tk.aliases,
  od.name AS domain_name, od.id AS domain_id,
  get_investment_score(tk.id), get_employees_score(tk.id),
  get_patents_score(tk.id), get_research_score(tk.id),
  get_visibility_score(tk.id),
  get_maturity_score(tk.id) AS maturity_score,
  get_company_count(tk.id) AS company_count,
  get_total_funding(tk.id) AS total_funding_eur,
  t.total_patents, t.total_employees, t.total_research_works, ...
  t.challenge_score, t.opportunity_score,
  t.regulatory_status, t.growth_rate_pct,
  now() AS refreshed_at
FROM technology_keywords tk
JOIN technologies t ON t.keyword_id = tk.id
LEFT JOIN ontology_concepts oc ON tk.ontology_concept_id = oc.id
LEFT JOIN ontology_domains od ON oc.domain_id = od.id
WHERE tk.is_active = true AND COALESCE(tk.excluded_from_sdv, false) = false;
```
With `CREATE UNIQUE INDEX idx_ti_keyword ON technology_intelligence(keyword_id)`.

**Step 8 — Create `refresh_technology_intelligence()` function**
- Calls `REFRESH MATERIALIZED VIEW CONCURRENTLY technology_intelligence`

**Step 9 — Update `score_all_technologies()`**
- Replace hardcoded `'Some gaps'` with `COALESCE(t.regulatory_status, 'Some gaps')`
- Replace hardcoded `15` with `COALESCE(t.growth_rate_pct, 15)`
- Note: fallback defaults preserved during migration; actual per-keyword values to be populated soon after for top technologies (ADAS, V2X, EV Battery, SDV)

**Step 10 — Update `recalculate-percentiles` edge function**
- After `recalculate_signal_percentiles` RPC call, add `supabase.rpc("refresh_technology_intelligence")`

### Files Modified
- **New migration SQL** — all steps 1–9
- `supabase/functions/recalculate-percentiles/index.ts` — step 10

### NOT in scope
Frontend hook migration (reading from `technology_intelligence` instead of scattered sources) — separate follow-up once SQL layer verified.

