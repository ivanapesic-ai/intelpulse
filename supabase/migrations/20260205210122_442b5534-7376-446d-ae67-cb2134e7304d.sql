-- =====================================================
-- TAXONOMY CLEANUP: Hub & Pillar Model Implementation
-- =====================================================

-- 1. DEACTIVATE NOISE KEYWORDS (excluded from SDV ecosystem)
UPDATE technology_keywords
SET excluded_from_sdv = true, is_active = false
WHERE keyword IN (
  'fleet management',
  'smart cities', 
  'smart city',
  'logistics',
  'maritime',
  'micromobility',
  'shipping',
  'aviation'
);

-- 2. ADD ALIASES FOR CONSOLIDATION (merge duplicate signals)
-- Electric Vehicle consolidation
UPDATE technology_keywords
SET aliases = array_append(COALESCE(aliases, ARRAY[]::text[]), 'E-Vehicle')
WHERE keyword = 'electric vehicle' 
AND NOT ('E-Vehicle' = ANY(COALESCE(aliases, ARRAY[]::text[])));

UPDATE technology_keywords
SET aliases = array_append(COALESCE(aliases, ARRAY[]::text[]), 'EV Manufacturing')
WHERE keyword = 'electric vehicle'
AND NOT ('EV Manufacturing' = ANY(COALESCE(aliases, ARRAY[]::text[])));

-- Autonomous Vehicle consolidation
UPDATE technology_keywords
SET aliases = array_append(COALESCE(aliases, ARRAY[]::text[]), 'Self-driving')
WHERE keyword = 'autonomous vehicle'
AND NOT ('Self-driving' = ANY(COALESCE(aliases, ARRAY[]::text[])));

UPDATE technology_keywords
SET aliases = array_append(COALESCE(aliases, ARRAY[]::text[]), 'Driverless')
WHERE keyword = 'autonomous vehicle'
AND NOT ('Driverless' = ANY(COALESCE(aliases, ARRAY[]::text[])));

-- SDV consolidation (Vehicle as Software is alias)
UPDATE technology_keywords
SET aliases = array_append(COALESCE(aliases, ARRAY[]::text[]), 'Vehicle as Software')
WHERE keyword = 'software defined vehicle'
AND NOT ('Vehicle as Software' = ANY(COALESCE(aliases, ARRAY[]::text[])));

UPDATE technology_keywords
SET aliases = array_append(COALESCE(aliases, ARRAY[]::text[]), 'VaS')
WHERE keyword = 'software defined vehicle'
AND NOT ('VaS' = ANY(COALESCE(aliases, ARRAY[]::text[])));

-- V2X consolidation
UPDATE technology_keywords
SET aliases = array_append(COALESCE(aliases, ARRAY[]::text[]), 'V2X')
WHERE keyword = 'vehicle to everything'
AND NOT ('V2X' = ANY(COALESCE(aliases, ARRAY[]::text[])));

UPDATE technology_keywords
SET aliases = array_append(COALESCE(aliases, ARRAY[]::text[]), 'Vehicle-to-Everything')
WHERE keyword = 'vehicle to everything'
AND NOT ('Vehicle-to-Everything' = ANY(COALESCE(aliases, ARRAY[]::text[])));

-- 3. DEACTIVATE DUPLICATE KEYWORDS (keep primary, deactivate duplicates)
UPDATE technology_keywords
SET is_active = false, excluded_from_sdv = true
WHERE keyword IN (
  'e-vehicle',
  'ev manufacturing', 
  'self-driving',
  'vehicle as software'
)
AND is_active = true;

-- 4. Ensure core Hub & Pillar keywords are active
UPDATE technology_keywords
SET is_active = true, excluded_from_sdv = false
WHERE keyword IN (
  'software defined vehicle',
  'electric vehicle',
  'battery electric vehicle',
  'autonomous vehicle',
  'autonomous driving',
  'adas',
  'battery management systems',
  'ev charging',
  'ev battery',
  'vehicle to everything',
  'ota updates',
  'automotive cybersecurity',
  'digital twin',
  'telematics',
  'connected car'
);