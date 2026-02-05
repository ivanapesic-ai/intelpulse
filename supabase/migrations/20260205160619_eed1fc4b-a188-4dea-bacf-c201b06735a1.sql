
-- PART 1: Link missing keywords to concepts (or create if missing)
-- First, check what keywords exist that should map to unlinked concepts

-- Link existing keywords to OTA Updates (concept 4)
UPDATE technology_keywords 
SET ontology_concept_id = 4 
WHERE display_name IN ('OTA Updates', 'Over The Air', 'FOTA', 'SOTA') 
  AND ontology_concept_id IS NULL;

-- Link existing keywords to Vehicle Cybersecurity (concept 5)
UPDATE technology_keywords 
SET ontology_concept_id = 5 
WHERE display_name IN ('Vehicle Cybersecurity', 'Automotive Cybersecurity', 'Automotive Security', 'V2X Security', 'Connected Car Security') 
  AND ontology_concept_id IS NULL;

-- Link existing keywords to 5G Connectivity (concept 8)
UPDATE technology_keywords 
SET ontology_concept_id = 8 
WHERE display_name IN ('5G Connectivity', '5G', 'C-V2X', 'Cellular V2X', '5G Automotive') 
  AND ontology_concept_id IS NULL;

-- Link existing keywords to Digital Twin (concept 10)
UPDATE technology_keywords 
SET ontology_concept_id = 10 
WHERE display_name IN ('Digital Twin', 'Vehicle Digital Twin', 'Digital Twin Vehicle') 
  AND ontology_concept_id IS NULL;

-- Link existing keywords to Fleet Management (concept 11)
UPDATE technology_keywords 
SET ontology_concept_id = 11 
WHERE display_name IN ('Vehicle Fleet Management', 'Automotive Fleet Management', 'Fleet Management', 'Fleet Telematics') 
  AND ontology_concept_id IS NULL;

-- Link existing keywords to Cloud Infrastructure (concept 13)
UPDATE technology_keywords 
SET ontology_concept_id = 13 
WHERE display_name IN ('Cloud Infrastructure', 'Automotive Cloud', 'Vehicle Cloud', 'Connected Car Cloud') 
  AND ontology_concept_id IS NULL;

-- Link existing keywords to Edge Computing (concept 14)
UPDATE technology_keywords 
SET ontology_concept_id = 14 
WHERE display_name IN ('Edge Computing', 'Vehicle Edge', 'MEC', 'Mobile Edge Computing', 'Edge AI') 
  AND ontology_concept_id IS NULL;

-- PART 2: Add C-O scores for all 14 concepts
-- Using evidence-based scoring from CEI documents

-- ADAS (concept 3) - Mature technology, moderate opportunity
UPDATE ontology_concepts SET 
  challenge_score = 1.5,
  opportunity_score = 1.2,
  maturity_stage = 'Early Adoption',
  market_size_eur = 35000000000,
  growth_rate_yoy = 12.0,
  last_scored_at = NOW()
WHERE id = 3;

-- OTA Updates (concept 4) - Growing, enables SDV
UPDATE ontology_concepts SET 
  challenge_score = 1.2,
  opportunity_score = 1.6,
  maturity_stage = 'Early Adoption',
  market_size_eur = 8000000000,
  growth_rate_yoy = 18.0,
  last_scored_at = NOW()
WHERE id = 4;

-- Vehicle Cybersecurity (concept 5) - Critical enabler, regulatory driven
UPDATE ontology_concepts SET 
  challenge_score = 0.8,
  opportunity_score = 1.8,
  maturity_stage = 'Emerging',
  market_size_eur = 5830000000,
  growth_rate_yoy = 22.0,
  last_scored_at = NOW()
WHERE id = 5;

-- 5G Connectivity (concept 8) - Infrastructure dependent
UPDATE ontology_concepts SET 
  challenge_score = 0.6,
  opportunity_score = 1.4,
  maturity_stage = 'Early Adoption',
  market_size_eur = 12000000000,
  growth_rate_yoy = 35.0,
  last_scored_at = NOW()
WHERE id = 8;

-- Telematics (concept 9) - Mature, stable
UPDATE ontology_concepts SET 
  challenge_score = 1.8,
  opportunity_score = 0.8,
  maturity_stage = 'Mainstream',
  market_size_eur = 28000000000,
  growth_rate_yoy = 8.0,
  last_scored_at = NOW()
WHERE id = 9;

-- Digital Twin (concept 10) - Emerging, high potential
UPDATE ontology_concepts SET 
  challenge_score = 0.4,
  opportunity_score = 1.5,
  maturity_stage = 'Emerging',
  market_size_eur = 15000000000,
  growth_rate_yoy = 25.0,
  last_scored_at = NOW()
WHERE id = 10;

-- Fleet Management (concept 11) - Mature market
UPDATE ontology_concepts SET 
  challenge_score = 1.6,
  opportunity_score = 1.0,
  maturity_stage = 'Mainstream',
  market_size_eur = 22000000000,
  growth_rate_yoy = 10.0,
  last_scored_at = NOW()
WHERE id = 11;

-- Cloud Infrastructure (concept 13) - Enabler technology
UPDATE ontology_concepts SET 
  challenge_score = 1.4,
  opportunity_score = 1.2,
  maturity_stage = 'Mainstream',
  market_size_eur = 45000000000,
  growth_rate_yoy = 15.0,
  last_scored_at = NOW()
WHERE id = 13;

-- Edge Computing (concept 14) - Critical for AV/latency
UPDATE ontology_concepts SET 
  challenge_score = 0.5,
  opportunity_score = 1.7,
  maturity_stage = 'Emerging',
  market_size_eur = 18000000000,
  growth_rate_yoy = 28.0,
  last_scored_at = NOW()
WHERE id = 14;

-- PART 3: Insert scoring factors for newly scored concepts
INSERT INTO concept_scoring_factors (concept_id, factor_type, factor_name, factor_value, score_contribution, evidence, data_source)
VALUES
-- ADAS (3)
(3, 'challenge', 'Technical Maturity', 'Early Adoption', -0.4, 'L2+ systems in production at major OEMs', 'Market Brief 4'),
(3, 'challenge', 'Regulatory', 'Clear', 0.0, 'UN R157 for ALKS, GSR2 mandates', 'CEI Policy'),
(3, 'opportunity', 'Market Size', 'EUR 35B', 0.5, 'Global ADAS market size 2024', 'Market Brief 4'),
(3, 'opportunity', 'Growth Rate', '12% YoY', 0.3, 'Steady adoption curve', 'Crunchbase aggregate'),

-- OTA Updates (4)
(4, 'challenge', 'Technical Maturity', 'Early Adoption', -0.4, 'Tesla leads, others catching up', 'Market Brief 4'),
(4, 'challenge', 'Integration', 'Moderate', -0.2, 'Legacy ECU architecture barriers', 'O-CEI D2.1'),
(4, 'opportunity', 'Strategic Fit', 'High', 0.6, 'Enables SDV business model', 'CEI Tender'),
(4, 'opportunity', 'Market Size', 'EUR 8B', 0.3, 'Growing OTA market', 'Market Brief 4'),

-- Vehicle Cybersecurity (5)
(5, 'challenge', 'Technical Maturity', 'Emerging', -0.6, 'Standards still evolving', 'CEI Energy Presentation'),
(5, 'challenge', 'Skills Gap', 'Severe', -0.4, 'Automotive + security talent shortage', 'Market Brief 5'),
(5, 'opportunity', 'Regulatory', 'Strong mandate', 0.5, 'UN R155/156 compliance required', 'CEI Policy'),
(5, 'opportunity', 'Market Size', 'EUR 5.8B', 0.4, 'EUR 583M specifically in CEI region', 'CEI Energy Presentation'),
(5, 'opportunity', 'Growth Rate', '22% YoY', 0.5, 'Fastest growing segment', 'Market Brief 4'),

-- 5G Connectivity (8)
(8, 'challenge', 'Infrastructure', 'Dependent', -0.6, 'Network rollout varies by region', 'Market Brief 1'),
(8, 'challenge', 'Investment', 'High', -0.4, 'Significant CAPEX required', 'Market Brief 1'),
(8, 'opportunity', 'Growth Rate', '35% YoY', 0.7, 'Fastest infrastructure growth', 'Market Brief 1'),
(8, 'opportunity', 'Strategic Fit', 'High', 0.4, 'Enables V2X and remote operations', 'CEI Tender'),

-- Telematics (9)
(9, 'challenge', 'Technical Maturity', 'Mainstream', 0.0, 'Well-established technology', 'Market Brief 4'),
(9, 'opportunity', 'Market Size', 'EUR 28B', 0.5, 'Mature but stable market', 'Market Brief 4'),
(9, 'opportunity', 'Commoditization', 'High', -0.3, 'Price pressure from competition', 'Crunchbase aggregate'),

-- Digital Twin (10)
(10, 'challenge', 'Technical Maturity', 'Emerging', -0.8, 'Early stage implementations', 'Market Brief 5'),
(10, 'challenge', 'Integration', 'High', -0.4, 'Complex data integration required', 'O-CEI D2.1'),
(10, 'opportunity', 'Strategic Fit', 'High', 0.6, 'Key for simulation and testing', 'CEI Tender'),
(10, 'opportunity', 'Growth Rate', '25% YoY', 0.5, 'Strong growth trajectory', 'Market Brief 5'),

-- Fleet Management (11)
(11, 'challenge', 'Technical Maturity', 'Mainstream', 0.0, 'Mature technology stack', 'Market Brief 4'),
(11, 'opportunity', 'Market Size', 'EUR 22B', 0.5, 'Large established market', 'Market Brief 4'),
(11, 'opportunity', 'Growth Rate', '10% YoY', 0.2, 'Steady but slow growth', 'Crunchbase aggregate'),

-- Cloud Infrastructure (13)
(13, 'challenge', 'Technical Maturity', 'Mainstream', 0.0, 'Hyperscalers dominant', 'Market Brief 1'),
(13, 'challenge', 'Data Sovereignty', 'Moderate', -0.3, 'EU data localization requirements', 'CEI Policy'),
(13, 'opportunity', 'Market Size', 'EUR 45B', 0.5, 'Automotive cloud segment', 'Market Brief 1'),
(13, 'opportunity', 'Strategic Fit', 'Enabler', 0.4, 'Foundation for connected services', 'CEI Tender'),

-- Edge Computing (14)
(14, 'challenge', 'Technical Maturity', 'Emerging', -0.7, 'MEC still evolving', 'Market Brief 1'),
(14, 'challenge', 'Standards', 'Fragmented', -0.4, 'Multiple competing approaches', 'O-CEI D2.1'),
(14, 'opportunity', 'Strategic Fit', 'Critical', 0.6, 'Essential for AV latency requirements', 'CEI Tender'),
(14, 'opportunity', 'Growth Rate', '28% YoY', 0.6, 'Strong momentum', 'Market Brief 1');
