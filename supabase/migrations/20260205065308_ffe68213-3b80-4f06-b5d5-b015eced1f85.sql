-- ============================================================================
-- Expand Ontology Synonyms to Capture Crunchbase Categories
-- ============================================================================

-- ADAS - Map driver assistance categories
UPDATE ontology_concepts
SET synonyms = array_cat(COALESCE(synonyms, '{}'), ARRAY[
  'Driver Assistance',
  'Automotive Safety',
  'Safety Systems',
  'Collision Avoidance',
  'Lane Keeping',
  'Adaptive Cruise Control'
])
WHERE name = 'ADAS';

-- Software-Defined Vehicle - Map connected/software categories
UPDATE ontology_concepts
SET synonyms = array_cat(COALESCE(synonyms, '{}'), ARRAY[
  'Connected Car',
  'Connected Vehicle',
  'Vehicle Software',
  'Automotive Software',
  'In-Vehicle Software',
  'Vehicle Platform',
  'Automotive Technology'
])
WHERE name = 'Software-Defined Vehicle';

-- OTA Updates - Map update/connectivity categories
UPDATE ontology_concepts
SET synonyms = array_cat(COALESCE(synonyms, '{}'), ARRAY[
  'Vehicle Updates',
  'Firmware Updates',
  'Software Deployment',
  'Remote Vehicle Management',
  'Connected Services'
])
WHERE name = 'OTA Updates';

-- Digital Twin - Map simulation categories
UPDATE ontology_concepts
SET synonyms = array_cat(COALESCE(synonyms, '{}'), ARRAY[
  'Vehicle Simulation',
  'Virtual Testing',
  'Simulation Platform',
  'Virtual Vehicle',
  'Model-Based Development'
])
WHERE name = 'Digital Twin';

-- Fleet Management - Ensure all variants captured
UPDATE ontology_concepts
SET synonyms = array_cat(COALESCE(synonyms, '{}'), ARRAY[
  'Commercial Fleet',
  'Fleet Operations',
  'Fleet Tracking',
  'Fleet Optimization',
  'Vehicle Fleet Management'
])
WHERE name = 'Fleet Management'
AND NOT 'Commercial Fleet' = ANY(COALESCE(synonyms, '{}'));

-- Telematics - Add variants
UPDATE ontology_concepts
SET synonyms = array_cat(COALESCE(synonyms, '{}'), ARRAY[
  'Vehicle Data',
  'Connected Car Data',
  'Vehicle Monitoring',
  'Fleet Telematics'
])
WHERE name = 'Telematics'
AND NOT 'Vehicle Data' = ANY(COALESCE(synonyms, '{}'));

-- Electric Vehicle - Ensure charging infrastructure included
UPDATE ontology_concepts
SET synonyms = array_cat(COALESCE(synonyms, '{}'), ARRAY[
  'Charging Infrastructure',
  'EV Charging',
  'Charging Station',
  'Charge Point',
  'Electric Mobility'
])
WHERE name = 'Electric Vehicle'
AND NOT 'Charging Infrastructure' = ANY(COALESCE(synonyms, '{}'));

-- Vehicle Cybersecurity - Map security categories
UPDATE ontology_concepts
SET synonyms = array_cat(COALESCE(synonyms, '{}'), ARRAY[
  'Automotive Security',
  'Vehicle Security',
  'Connected Car Security',
  'Automotive Cyber Security'
])
WHERE name = 'Vehicle Cybersecurity'
AND NOT 'Automotive Security' = ANY(COALESCE(synonyms, '{}'));