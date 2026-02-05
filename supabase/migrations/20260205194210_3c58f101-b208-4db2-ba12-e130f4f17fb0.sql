-- ============================================================================
-- COMBINED MIGRATION: Hierarchy + Domain Views
-- ============================================================================

-- PREREQUISITE: Create company_keyword_mapping abstraction view
CREATE OR REPLACE VIEW company_keyword_mapping AS
SELECT 
  id,
  company_id,
  keyword_id,
  match_confidence AS relevance_score,
  created_at,
  match_source,
  'crunchbase' AS data_source
FROM crunchbase_keyword_mapping;

-- ============================================================================
-- STEP 1: Add Hierarchy Columns to ontology_concepts
-- ============================================================================
ALTER TABLE ontology_concepts
ADD COLUMN IF NOT EXISTS concept_level TEXT CHECK (concept_level IN ('domain', 'category', 'keyword')),
ADD COLUMN IF NOT EXISTS parent_concept_id INTEGER REFERENCES ontology_concepts(id),
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- ============================================================================
-- STEP 2: Update 3 Core Domains with Challenge-Opportunity Scores
-- ============================================================================

-- Update Electric Vehicle domain
UPDATE ontology_concepts
SET
  concept_level = 'domain',
  parent_concept_id = NULL,
  display_order = 1,
  challenge_score = 1.6,
  opportunity_score = 2.0,
  maturity_stage = 'Early Adoption',
  description = 'Companies developing electric powertrains, charging infrastructure, and energy management systems for vehicles.',
  is_core = TRUE
WHERE name = 'Electric Vehicle' OR name ILIKE '%electric vehicle%';

-- Update Autonomous Vehicle domain
UPDATE ontology_concepts
SET
  concept_level = 'domain',
  parent_concept_id = NULL,
  display_order = 2,
  challenge_score = 0.0,
  opportunity_score = 2.0,
  maturity_stage = 'Emerging',
  description = 'Companies developing self-driving technology, perception systems, and advanced driver assistance.',
  is_core = TRUE
WHERE name ILIKE '%autonomous%' OR name = 'Autonomous Driving';

-- Update Software-Defined Vehicle domain
UPDATE ontology_concepts
SET
  concept_level = 'domain',
  parent_concept_id = NULL,
  display_order = 3,
  challenge_score = 0.0,
  opportunity_score = 2.0,
  maturity_stage = 'Early Adoption',
  description = 'Companies enabling vehicles to be updated, configured, and monetized through software.',
  is_core = TRUE
WHERE name ILIKE '%software%defined%' OR name = 'Software Defined Vehicle';

-- ============================================================================
-- STEP 3: Map Keywords to Domains
-- ============================================================================
DO $$
DECLARE
  ev_domain_id INTEGER;
  av_domain_id INTEGER;
  sdv_domain_id INTEGER;
BEGIN
  SELECT id INTO ev_domain_id FROM ontology_concepts WHERE concept_level = 'domain' AND (name ILIKE '%electric vehicle%') LIMIT 1;
  SELECT id INTO av_domain_id FROM ontology_concepts WHERE concept_level = 'domain' AND (name ILIKE '%autonomous%') LIMIT 1;
  SELECT id INTO sdv_domain_id FROM ontology_concepts WHERE concept_level = 'domain' AND (name ILIKE '%software%defined%') LIMIT 1;

  -- Map EV keywords
  UPDATE technology_keywords
  SET ontology_concept_id = ev_domain_id
  WHERE ev_domain_id IS NOT NULL AND LOWER(keyword) IN (
    'electric vehicle', 'ev', 'battery electric vehicle', 'bev', 'e-vehicle',
    'ev battery', 'battery management systems', 'battery management system',
    'ev charging', 'bidirectional charging', 'storage battery systems',
    'ev motor', 'ev manufacturing', 'ev services', 'smart recharging',
    'charging infrastructure', 'vehicle electrification', 'electric mobility',
    'vehicle to grid', 'v2g'
  );

  -- Map AV keywords
  UPDATE technology_keywords
  SET ontology_concept_id = av_domain_id
  WHERE av_domain_id IS NOT NULL AND LOWER(keyword) IN (
    'autonomous vehicle', 'av', 'self-driving vehicles', 'self-driving car',
    'av radar', 'av simulation', 'av software', 'lidar', 'av camera',
    'av labelling', 'av labeling', 'sensor fusion', 'adas',
    'driver monitoring system', 'hd mapping', 'autonomous driving'
  );

  -- Map SDV keywords
  UPDATE technology_keywords
  SET ontology_concept_id = sdv_domain_id
  WHERE sdv_domain_id IS NOT NULL AND LOWER(keyword) IN (
    'software defined vehicle', 'sdv', 'software-defined vehicle',
    'vehicle as software', 'vas', 'v2x', 'vehicle-to-everything',
    'vehicle to everything', 'fleet management', 'micromobility',
    'micro grid', 'microgrid', 'telematics', 'automotive telematics',
    'vehicle telematics', 'connected car', 'connected vehicle',
    'ota updates', 'over-the-air updates', 'vehicle data platform',
    'automotive cybersecurity', 'automotive software', 'in-vehicle software',
    'vehicle cybersecurity', 'digital twin', 'edge computing', 'cloud computing'
  );

  RAISE NOTICE 'Keywords mapped: EV=%, AV=%, SDV=%', ev_domain_id, av_domain_id, sdv_domain_id;
END $$;

-- ============================================================================
-- STEP 4: Create Automotive Filter View (FIXED for TEXT[] arrays)
-- ============================================================================
CREATE OR REPLACE VIEW automotive_companies AS
SELECT c.*
FROM crunchbase_companies c
WHERE
  -- Exclude airlines and aviation (handle TEXT[] array)
  NOT (
    EXISTS (SELECT 1 FROM unnest(c.industries) ind WHERE LOWER(ind) SIMILAR TO '%(airline|aviation|aircraft|aerospace)%')
    OR LOWER(c.organization_name) SIMILAR TO '%(ryanair|lufthansa|delta air|united airlines|american airlines|southwest airlines)%'
  )
  -- Exclude maritime and shipping
  AND NOT (
    EXISTS (SELECT 1 FROM unnest(c.industries) ind WHERE LOWER(ind) SIMILAR TO '%(maritime|shipping|freight forwarding|ocean freight)%')
    OR LOWER(c.organization_name) SIMILAR TO '%(maersk|hapag|cosco shipping|msc shipping)%'
  )
  -- Exclude generic logistics unless automotive-related
  AND NOT (
    EXISTS (SELECT 1 FROM unnest(c.industries) ind WHERE LOWER(ind) SIMILAR TO '%(logistics|supply chain management)%')
    AND NOT (
      EXISTS (SELECT 1 FROM unnest(c.industries) ind WHERE LOWER(ind) SIMILAR TO '%(automotive|vehicle|electric|autonomous|mobility)%')
      OR LOWER(COALESCE(c.description, '')) SIMILAR TO '%(vehicle|automotive|ev |electric vehicle)%'
    )
  );

-- ============================================================================
-- STEP 5: Create Domain Overview View
-- ============================================================================
CREATE OR REPLACE VIEW domain_overview AS
WITH domain_stats AS (
  SELECT
    oc.id,
    oc.name,
    oc.challenge_score,
    oc.opportunity_score,
    oc.maturity_stage,
    oc.description,
    oc.display_order,
    
    -- Count unique companies via keyword mapping
    COUNT(DISTINCT ckm.company_id) AS company_count,
    
    -- Sum funding from mapped companies
    COALESCE(SUM(DISTINCT ac.total_funding_usd), 0) AS total_funding_usd,
    
    -- Count EU-based companies
    COUNT(DISTINCT CASE 
      WHEN ac.hq_country IN ('Germany', 'France', 'United Kingdom', 'UK', 'Spain', 'Italy', 
                             'Netherlands', 'Sweden', 'Switzerland', 'Austria', 'Belgium', 
                             'Denmark', 'Finland', 'Ireland', 'Norway', 'Poland', 'Portugal',
                             'Czech Republic', 'Hungary', 'Romania', 'Greece')
      THEN ac.id 
    END) AS eu_company_count,
    
    -- Count patents
    COALESCE(SUM(ac.patents_count), 0) AS total_patents,
    
    -- Strategic quadrant calculation
    CASE
      WHEN oc.challenge_score >= 1.5 AND oc.opportunity_score >= 1.5 THEN 'Strategic Investment'
      WHEN oc.challenge_score < 0.5 AND oc.opportunity_score >= 1.5 THEN 'High-Risk High-Reward'
      WHEN oc.challenge_score >= 1.5 AND oc.opportunity_score < 0.5 THEN 'Mature Low-Growth'
      ELSE 'Monitor'
    END AS strategic_quadrant

  FROM ontology_concepts oc
  LEFT JOIN technology_keywords tk ON tk.ontology_concept_id = oc.id
  LEFT JOIN crunchbase_keyword_mapping ckm ON ckm.keyword_id = tk.id
  LEFT JOIN automotive_companies ac ON ac.id = ckm.company_id
  
  WHERE oc.concept_level = 'domain'
  GROUP BY oc.id, oc.name, oc.challenge_score, oc.opportunity_score,
           oc.maturity_stage, oc.description, oc.display_order
)
SELECT * FROM domain_stats
ORDER BY display_order;

-- ============================================================================
-- STEP 6: Create Keyword Overview View (for drill-down)
-- ============================================================================
CREATE OR REPLACE VIEW keyword_overview AS
SELECT
  tk.id AS keyword_id,
  tk.keyword,
  tk.display_name,
  tk.description,
  tk.aliases,
  oc.id AS domain_id,
  oc.name AS domain_name,
  oc.challenge_score AS domain_challenge,
  oc.opportunity_score AS domain_opportunity,
  COUNT(DISTINCT ckm.company_id) AS company_count,
  COALESCE(SUM(DISTINCT ac.total_funding_usd), 0) AS total_funding_usd,
  COALESCE(SUM(ac.patents_count), 0) AS total_patents
FROM technology_keywords tk
LEFT JOIN ontology_concepts oc ON tk.ontology_concept_id = oc.id
LEFT JOIN crunchbase_keyword_mapping ckm ON ckm.keyword_id = tk.id
LEFT JOIN automotive_companies ac ON ac.id = ckm.company_id
WHERE tk.is_active = TRUE
GROUP BY tk.id, tk.keyword, tk.display_name, tk.description, tk.aliases,
         oc.id, oc.name, oc.challenge_score, oc.opportunity_score
ORDER BY oc.display_order NULLS LAST, tk.display_name;