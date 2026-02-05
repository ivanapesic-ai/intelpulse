-- Task 1: Complete keyword-to-ontology linking (40 unlinked keywords)
-- Mapping based on CEI Ontology Analysis document

-- AV Sensors -> ADAS (concept 3)
UPDATE technology_keywords SET ontology_concept_id = 3 WHERE keyword IN ('av_camera', 'av_radar');

-- AV Software/Simulation/Labeling -> Autonomous Vehicle (concept 2)
UPDATE technology_keywords SET ontology_concept_id = 2 WHERE keyword IN ('av_software', 'av_simulation', 'av_labeling', 'self-driving-vehicles');

-- Autonomous Mobile Robots -> Autonomous Vehicle (concept 2)
UPDATE technology_keywords SET ontology_concept_id = 2 WHERE keyword = 'autonomous_mobile_robots';

-- Battery/Energy systems -> Electric Vehicle (concept 6)
UPDATE technology_keywords SET ontology_concept_id = 6 WHERE keyword IN ('battery_management', 'bidirectional_charging', 'ev_manufacturing', 'ev_motor', 'ev_services');

-- Note: EV Battery was incorrectly mapped to V2X (7), fix it
UPDATE technology_keywords SET ontology_concept_id = 6 WHERE keyword = 'ev_battery';

-- Energy Management -> Electric Vehicle ecosystem (concept 6)
UPDATE technology_keywords SET ontology_concept_id = 6 WHERE keyword IN ('ems', 'micro_grid', 'res', 'residential_energy', 'self_adaptive_energy', 'ses', 'ses-solar-energy-system', 'ses-stationary-energy-storage', 'mesu', 'smart_grid');

-- Smart City/Cities -> MaaS (concept 12 - closest fit for urban mobility)
UPDATE technology_keywords SET ontology_concept_id = 12 WHERE keyword IN ('smart_cities', 'smart_city');

-- Logistics -> Fleet Management (concept 11)
UPDATE technology_keywords SET ontology_concept_id = 11 WHERE keyword IN ('logistics', 'logistics_robots', 'logistics_tech', 'smart_logistics');

-- Maritime -> Fleet Management (concept 11)
UPDATE technology_keywords SET ontology_concept_id = 11 WHERE keyword = 'maritime';

-- Connected/Smart vehicles -> SDV (concept 1)
UPDATE technology_keywords SET ontology_concept_id = 1 WHERE keyword IN ('smart_transportation', 'smart_vehicle', 'vehicle_software');

-- Telematics -> Telematics (concept 9)
UPDATE technology_keywords SET ontology_concept_id = 9 WHERE keyword = 'telematics';

-- V2X related -> V2X (concept 7)
UPDATE technology_keywords SET ontology_concept_id = 7 WHERE keyword IN ('v2x', 'vehicle-to-everything');

-- Task 2: Add industry exclusion columns and C-O scoring enhancement
-- Add excluded_industries array to track which industries should be filtered out
ALTER TABLE technology_keywords ADD COLUMN IF NOT EXISTS excluded_from_sdv boolean DEFAULT false;

-- Mark non-automotive keywords for potential exclusion
UPDATE technology_keywords SET excluded_from_sdv = true 
WHERE keyword IN ('maritime') OR display_name ILIKE '%shipping%' OR display_name ILIKE '%airline%';

-- Task 3: Create industry exclusion function for SDV ecosystem filtering
CREATE OR REPLACE FUNCTION is_sdv_company(company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM crunchbase_companies c
    WHERE c.id = company_id
    AND (
      -- Exclude airlines
      'airlines' = ANY(c.industries) OR
      'aviation' = ANY(c.industries) OR
      'air transport' = ANY(c.industries) OR
      -- Exclude shipping/maritime (non-automotive)
      'shipping' = ANY(c.industries) OR
      'ocean freight' = ANY(c.industries) OR
      'maritime' = ANY(c.industries) OR
      -- Exclude warehousing (unless logistics tech)
      ('warehousing' = ANY(c.industries) AND NOT 'logistics' = ANY(c.industries))
    )
  );
$$;

-- Create enhanced C-O scoring function based on CEI Analysis document
-- Challenge Score: Based on maturity, regulatory complexity, skills gap, integration difficulty, ROI uncertainty
-- Opportunity Score: Based on market size, growth rate, strategic fit, ecosystem readiness

CREATE OR REPLACE FUNCTION calculate_co_scores(tech_keyword_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_investment_score int;
  v_employees_score int;
  v_trl_score int;
  v_patents_score int;
  v_document_count int;
  v_policy_count int;
  v_avg_trl numeric;
  v_funding numeric;
  v_challenge int;
  v_opportunity int;
BEGIN
  -- Get current scores
  SELECT 
    COALESCE(investment_score, 0),
    COALESCE(employees_score, 0),
    COALESCE(trl_score, 0),
    COALESCE(patents_score, 0),
    COALESCE(document_mention_count, 0),
    COALESCE(policy_mention_count, 0),
    COALESCE(avg_trl_mentioned, 5),
    COALESCE(total_funding_eur, 0)
  INTO v_investment_score, v_employees_score, v_trl_score, v_patents_score, 
       v_document_count, v_policy_count, v_avg_trl, v_funding
  FROM technologies
  WHERE keyword_id = tech_keyword_id;

  -- Calculate CHALLENGE score (0 = Severe, 1 = Manageable, 2 = No Major Challenge)
  -- Lower TRL = higher challenge, fewer patents = higher challenge
  -- Formula: Average of (TRL maturity + Patent activity + Market establishment)
  v_challenge := ROUND(
    (
      -- TRL Maturity Factor (high TRL = low challenge = score 2)
      CASE 
        WHEN v_avg_trl >= 7 THEN 2  -- Production ready
        WHEN v_avg_trl >= 5 THEN 1  -- Demonstrated
        ELSE 0                       -- Early stage = severe challenge
      END +
      -- Patent Activity Factor (more patents = more established = lower challenge)
      v_patents_score +
      -- Market Establishment (strong investment = established = lower challenge)
      v_investment_score
    )::numeric / 3
  );

  -- Calculate OPPORTUNITY score (0 = Limited, 1 = Promising, 2 = High)
  -- High funding = high opportunity, high employee growth = high opportunity
  -- Formula: Average of (Market investment + Workforce growth + Document visibility)
  v_opportunity := ROUND(
    (
      -- Investment Signal (high funding = high opportunity)
      v_investment_score +
      -- Workforce Signal (more employees = growth opportunity)
      v_employees_score +
      -- Visibility Signal (more mentions = ecosystem momentum)
      CASE 
        WHEN v_document_count >= 10 THEN 2
        WHEN v_document_count >= 3 THEN 1
        ELSE 0
      END
    )::numeric / 3
  );

  -- Clamp values to 0-2 range
  v_challenge := GREATEST(0, LEAST(2, v_challenge));
  v_opportunity := GREATEST(0, LEAST(2, v_opportunity));

  -- Update technology with C-O scores
  UPDATE technologies
  SET 
    challenge_score = v_challenge,
    opportunity_score = v_opportunity,
    last_updated = now()
  WHERE keyword_id = tech_keyword_id;
END;
$$;

-- Calculate C-O scores for all technologies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT keyword_id FROM technologies WHERE keyword_id IS NOT NULL
  LOOP
    PERFORM calculate_co_scores(r.keyword_id);
  END LOOP;
END $$;