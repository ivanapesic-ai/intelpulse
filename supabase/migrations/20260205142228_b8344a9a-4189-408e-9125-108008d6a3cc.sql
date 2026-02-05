-- Challenge-Opportunity Scoring Engine
-- Implements scoring algorithms from challenge_opportunity_scorer.py

-- Add scoring columns to ontology_concepts if not exist
ALTER TABLE ontology_concepts 
  ADD COLUMN IF NOT EXISTS challenge_score NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS opportunity_score NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS maturity_stage TEXT,
  ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMP WITH TIME ZONE;

-- Create scoring factors table for transparency and audit
CREATE TABLE IF NOT EXISTS concept_scoring_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id INTEGER REFERENCES ontology_concepts(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES technology_keywords(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL CHECK (factor_type IN ('challenge', 'opportunity')),
  factor_name TEXT NOT NULL,
  factor_value TEXT NOT NULL,
  score_contribution NUMERIC(3,2) NOT NULL,
  evidence TEXT,
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_scoring_factors_concept ON concept_scoring_factors(concept_id);
CREATE INDEX IF NOT EXISTS idx_scoring_factors_keyword ON concept_scoring_factors(keyword_id);

-- Calculate Challenge Score function
-- Implements: maturity (-0.8), regulatory (-0.6), skills (-0.4), integration (-0.4), ROI (-0.4)
CREATE OR REPLACE FUNCTION calculate_technology_challenge_score(
  p_maturity TEXT DEFAULT 'Early Adoption',
  p_regulatory TEXT DEFAULT 'Some gaps', 
  p_skills_gap TEXT DEFAULT 'Moderate',
  p_integration TEXT DEFAULT 'Moderate',
  p_roi_clarity TEXT DEFAULT 'Moderate',
  p_additional_impact NUMERIC DEFAULT 0
) RETURNS NUMERIC AS $$
DECLARE
  base_score NUMERIC := 2.0;
  maturity_impact NUMERIC;
  regulatory_impact NUMERIC;
  skills_impact NUMERIC;
  integration_impact NUMERIC;
  roi_impact NUMERIC;
BEGIN
  -- Technical maturity (-0 to -0.8)
  maturity_impact := CASE 
    WHEN p_maturity = 'Emerging' THEN -0.8
    WHEN p_maturity = 'Early Adoption' THEN -0.4
    ELSE 0.0 -- Mainstream
  END;
  
  -- Regulatory clarity (-0 to -0.6)
  regulatory_impact := CASE
    WHEN p_regulatory = 'Major gaps' THEN -0.6
    WHEN p_regulatory = 'Some gaps' THEN -0.3
    ELSE 0.0 -- Clear
  END;
  
  -- Skills availability (-0 to -0.4)
  skills_impact := CASE
    WHEN p_skills_gap = 'Severe' THEN -0.4
    WHEN p_skills_gap = 'Moderate' THEN -0.2
    ELSE 0.0 -- Adequate
  END;
  
  -- Integration complexity (-0 to -0.4)
  integration_impact := CASE
    WHEN p_integration = 'High' THEN -0.4
    WHEN p_integration = 'Moderate' THEN -0.2
    ELSE 0.0 -- Standard
  END;
  
  -- ROI clarity (-0 to -0.4)
  roi_impact := CASE
    WHEN p_roi_clarity = 'Unclear' THEN -0.4
    WHEN p_roi_clarity = 'Moderate' THEN -0.2
    ELSE 0.0 -- Clear
  END;
  
  base_score := base_score + maturity_impact + regulatory_impact + skills_impact 
                + integration_impact + roi_impact + p_additional_impact;
  
  -- Clamp to 0-2 range
  RETURN GREATEST(0.0, LEAST(2.0, ROUND(base_score, 1)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate Opportunity Score function  
-- Implements: market_size (+0.7), growth (+0.7), strategic (+0.6), ecosystem (+0.5)
CREATE OR REPLACE FUNCTION calculate_technology_opportunity_score(
  p_market_size_eur NUMERIC DEFAULT 0,
  p_growth_rate_yoy NUMERIC DEFAULT 10,
  p_strategic_alignment_count INTEGER DEFAULT 1,
  p_company_count INTEGER DEFAULT 0,
  p_additional_impact NUMERIC DEFAULT 0
) RETURNS NUMERIC AS $$
DECLARE
  base_score NUMERIC := 0.0;
  market_impact NUMERIC;
  growth_impact NUMERIC;
  strategic_impact NUMERIC;
  ecosystem_impact NUMERIC;
BEGIN
  -- Market size (+0 to +0.7)
  market_impact := CASE
    WHEN p_market_size_eur > 50000000000 THEN 0.7  -- >€50B
    WHEN p_market_size_eur > 10000000000 THEN 0.5  -- >€10B
    WHEN p_market_size_eur > 1000000000 THEN 0.3   -- >€1B
    ELSE 0.1
  END;
  
  -- Growth rate (+0 to +0.7)
  growth_impact := CASE
    WHEN p_growth_rate_yoy > 20 THEN 0.7
    WHEN p_growth_rate_yoy > 10 THEN 0.5
    WHEN p_growth_rate_yoy > 5 THEN 0.3
    ELSE 0.1
  END;
  
  -- Strategic alignment (+0 to +0.6)
  strategic_impact := CASE
    WHEN p_strategic_alignment_count >= 3 THEN 0.6
    WHEN p_strategic_alignment_count = 2 THEN 0.4
    WHEN p_strategic_alignment_count = 1 THEN 0.2
    ELSE 0.0
  END;
  
  -- Ecosystem readiness (+0 to +0.5)
  ecosystem_impact := CASE
    WHEN p_company_count > 200 THEN 0.5
    WHEN p_company_count > 50 THEN 0.3
    WHEN p_company_count > 10 THEN 0.1
    ELSE 0.0
  END;
  
  base_score := market_impact + growth_impact + strategic_impact + ecosystem_impact + p_additional_impact;
  
  -- Clamp to 0-2 range
  RETURN GREATEST(0.0, LEAST(2.0, ROUND(base_score, 1)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get strategic quadrant based on scores
CREATE OR REPLACE FUNCTION get_strategic_quadrant(
  p_challenge_score NUMERIC,
  p_opportunity_score NUMERIC
) RETURNS TEXT AS $$
BEGIN
  -- High challenge (>1.5) = fewer barriers, Low challenge (<0.5) = major barriers
  -- High opportunity (>1.5) = strong potential, Low opportunity (<0.5) = limited potential
  IF p_challenge_score >= 1.5 AND p_opportunity_score >= 1.5 THEN
    RETURN 'Strategic Investment';  -- Few barriers + High opportunity
  ELSIF p_challenge_score < 0.5 AND p_opportunity_score >= 1.5 THEN
    RETURN 'High-Risk High-Reward'; -- Major barriers + High opportunity
  ELSIF p_challenge_score >= 1.5 AND p_opportunity_score < 0.5 THEN
    RETURN 'Mature Low-Growth';     -- Few barriers + Low opportunity
  ELSE
    RETURN 'Monitor';               -- Various combinations
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to score all technologies using aggregated Crunchbase data
CREATE OR REPLACE FUNCTION score_all_technologies() 
RETURNS TABLE (
  keyword_id UUID,
  keyword_name TEXT,
  challenge_score NUMERIC,
  opportunity_score NUMERIC,
  quadrant TEXT,
  company_count BIGINT,
  total_funding NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH tech_aggregates AS (
    SELECT 
      tk.id as kw_id,
      tk.display_name as kw_name,
      COUNT(DISTINCT ckm.company_id) as co_count,
      COALESCE(SUM(cc.total_funding_usd), 0) as funding,
      -- Derive maturity from TRL or company count
      CASE 
        WHEN COUNT(DISTINCT ckm.company_id) > 200 THEN 'Mainstream'
        WHEN COUNT(DISTINCT ckm.company_id) > 50 THEN 'Early Adoption'
        ELSE 'Emerging'
      END as derived_maturity,
      -- Policy alignment count (simplified)
      CASE 
        WHEN tk.display_name ILIKE '%electric%' OR tk.display_name ILIKE '%battery%' THEN 2
        WHEN tk.display_name ILIKE '%autonomous%' OR tk.display_name ILIKE '%connected%' THEN 3
        ELSE 1
      END as policy_alignment
    FROM technology_keywords tk
    LEFT JOIN crunchbase_keyword_mapping ckm ON tk.id = ckm.keyword_id
    LEFT JOIN crunchbase_companies cc ON ckm.company_id = cc.id
    WHERE tk.is_active = true
    GROUP BY tk.id, tk.display_name
  )
  SELECT 
    ta.kw_id,
    ta.kw_name,
    calculate_technology_challenge_score(
      ta.derived_maturity,
      'Some gaps',  -- Default regulatory
      CASE WHEN ta.co_count > 100 THEN 'Adequate' ELSE 'Moderate' END,
      CASE WHEN ta.co_count > 50 THEN 'Standard' ELSE 'Moderate' END,
      CASE WHEN ta.funding > 1000000000 THEN 'Clear' ELSE 'Moderate' END,
      0
    ) as challenge,
    calculate_technology_opportunity_score(
      ta.funding,
      15, -- Default growth rate
      ta.policy_alignment,
      ta.co_count::INTEGER,
      0
    ) as opportunity,
    get_strategic_quadrant(
      calculate_technology_challenge_score(ta.derived_maturity, 'Some gaps', 
        CASE WHEN ta.co_count > 100 THEN 'Adequate' ELSE 'Moderate' END,
        CASE WHEN ta.co_count > 50 THEN 'Standard' ELSE 'Moderate' END,
        CASE WHEN ta.funding > 1000000000 THEN 'Clear' ELSE 'Moderate' END, 0),
      calculate_technology_opportunity_score(ta.funding, 15, ta.policy_alignment, ta.co_count::INTEGER, 0)
    ),
    ta.co_count,
    ta.funding
  FROM tech_aggregates ta
  ORDER BY calculate_technology_opportunity_score(ta.funding, 15, ta.policy_alignment, ta.co_count::INTEGER, 0) DESC;
END;
$$ LANGUAGE plpgsql;

-- Apply scores to technologies table
CREATE OR REPLACE FUNCTION apply_co_scores_to_technologies()
RETURNS TABLE (
  keywords_updated INTEGER,
  avg_challenge NUMERIC,
  avg_opportunity NUMERIC
) AS $$
DECLARE
  updated_count INTEGER := 0;
  avg_c NUMERIC;
  avg_o NUMERIC;
BEGIN
  -- Update technologies table with calculated scores
  UPDATE technologies t
  SET 
    challenge_score = s.challenge_score,
    opportunity_score = s.opportunity_score,
    last_updated = now()
  FROM score_all_technologies() s
  WHERE t.keyword_id = s.keyword_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Calculate averages
  SELECT 
    AVG(challenge_score),
    AVG(opportunity_score)
  INTO avg_c, avg_o
  FROM technologies
  WHERE challenge_score IS NOT NULL;
  
  RETURN QUERY SELECT updated_count, ROUND(avg_c, 2), ROUND(avg_o, 2);
END;
$$ LANGUAGE plpgsql;