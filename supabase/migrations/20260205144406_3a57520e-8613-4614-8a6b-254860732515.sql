-- ================================================================
-- CHALLENGE-OPPORTUNITY SCORING SCHEMA
-- With Abstraction Layer for Multi-Source Company Data
-- ================================================================

-- ================================================================
-- PART 1: ABSTRACTION LAYER (Company Data Source Independence)
-- ================================================================

-- Create abstraction view for companies (currently wrapping crunchbase, extensible)
CREATE OR REPLACE VIEW public.companies AS
SELECT 
  id,
  organization_name AS name,
  description,
  website,
  hq_country,
  hq_location AS headquarters_location,
  founded_date,
  total_funding_usd,
  -- Convert USD to EUR (approximate rate)
  ROUND(total_funding_usd * 0.92) AS total_funding_eur,
  number_of_employees,
  patents_count,
  industries,
  industry_groups,
  operating_status,
  last_funding_date,
  last_funding_type,
  top_5_investors,
  lead_investors,
  'crunchbase' AS data_source,
  updated_at AS last_updated
FROM crunchbase_companies;

COMMENT ON VIEW public.companies IS 'Abstraction view for company data - currently sourcing from Crunchbase, extensible to other sources';

-- Create abstraction view for company-concept mapping
CREATE OR REPLACE VIEW public.company_concept_mapping AS
SELECT 
  ckm.id,
  ckm.company_id,
  tk.ontology_concept_id AS concept_id,
  ckm.match_confidence AS relevance_score,
  ckm.match_source,
  'crunchbase_keywords' AS data_source,
  ckm.created_at
FROM crunchbase_keyword_mapping ckm
JOIN technology_keywords tk ON ckm.keyword_id = tk.id
WHERE tk.ontology_concept_id IS NOT NULL;

COMMENT ON VIEW public.company_concept_mapping IS 'Abstraction view mapping companies to ontology concepts via keywords';

-- ================================================================
-- PART 2: EXTEND ONTOLOGY_CONCEPTS WITH MARKET METRICS
-- ================================================================

-- Add market metrics columns to ontology_concepts
ALTER TABLE ontology_concepts
ADD COLUMN IF NOT EXISTS market_size_eur BIGINT,
ADD COLUMN IF NOT EXISTS growth_rate_yoy NUMERIC;

COMMENT ON COLUMN ontology_concepts.market_size_eur IS 'Estimated market size in EUR derived from aggregate funding data';
COMMENT ON COLUMN ontology_concepts.growth_rate_yoy IS 'Year-over-year growth rate percentage';

-- ================================================================
-- PART 3: ANALYTICS VIEWS
-- ================================================================

-- Create heatmap matrix view using abstraction layer
CREATE OR REPLACE VIEW public.concept_heatmap AS
SELECT
  oc.id,
  oc.name AS concept,
  oc.acronym,
  oc.description,
  COALESCE(oc.challenge_score, 1)::numeric AS challenge_score,
  COALESCE(oc.opportunity_score, 1)::numeric AS opportunity_score,
  oc.maturity_stage,
  oc.market_size_eur,
  oc.growth_rate_yoy,
  COUNT(DISTINCT ccm.company_id) AS company_count,
  COALESCE(SUM(c.total_funding_eur), 0) AS total_funding_eur,
  COALESCE(SUM(c.patents_count), 0) AS total_patents,
  od.name AS domain_name,
  od.code AS domain_code,
  oc.is_core,
  -- Strategic quadrant with Balanced Growth addition
  CASE
    WHEN oc.challenge_score >= 1.5 AND oc.opportunity_score >= 1.5 THEN 'Strategic Investment'
    WHEN oc.challenge_score < 0.5 AND oc.opportunity_score >= 1.5 THEN 'High-Risk High-Reward'
    WHEN oc.challenge_score >= 1.5 AND oc.opportunity_score < 0.5 THEN 'Mature Low-Growth'
    WHEN oc.challenge_score >= 1.0 AND oc.opportunity_score >= 1.0 THEN 'Balanced Growth'
    ELSE 'Monitor'
  END AS strategic_quadrant,
  -- Investment priority (1-5 scale)
  CASE
    WHEN oc.challenge_score >= 1.5 AND oc.opportunity_score >= 1.5 THEN 5
    WHEN oc.challenge_score < 0.5 AND oc.opportunity_score >= 1.5 THEN 4
    WHEN oc.challenge_score >= 1.0 AND oc.opportunity_score >= 1.0 THEN 3
    WHEN oc.opportunity_score >= 1.0 THEN 2
    ELSE 1
  END AS investment_priority,
  oc.last_scored_at
FROM ontology_concepts oc
LEFT JOIN ontology_domains od ON oc.domain_id = od.id
LEFT JOIN company_concept_mapping ccm ON oc.id = ccm.concept_id
LEFT JOIN companies c ON ccm.company_id = c.id
GROUP BY oc.id, oc.name, oc.acronym, oc.description, oc.challenge_score, oc.opportunity_score, 
         oc.maturity_stage, oc.market_size_eur, oc.growth_rate_yoy, od.name, od.code, oc.is_core, oc.last_scored_at
ORDER BY 
  CASE
    WHEN oc.challenge_score >= 1.5 AND oc.opportunity_score >= 1.5 THEN 5
    WHEN oc.challenge_score < 0.5 AND oc.opportunity_score >= 1.5 THEN 4
    WHEN oc.challenge_score >= 1.0 AND oc.opportunity_score >= 1.0 THEN 3
    WHEN oc.opportunity_score >= 1.0 THEN 2
    ELSE 1
  END DESC, 
  COALESCE(SUM(c.total_funding_eur), 0) DESC;

COMMENT ON VIEW public.concept_heatmap IS 'Challenge-Opportunity Matrix view with strategic quadrants and investment priorities';

-- Create scoring summary view with JSON factors for API/UI
CREATE OR REPLACE VIEW public.concept_scoring_summary AS
SELECT
  oc.id AS concept_id,
  oc.name AS concept_name,
  oc.acronym,
  COALESCE(oc.challenge_score, 1)::numeric AS challenge_score,
  COALESCE(oc.opportunity_score, 1)::numeric AS opportunity_score,
  oc.maturity_stage,
  od.name AS domain_name,
  -- Challenge factors as JSON
  (
    SELECT json_agg(json_build_object(
      'name', factor_name,
      'value', factor_value,
      'contribution', score_contribution,
      'evidence', evidence,
      'source', data_source
    ) ORDER BY score_contribution)
    FROM concept_scoring_factors csf
    WHERE csf.concept_id = oc.id AND csf.factor_type = 'challenge'
  ) AS challenge_factors,
  -- Opportunity factors as JSON
  (
    SELECT json_agg(json_build_object(
      'name', factor_name,
      'value', factor_value,
      'contribution', score_contribution,
      'evidence', evidence,
      'source', data_source
    ) ORDER BY score_contribution DESC)
    FROM concept_scoring_factors csf
    WHERE csf.concept_id = oc.id AND csf.factor_type = 'opportunity'
  ) AS opportunity_factors,
  oc.last_scored_at
FROM ontology_concepts oc
LEFT JOIN ontology_domains od ON oc.domain_id = od.id;

COMMENT ON VIEW public.concept_scoring_summary IS 'JSON summary of all scoring factors per concept for API/UI consumption';

-- Create quadrant distribution view
CREATE OR REPLACE VIEW public.co_matrix_distribution AS
WITH heatmap_data AS (
  SELECT
    CASE
      WHEN COALESCE(oc.challenge_score, 1) >= 1.5 AND COALESCE(oc.opportunity_score, 1) >= 1.5 THEN 'Strategic Investment'
      WHEN COALESCE(oc.challenge_score, 1) < 0.5 AND COALESCE(oc.opportunity_score, 1) >= 1.5 THEN 'High-Risk High-Reward'
      WHEN COALESCE(oc.challenge_score, 1) >= 1.5 AND COALESCE(oc.opportunity_score, 1) < 0.5 THEN 'Mature Low-Growth'
      WHEN COALESCE(oc.challenge_score, 1) >= 1.0 AND COALESCE(oc.opportunity_score, 1) >= 1.0 THEN 'Balanced Growth'
      ELSE 'Monitor'
    END AS strategic_quadrant,
    CASE
      WHEN COALESCE(oc.challenge_score, 1) >= 1.5 AND COALESCE(oc.opportunity_score, 1) >= 1.5 THEN 5
      WHEN COALESCE(oc.challenge_score, 1) < 0.5 AND COALESCE(oc.opportunity_score, 1) >= 1.5 THEN 4
      WHEN COALESCE(oc.challenge_score, 1) >= 1.0 AND COALESCE(oc.opportunity_score, 1) >= 1.0 THEN 3
      WHEN COALESCE(oc.opportunity_score, 1) >= 1.0 THEN 2
      ELSE 1
    END AS investment_priority,
    COALESCE(oc.challenge_score, 1) AS challenge_score,
    COALESCE(oc.opportunity_score, 1) AS opportunity_score,
    COUNT(DISTINCT ccm.company_id) AS company_count,
    COALESCE(SUM(c.total_funding_eur), 0) AS total_funding_eur
  FROM ontology_concepts oc
  LEFT JOIN company_concept_mapping ccm ON oc.id = ccm.concept_id
  LEFT JOIN companies c ON ccm.company_id = c.id
  GROUP BY oc.id, oc.challenge_score, oc.opportunity_score
)
SELECT
  strategic_quadrant,
  COUNT(*) AS concept_count,
  ROUND(AVG(challenge_score), 2) AS avg_challenge,
  ROUND(AVG(opportunity_score), 2) AS avg_opportunity,
  SUM(company_count) AS total_companies,
  ROUND(SUM(total_funding_eur) / 1000000000.0, 1) AS total_funding_billions,
  MAX(investment_priority) AS investment_priority
FROM heatmap_data
GROUP BY strategic_quadrant
ORDER BY MAX(investment_priority) DESC;

COMMENT ON VIEW public.co_matrix_distribution IS 'Summary of concept distribution across C-O Matrix quadrants';

-- Create maturity stage analysis view
CREATE OR REPLACE VIEW public.maturity_stage_analysis AS
SELECT
  COALESCE(oc.maturity_stage, 'Unknown') AS maturity_stage,
  COUNT(DISTINCT oc.id) AS concept_count,
  ROUND(AVG(COALESCE(oc.challenge_score, 1)), 2) AS avg_challenge,
  ROUND(AVG(COALESCE(oc.opportunity_score, 1)), 2) AS avg_opportunity,
  ROUND(AVG(oc.growth_rate_yoy), 1) AS avg_growth_rate,
  COUNT(DISTINCT ccm.company_id) AS total_companies,
  COALESCE(SUM(c.total_funding_eur), 0) AS total_funding_eur
FROM ontology_concepts oc
LEFT JOIN company_concept_mapping ccm ON oc.id = ccm.concept_id
LEFT JOIN companies c ON ccm.company_id = c.id
GROUP BY oc.maturity_stage
ORDER BY
  CASE oc.maturity_stage
    WHEN 'Mainstream' THEN 1
    WHEN 'Early Adoption' THEN 2
    WHEN 'Emerging' THEN 3
    ELSE 4
  END;

COMMENT ON VIEW public.maturity_stage_analysis IS 'C-O scores and market metrics by technology maturity stage';

-- ================================================================
-- PART 4: FUNCTIONS
-- ================================================================

-- Function to get top companies for a concept
CREATE OR REPLACE FUNCTION public.get_concept_top_companies(
  p_concept_id INTEGER,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  company_id uuid,
  company_name TEXT,
  total_funding_eur BIGINT,
  headquarters_location TEXT,
  hq_country TEXT,
  data_source TEXT,
  keywords TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.total_funding_eur::BIGINT,
    c.headquarters_location,
    c.hq_country,
    c.data_source,
    ARRAY_AGG(DISTINCT tk.display_name ORDER BY tk.display_name) AS keywords
  FROM companies c
  JOIN company_concept_mapping ccm ON c.id = ccm.company_id
  JOIN crunchbase_keyword_mapping ckm ON c.id = ckm.company_id
  JOIN technology_keywords tk ON ckm.keyword_id = tk.id
  WHERE ccm.concept_id = p_concept_id
  GROUP BY c.id, c.name, c.total_funding_eur, c.headquarters_location, c.hq_country, c.data_source
  ORDER BY c.total_funding_eur DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_concept_top_companies IS 'Get top companies for a concept by funding, with their keywords and data source';

-- Function to explain a concept score with human-readable breakdown
CREATE OR REPLACE FUNCTION public.explain_concept_score(p_concept_id INTEGER)
RETURNS TABLE (
  concept_name TEXT,
  concept_acronym TEXT,
  challenge_score NUMERIC,
  opportunity_score NUMERIC,
  maturity TEXT,
  quadrant TEXT,
  challenge_explanation TEXT,
  opportunity_explanation TEXT,
  company_count BIGINT,
  total_funding_eur BIGINT,
  top_challenge_barriers TEXT[],
  top_opportunity_drivers TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    oc.name,
    oc.acronym,
    COALESCE(oc.challenge_score, 1)::numeric,
    COALESCE(oc.opportunity_score, 1)::numeric,
    COALESCE(oc.maturity_stage, 'Unknown'),
    CASE
      WHEN COALESCE(oc.challenge_score, 1) >= 1.5 AND COALESCE(oc.opportunity_score, 1) >= 1.5 THEN 'Strategic Investment'
      WHEN COALESCE(oc.challenge_score, 1) < 0.5 AND COALESCE(oc.opportunity_score, 1) >= 1.5 THEN 'High-Risk High-Reward'
      WHEN COALESCE(oc.challenge_score, 1) >= 1.5 AND COALESCE(oc.opportunity_score, 1) < 0.5 THEN 'Mature Low-Growth'
      WHEN COALESCE(oc.challenge_score, 1) >= 1.0 AND COALESCE(oc.opportunity_score, 1) >= 1.0 THEN 'Balanced Growth'
      ELSE 'Monitor'
    END,
    -- Challenge explanation
    CASE
      WHEN COALESCE(oc.challenge_score, 1) >= 1.5 THEN 'Minimal barriers - ready for market entry'
      WHEN COALESCE(oc.challenge_score, 1) >= 1.0 THEN 'Manageable challenges - addressable with moderate effort'
      WHEN COALESCE(oc.challenge_score, 1) >= 0.5 THEN 'Significant barriers - requires substantial investment'
      ELSE 'Severe barriers - requires major breakthroughs or regulatory changes'
    END,
    -- Opportunity explanation
    CASE
      WHEN COALESCE(oc.opportunity_score, 1) >= 1.5 THEN 'High market potential - strong investment case with clear ROI'
      WHEN COALESCE(oc.opportunity_score, 1) >= 1.0 THEN 'Moderate potential - promising for strategic fit'
      WHEN COALESCE(oc.opportunity_score, 1) >= 0.5 THEN 'Limited opportunity - niche market or early-stage'
      ELSE 'Minimal opportunity - weak strategic alignment'
    END,
    -- Company count
    (SELECT COUNT(DISTINCT ccm.company_id) FROM company_concept_mapping ccm WHERE ccm.concept_id = p_concept_id),
    -- Total funding
    (SELECT COALESCE(SUM(c.total_funding_eur), 0)::BIGINT FROM company_concept_mapping ccm JOIN companies c ON ccm.company_id = c.id WHERE ccm.concept_id = p_concept_id),
    -- Top 3 challenge barriers
    ARRAY(
      SELECT csf.factor_name || ': ' || csf.factor_value
      FROM concept_scoring_factors csf
      WHERE csf.concept_id = p_concept_id AND csf.factor_type = 'challenge'
      ORDER BY csf.score_contribution ASC
      LIMIT 3
    ),
    -- Top 3 opportunity drivers
    ARRAY(
      SELECT csf.factor_name || ': ' || csf.factor_value
      FROM concept_scoring_factors csf
      WHERE csf.concept_id = p_concept_id AND csf.factor_type = 'opportunity'
      ORDER BY csf.score_contribution DESC
      LIMIT 3
    )
  FROM ontology_concepts oc
  WHERE oc.id = p_concept_id;
END;
$$;

COMMENT ON FUNCTION public.explain_concept_score IS 'Human-readable explanation of why a concept received its C-O scores with evidence';