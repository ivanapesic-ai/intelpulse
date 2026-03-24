-- STEP 1: Fix keyword_overview view (hotfix - automotive_companies → crunchbase_companies)
CREATE OR REPLACE VIEW keyword_overview AS
SELECT tk.id AS keyword_id,
    tk.keyword,
    tk.display_name,
    tk.description,
    tk.aliases,
    oc.id AS domain_id,
    oc.name AS domain_name,
    oc.challenge_score AS domain_challenge,
    oc.opportunity_score AS domain_opportunity,
    count(DISTINCT ckm.company_id) AS company_count,
    COALESCE(sum(DISTINCT cc.total_funding_usd), 0::numeric) AS total_funding_usd,
    COALESCE(sum(cc.patents_count), 0::bigint) AS total_patents
   FROM technology_keywords tk
     LEFT JOIN ontology_concepts oc ON tk.ontology_concept_id = oc.id
     LEFT JOIN crunchbase_keyword_mapping ckm ON ckm.keyword_id = tk.id
     LEFT JOIN crunchbase_companies cc ON cc.id = ckm.company_id
  WHERE tk.is_active = true
  GROUP BY tk.id, tk.keyword, tk.display_name, tk.description, tk.aliases, oc.id, oc.name, oc.challenge_score, oc.opportunity_score
  ORDER BY oc.display_order, tk.display_name;

-- STEP 2: Fix domain_overview view
CREATE OR REPLACE VIEW domain_overview AS
WITH domain_stats AS (
    SELECT oc.id,
        oc.name,
        oc.challenge_score,
        oc.opportunity_score,
        oc.maturity_stage,
        oc.description,
        oc.display_order,
        count(DISTINCT ckm.company_id) AS company_count,
        COALESCE(sum(DISTINCT cc.total_funding_usd), 0::numeric) AS total_funding_usd,
        count(DISTINCT
            CASE
                WHEN cc.hq_country = ANY (ARRAY['Germany','France','United Kingdom','UK','Spain','Italy','Netherlands','Sweden','Switzerland','Austria','Belgium','Denmark','Finland','Ireland','Norway','Poland','Portugal','Czech Republic','Hungary','Romania','Greece']) THEN cc.id
                ELSE NULL::uuid
            END) AS eu_company_count,
        COALESCE(sum(cc.patents_count), 0::bigint) AS total_patents,
            CASE
                WHEN oc.challenge_score >= 1.5 AND oc.opportunity_score >= 1.5 THEN 'Strategic Investment'
                WHEN oc.challenge_score < 0.5 AND oc.opportunity_score >= 1.5 THEN 'High-Risk High-Reward'
                WHEN oc.challenge_score >= 1.5 AND oc.opportunity_score < 0.5 THEN 'Mature Low-Growth'
                ELSE 'Monitor'
            END AS strategic_quadrant
       FROM ontology_concepts oc
         LEFT JOIN technology_keywords tk ON tk.ontology_concept_id = oc.id
         LEFT JOIN crunchbase_keyword_mapping ckm ON ckm.keyword_id = tk.id
         LEFT JOIN crunchbase_companies cc ON cc.id = ckm.company_id
      WHERE oc.concept_level = 'domain'
      GROUP BY oc.id, oc.name, oc.challenge_score, oc.opportunity_score, oc.maturity_stage, oc.description, oc.display_order
)
SELECT id, name, challenge_score, opportunity_score, maturity_stage, description,
    display_order, company_count, total_funding_usd, eu_company_count, total_patents, strategic_quadrant
FROM domain_stats
ORDER BY display_order;

-- STEP 3: Create signal_definitions table
CREATE TABLE IF NOT EXISTS public.signal_definitions (
  id serial PRIMARY KEY,
  signal_key text NOT NULL UNIQUE,
  label text NOT NULL,
  source_tables text[] NOT NULL DEFAULT '{}',
  scoring_weight numeric NOT NULL DEFAULT 0.0,
  score_function text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_composite_input boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.signal_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view signal definitions"
  ON public.signal_definitions FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage signal definitions"
  ON public.signal_definitions FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

INSERT INTO public.signal_definitions (signal_key, label, source_tables, scoring_weight, score_function, display_order, is_composite_input) VALUES
  ('investment', 'Investment', ARRAY['technologies'], 0.30, 'get_investment_score', 1, true),
  ('employees', 'Employees', ARRAY['technologies'], 0.25, 'get_employees_score', 2, true),
  ('patents', 'Patents', ARRAY['technologies'], 0.25, 'get_patents_score', 3, true),
  ('research', 'Research', ARRAY['research_signals'], 0.0, 'get_research_score', 4, false),
  ('visibility', 'Visibility', ARRAY['crunchbase_companies','news_keyword_matches'], 0.0, 'get_visibility_score', 5, false),
  ('trl', 'TRL', ARRAY['technologies'], 0.0, 'get_trl_score', 6, false);

-- STEP 4: Create platform_config table
CREATE TABLE IF NOT EXISTS public.platform_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform config"
  ON public.platform_config FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage platform config"
  ON public.platform_config FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

INSERT INTO public.platform_config (key, value, description) VALUES
  ('usd_eur_rate', '0.92', 'USD to EUR conversion rate used for funding calculations'),
  ('composite_formula', 'weighted_log_ratio', 'Active composite formula type');

-- STEP 5: Add per-technology C-O columns
ALTER TABLE public.technologies
  ADD COLUMN IF NOT EXISTS regulatory_status text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS growth_rate_pct numeric DEFAULT NULL;

-- STEP 6: Create 8 canonical SQL functions

CREATE OR REPLACE FUNCTION public.get_investment_score(p_keyword_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN t.total_funding_eur >= 5000000000 THEN 2
    WHEN t.total_funding_eur >= 500000000 THEN 1
    ELSE 0
  END
  FROM technologies t WHERE t.keyword_id = p_keyword_id
$$;

CREATE OR REPLACE FUNCTION public.get_employees_score(p_keyword_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN t.total_employees >= 50000 THEN 2
    WHEN t.total_employees >= 5000 THEN 1
    ELSE 0
  END
  FROM technologies t WHERE t.keyword_id = p_keyword_id
$$;

CREATE OR REPLACE FUNCTION public.get_patents_score(p_keyword_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN t.total_patents >= 10000 THEN 2
    WHEN t.total_patents >= 500 THEN 1
    ELSE 0
  END
  FROM technologies t WHERE t.keyword_id = p_keyword_id
$$;

CREATE OR REPLACE FUNCTION public.get_research_score(p_keyword_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN t.total_research_works >= 100000 THEN 2
    WHEN t.total_research_works >= 10000 THEN 1
    ELSE 0
  END
  FROM technologies t WHERE t.keyword_id = p_keyword_id
$$;

CREATE OR REPLACE FUNCTION public.get_visibility_score(p_keyword_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.calculate_market_response_score(p_keyword_id)
$$;

CREATE OR REPLACE FUNCTION public.get_company_count(p_keyword_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(DISTINCT ckm.company_id)::integer
  FROM crunchbase_keyword_mapping ckm WHERE ckm.keyword_id = p_keyword_id
$$;

CREATE OR REPLACE FUNCTION public.get_total_funding(p_keyword_id uuid)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    SUM(DISTINCT cc.total_funding_usd) * (SELECT value::numeric FROM platform_config WHERE key = 'usd_eur_rate'),
    0
  )
  FROM crunchbase_keyword_mapping ckm
  JOIN crunchbase_companies cc ON cc.id = ckm.company_id
  WHERE ckm.keyword_id = p_keyword_id
$$;

CREATE OR REPLACE FUNCTION public.get_maturity_score(p_keyword_id uuid)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_funding numeric; v_patents numeric; v_employees numeric; v_companies numeric;
  v_max_funding numeric; v_max_patents numeric; v_max_employees numeric; v_max_companies numeric;
  v_score numeric;
BEGIN
  SELECT COALESCE(t.total_funding_eur, 0), COALESCE(t.total_patents, 0),
         COALESCE(t.total_employees, 0), COALESCE(t.dealroom_company_count, 0)
  INTO v_funding, v_patents, v_employees, v_companies
  FROM technologies t WHERE t.keyword_id = p_keyword_id;

  IF v_funding IS NULL THEN RETURN 0; END IF;

  SELECT MAX(COALESCE(t.total_funding_eur, 0)), MAX(COALESCE(t.total_patents, 0)),
         MAX(COALESCE(t.total_employees, 0)), MAX(COALESCE(t.dealroom_company_count, 0))
  INTO v_max_funding, v_max_patents, v_max_employees, v_max_companies
  FROM technologies t
  JOIN technology_keywords tk ON t.keyword_id = tk.id
  WHERE tk.is_active = true AND COALESCE(tk.excluded_from_sdv, false) = false;

  v_score := (
    0.30 * (CASE WHEN v_max_funding > 0 THEN ln(v_funding + 1) / ln(v_max_funding + 1) ELSE 0 END) +
    0.25 * (CASE WHEN v_max_patents > 0 THEN ln(v_patents + 1) / ln(v_max_patents + 1) ELSE 0 END) +
    0.25 * (CASE WHEN v_max_employees > 0 THEN ln(v_employees + 1) / ln(v_max_employees + 1) ELSE 0 END) +
    0.20 * (CASE WHEN v_max_companies > 0 THEN ln(v_companies + 1) / ln(v_max_companies + 1) ELSE 0 END)
  ) * 2;

  RETURN ROUND(v_score, 4);
END;
$$;

-- STEP 7: Create technology_intelligence materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS technology_intelligence AS
SELECT
  tk.id AS keyword_id,
  tk.display_name AS name,
  tk.keyword AS slug,
  tk.aliases,
  od.name AS domain_name,
  od.id AS domain_id,
  get_investment_score(tk.id) AS investment_score,
  get_employees_score(tk.id) AS employees_score,
  get_patents_score(tk.id) AS patents_score,
  get_research_score(tk.id) AS research_score,
  get_visibility_score(tk.id) AS visibility_score,
  get_maturity_score(tk.id) AS maturity_score,
  get_company_count(tk.id) AS company_count,
  get_total_funding(tk.id) AS total_funding_eur,
  t.total_patents,
  t.total_employees,
  t.total_research_works,
  t.research_growth_rate,
  t.research_citations,
  t.trl_score,
  t.avg_trl_mentioned,
  t.eu_alignment_score,
  t.document_mention_count,
  t.policy_mention_count,
  t.news_mention_count,
  t.challenge_score,
  t.opportunity_score,
  t.regulatory_status,
  t.growth_rate_pct,
  t.log_composite_score,
  t.recent_news,
  t.key_players,
  t.trend,
  t.sector_tags,
  t.description AS tech_description,
  now() AS refreshed_at
FROM technology_keywords tk
JOIN technologies t ON t.keyword_id = tk.id
LEFT JOIN ontology_concepts oc ON tk.ontology_concept_id = oc.id
LEFT JOIN ontology_domains od ON oc.domain_id = od.id
WHERE tk.is_active = true AND COALESCE(tk.excluded_from_sdv, false) = false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ti_keyword ON technology_intelligence(keyword_id);

-- STEP 8: Create refresh function
CREATE OR REPLACE FUNCTION public.refresh_technology_intelligence()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY technology_intelligence;
END;
$$;

-- STEP 9: Update score_all_technologies to use per-row regulatory/growth
CREATE OR REPLACE FUNCTION public.score_all_technologies()
 RETURNS TABLE(keyword_id uuid, keyword_name text, challenge_score numeric, opportunity_score numeric, quadrant text, company_count bigint, total_funding numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH tech_aggregates AS (
    SELECT 
      tk.id as kw_id, tk.display_name as kw_name,
      COUNT(DISTINCT ckm.company_id) as co_count,
      COALESCE(SUM(cc.total_funding_usd), 0) as funding,
      CASE 
        WHEN COUNT(DISTINCT ckm.company_id) > 200 THEN 'Mainstream'
        WHEN COUNT(DISTINCT ckm.company_id) > 50 THEN 'Early Adoption'
        ELSE 'Emerging'
      END as derived_maturity,
      CASE 
        WHEN tk.display_name ILIKE '%electric%' OR tk.display_name ILIKE '%battery%' THEN 2
        WHEN tk.display_name ILIKE '%autonomous%' OR tk.display_name ILIKE '%connected%' THEN 3
        ELSE 1
      END as policy_alignment,
      COALESCE(t.regulatory_status, 'Some gaps') as reg_status,
      COALESCE(t.growth_rate_pct, 15) as growth_rate
    FROM technology_keywords tk
    LEFT JOIN crunchbase_keyword_mapping ckm ON tk.id = ckm.keyword_id
    LEFT JOIN crunchbase_companies cc ON ckm.company_id = cc.id
    LEFT JOIN technologies t ON t.keyword_id = tk.id
    WHERE tk.is_active = true
    GROUP BY tk.id, tk.display_name, t.regulatory_status, t.growth_rate_pct
  )
  SELECT 
    ta.kw_id, ta.kw_name,
    calculate_technology_challenge_score(
      ta.derived_maturity, ta.reg_status,
      CASE WHEN ta.co_count > 100 THEN 'Adequate' ELSE 'Moderate' END,
      CASE WHEN ta.co_count > 50 THEN 'Standard' ELSE 'Moderate' END,
      CASE WHEN ta.funding > 1000000000 THEN 'Clear' ELSE 'Moderate' END, 0
    ) as challenge,
    calculate_technology_opportunity_score(
      ta.funding, ta.growth_rate, ta.policy_alignment, ta.co_count::INTEGER, 0
    ) as opportunity,
    get_strategic_quadrant(
      calculate_technology_challenge_score(ta.derived_maturity, ta.reg_status,
        CASE WHEN ta.co_count > 100 THEN 'Adequate' ELSE 'Moderate' END,
        CASE WHEN ta.co_count > 50 THEN 'Standard' ELSE 'Moderate' END,
        CASE WHEN ta.funding > 1000000000 THEN 'Clear' ELSE 'Moderate' END, 0),
      calculate_technology_opportunity_score(ta.funding, ta.growth_rate, ta.policy_alignment, ta.co_count::INTEGER, 0)
    ),
    ta.co_count, ta.funding
  FROM tech_aggregates ta
  ORDER BY calculate_technology_opportunity_score(ta.funding, ta.growth_rate, ta.policy_alignment, ta.co_count::INTEGER, 0) DESC;
END;
$function$;