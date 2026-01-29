-- Phase 1: Add missing CEI-SPHERE keywords from approved Jan 22 list
INSERT INTO technology_keywords (keyword, display_name, source, description, is_active) VALUES
  ('e-vehicle', 'E-Vehicle', 'cei_sphere', 'Electric Vehicle (alias for EV)', true),
  ('self-driving-vehicles', 'Self-driving vehicles', 'cei_sphere', 'Self-driving/autonomous vehicle technology', true),
  ('autonomous-vehicle', 'Autonomous Vehicle', 'cei_sphere', 'Autonomous/self-driving vehicle systems', true),
  ('ses-solar-energy-system', 'SES - Solar Energy System', 'cei_sphere', 'Solar Energy System/photovoltaic technology', true),
  ('ses-stationary-energy-storage', 'SES - Stationary Energy Storage', 'cei_sphere', 'Stationary Energy Storage systems (non-mobile)', true)
ON CONFLICT (keyword) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = true;

-- Phase 1: Add missing Dealroom keywords from approved list
INSERT INTO technology_keywords (keyword, display_name, source, description, is_active) VALUES
  ('teledriving', 'Teledriving', 'dealroom', 'Remote vehicle operation technology', true),
  ('telematics', 'Telematics', 'dealroom', 'Vehicle telematics and connected car data', true),
  ('sustainability-measurement', 'Sustainability Measurement', 'dealroom', 'Tools and platforms for measuring sustainability metrics', true)
ON CONFLICT (keyword) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = true;

-- Phase 2: Clear all existing bad/polluted mappings to start fresh
UPDATE technology_keywords 
SET dealroom_tags = '{}', 
    dealroom_industries = '{}', 
    dealroom_sub_industries = '{}'
WHERE dealroom_tags IS NOT NULL 
   OR dealroom_industries IS NOT NULL 
   OR dealroom_sub_industries IS NOT NULL;