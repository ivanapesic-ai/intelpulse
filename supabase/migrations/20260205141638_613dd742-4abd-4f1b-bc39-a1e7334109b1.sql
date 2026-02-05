-- ================================================================
-- AUTOMOTIVE-ONLY FILTERING: Clean SDV Ecosystem
-- ================================================================
-- Removes broad categories that catch airlines, shipping, logistics
-- Only maps keywords that are STRICTLY automotive/vehicle-focused
-- ================================================================

-- FIRST: Reset all concept mappings to start clean
UPDATE technology_keywords
SET ontology_concept_id = NULL;

-- ================================================================
-- STRICT AUTOMOTIVE-ONLY MAPPINGS
-- ================================================================

-- Software-Defined Vehicle (Concept ID 1) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 1
WHERE display_name IN (
  'Software Defined Vehicle',
  'Vehicle as Software',
  'Connected Car',
  'Connected Vehicle',
  'Automotive Software',
  'In-Vehicle Software'
)
AND ontology_concept_id IS NULL;

-- Autonomous Vehicle (Concept ID 2) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 2
WHERE display_name IN (
  'Autonomous Vehicle',
  'Autonomous Driving',
  'Self-Driving Vehicle',
  'Self-Driving Car',
  'Driverless Vehicle',
  'Self-driving vehicles',
  'AV Software',
  'AV Simulation',
  'Teledriving'
)
AND ontology_concept_id IS NULL;

-- ADAS (Concept ID 3) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 3
WHERE display_name IN (
  'ADAS',
  'Advanced Driver Assistance',
  'Driver Assistance',
  'Driver Monitoring System',
  'Vehicle Safety',
  'AV Camera',
  'AV Radar',
  'AV Labeling',
  'LiDAR',
  'Sensor Fusion'
)
AND ontology_concept_id IS NULL;

-- OTA Updates (Concept ID 4) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 4
WHERE display_name IN (
  'Over-the-Air Updates',
  'OTA Updates',
  'OTA Software'
)
AND ontology_concept_id IS NULL;

-- Vehicle Cybersecurity (Concept ID 5) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 5
WHERE display_name IN (
  'Automotive Cybersecurity',
  'Vehicle Cybersecurity',
  'Automotive Security'
)
AND ontology_concept_id IS NULL;

-- Electric Vehicle (Concept ID 6) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 6
WHERE display_name IN (
  'Electric Vehicle',
  'Battery Electric Vehicle',
  'BEV',
  'E-Vehicle',
  'Electric Mobility',
  'EV Charging',
  'Charging Infrastructure',
  'EV Battery',
  'Battery Management System',
  'Battery Management Systems',
  'BMS',
  'Vehicle Electrification',
  'Electric Powertrain',
  'EV Motor',
  'EV Manufacturing',
  'Smart Recharging',
  'Bidirectional Charging',
  'Storage Battery Systems'
)
AND ontology_concept_id IS NULL;

-- V2X (Concept ID 7) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 7
WHERE display_name IN (
  'Vehicle to Everything',
  'V2X',
  'V2V',
  'V2I',
  'Vehicle to Grid',
  'V2G',
  'Vehicle to Vehicle',
  'Vehicle to Infrastructure'
)
AND ontology_concept_id IS NULL;

-- 5G Connectivity (Concept ID 8) - STRICT (only automotive-related)
UPDATE technology_keywords
SET ontology_concept_id = 8
WHERE display_name IN (
  'Cellular V2X',
  'C-V2X'
)
AND ontology_concept_id IS NULL;

-- Telematics (Concept ID 9) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 9
WHERE display_name IN (
  'Telematics',
  'Vehicle Telematics',
  'Automotive Telematics',
  'Vehicle Data',
  'Vehicle Monitoring',
  'Fleet Telematics'
)
AND ontology_concept_id IS NULL;

-- Digital Twin (Concept ID 10) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 10
WHERE display_name IN (
  'Vehicle Digital Twin',
  'Vehicle Simulation',
  'AV Simulation'
)
AND ontology_concept_id IS NULL;

-- Fleet Management (Concept ID 11) - STRICT AUTOMOTIVE ONLY
UPDATE technology_keywords
SET ontology_concept_id = 11
WHERE display_name IN (
  'Vehicle Fleet Management',
  'Automotive Fleet Management',
  'Fleet Telematics'
)
AND ontology_concept_id IS NULL;

-- MaaS (Concept ID 12) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 12
WHERE display_name IN (
  'Mobility as a Service',
  'MaaS',
  'Shared Mobility',
  'Micromobility',
  'Sustainable Mobility'
)
AND ontology_concept_id IS NULL;

-- Cloud Infrastructure (Concept ID 13) - STRICT (automotive cloud only)
UPDATE technology_keywords
SET ontology_concept_id = 13
WHERE display_name IN (
  'Vehicle Cloud',
  'Automotive Cloud'
)
AND ontology_concept_id IS NULL;

-- Edge Computing (Concept ID 14) - STRICT
UPDATE technology_keywords
SET ontology_concept_id = 14
WHERE display_name IN (
  'In-Vehicle Computing',
  'Vehicle Edge'
)
AND ontology_concept_id IS NULL;

-- ================================================================
-- INDUSTRY EXCLUSION VIEW: Filter out non-automotive companies
-- ================================================================

-- Create function to check if a company is SDV-relevant
CREATE OR REPLACE FUNCTION is_sdv_company(company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM crunchbase_keyword_mapping ckm
    JOIN technology_keywords tk ON ckm.keyword_id = tk.id
    WHERE ckm.company_id = company_id
      AND tk.ontology_concept_id IS NOT NULL
  )
  AND NOT EXISTS (
    SELECT 1
    FROM crunchbase_companies c
    WHERE c.id = company_id
    AND (
      EXISTS (SELECT 1 FROM unnest(c.industries) AS i WHERE i ILIKE '%airline%')
      OR EXISTS (SELECT 1 FROM unnest(c.industries) AS i WHERE i ILIKE '%aviation%')
      OR EXISTS (SELECT 1 FROM unnest(c.industries) AS i WHERE i ILIKE '%maritime%')
      OR EXISTS (SELECT 1 FROM unnest(c.industries) AS i WHERE i ILIKE '%shipping%')
      OR EXISTS (SELECT 1 FROM unnest(c.industries) AS i WHERE i ILIKE '%freight%')
      OR EXISTS (SELECT 1 FROM unnest(c.industries) AS i WHERE i ILIKE '%air transport%')
      OR EXISTS (SELECT 1 FROM unnest(c.industries) AS i WHERE i ILIKE '%ocean%')
      OR EXISTS (SELECT 1 FROM unnest(c.industries) AS i WHERE i ILIKE '%rail%')
    )
  );
$$;

-- ================================================================
-- SDV ECOSYSTEM VIEW: Clean company→concept mapping
-- ================================================================

DROP VIEW IF EXISTS sdv_ecosystem_companies;

CREATE VIEW sdv_ecosystem_companies AS
SELECT DISTINCT
  c.id AS company_id,
  c.organization_name AS company_name,
  c.description,
  c.hq_country,
  c.total_funding_usd,
  c.number_of_employees,
  c.founded_date,
  c.industries,
  oc.id AS concept_id,
  oc.name AS concept_name,
  od.id AS domain_id,
  od.name AS domain_name,
  oc.is_core
FROM crunchbase_companies c
JOIN crunchbase_keyword_mapping ckm ON c.id = ckm.company_id
JOIN technology_keywords tk ON ckm.keyword_id = tk.id
JOIN ontology_concepts oc ON tk.ontology_concept_id = oc.id
JOIN ontology_domains od ON oc.domain_id = od.id
WHERE tk.ontology_concept_id IS NOT NULL
  AND is_sdv_company(c.id) = true;

-- ================================================================
-- COMBINED TECH GRAPH: Only SDV-relevant technologies
-- ================================================================

DROP VIEW IF EXISTS combined_technology_graph;

CREATE VIEW combined_technology_graph AS
SELECT
  tk.id AS keyword_id,
  tk.display_name AS keyword_name,
  oc.id AS concept_id,
  oc.name AS concept_name,
  od.name AS domain_name,
  oc.is_core,
  COUNT(DISTINCT ckm.company_id) FILTER (WHERE is_sdv_company(ckm.company_id)) AS sdv_company_count,
  COALESCE(SUM(c.total_funding_usd) FILTER (WHERE is_sdv_company(ckm.company_id)), 0) AS total_funding_usd,
  COALESCE(t.total_patents, 0) AS total_patents,
  COALESCE(t.composite_score, 0) AS composite_score
FROM technology_keywords tk
JOIN ontology_concepts oc ON tk.ontology_concept_id = oc.id
JOIN ontology_domains od ON oc.domain_id = od.id
LEFT JOIN crunchbase_keyword_mapping ckm ON tk.id = ckm.keyword_id
LEFT JOIN crunchbase_companies c ON ckm.company_id = c.id
LEFT JOIN technologies t ON tk.id = t.keyword_id
WHERE tk.ontology_concept_id IS NOT NULL
  AND tk.is_active = true
GROUP BY tk.id, tk.display_name, oc.id, oc.name, od.name, oc.is_core, t.total_patents, t.composite_score;

-- ================================================================
-- Mark broad keywords as excluded from SDV
-- ================================================================

UPDATE technology_keywords
SET excluded_from_sdv = true
WHERE display_name IN (
  'Fleet Management',
  'Logistics',
  'Logistics Tech',
  'Supply Chain',
  'Supply Chain Management',
  'Maritime',
  'Smart Cities',
  'Smart City',
  'Cloud Infrastructure',
  'Cloud Computing',
  'Edge Computing',
  'Digital Twin',
  'Smart Grid',
  'Renewable Energy',
  'Energy Storage'
)
AND (excluded_from_sdv IS NULL OR excluded_from_sdv = false);