-- MERGE DUPLICATE KEYWORDS INTO PARENT CATEGORIES
-- Fix: Cast text UUIDs to uuid type

-- Step 1: Add aliases from child keywords to parent keywords
-- Electric Vehicle parent: absorb Electric Mobility & Sustainable Mobility aliases
UPDATE technology_keywords 
SET aliases = array_cat(
  COALESCE(aliases, ARRAY[]::text[]),
  ARRAY['Electric Mobility', 'Electromobility', 'e-mobility', 'Sustainable Mobility', 'green-mobility', 'Zero Emission']
),
updated_at = NOW()
WHERE id = 'dccf074f-dae7-460c-b678-aae2670d62f2'::uuid;

-- Autonomous Driving parent: absorb AMR & Self-driving aliases
UPDATE technology_keywords 
SET aliases = array_cat(
  COALESCE(aliases, ARRAY[]::text[]),
  ARRAY['Autonomous Mobile Robots', 'AMR', 'mobile-robots', 'Self-driving vehicles', 'Self-driving']
),
updated_at = NOW()
WHERE id = 'f891626f-69f5-49c2-800c-3959c9f16a08'::uuid;

-- Step 2: Re-map companies from child keywords to parent keywords
-- Move Electric Mobility companies → Electric Vehicle
INSERT INTO crunchbase_keyword_mapping (company_id, keyword_id, match_source, match_confidence, created_at)
SELECT DISTINCT ckm.company_id, 'dccf074f-dae7-460c-b678-aae2670d62f2'::uuid, 'alias_merge', ckm.match_confidence, NOW()
FROM crunchbase_keyword_mapping ckm
WHERE ckm.keyword_id = '9b8c7364-365b-4c5a-a2a8-44500154842c'::uuid
ON CONFLICT DO NOTHING;

-- Move Sustainable Mobility companies → Electric Vehicle
INSERT INTO crunchbase_keyword_mapping (company_id, keyword_id, match_source, match_confidence, created_at)
SELECT DISTINCT ckm.company_id, 'dccf074f-dae7-460c-b678-aae2670d62f2'::uuid, 'alias_merge', ckm.match_confidence, NOW()
FROM crunchbase_keyword_mapping ckm
WHERE ckm.keyword_id = '999e330f-cb0b-4d4a-a471-c2dca4696930'::uuid
ON CONFLICT DO NOTHING;

-- Move Autonomous Mobile Robots companies → Autonomous Driving
INSERT INTO crunchbase_keyword_mapping (company_id, keyword_id, match_source, match_confidence, created_at)
SELECT DISTINCT ckm.company_id, 'f891626f-69f5-49c2-800c-3959c9f16a08'::uuid, 'alias_merge', ckm.match_confidence, NOW()
FROM crunchbase_keyword_mapping ckm
WHERE ckm.keyword_id = '8bfb4269-b5bc-4ac1-8925-e8569f51e89d'::uuid
ON CONFLICT DO NOTHING;

-- Move Self-driving vehicles companies → Autonomous Driving
INSERT INTO crunchbase_keyword_mapping (company_id, keyword_id, match_source, match_confidence, created_at)
SELECT DISTINCT ckm.company_id, 'f891626f-69f5-49c2-800c-3959c9f16a08'::uuid, 'alias_merge', ckm.match_confidence, NOW()
FROM crunchbase_keyword_mapping ckm
WHERE ckm.keyword_id = 'efe6ca8e-a3f6-4100-ac78-322388ba81e8'::uuid
ON CONFLICT DO NOTHING;

-- Step 3: Mark child keywords as excluded from SDV views
UPDATE technology_keywords 
SET excluded_from_sdv = true, updated_at = NOW()
WHERE id IN (
  '9b8c7364-365b-4c5a-a2a8-44500154842c'::uuid,
  '999e330f-cb0b-4d4a-a471-c2dca4696930'::uuid,
  '8bfb4269-b5bc-4ac1-8925-e8569f51e89d'::uuid,
  'efe6ca8e-a3f6-4100-ac78-322388ba81e8'::uuid
);