-- ============================================================================
-- SDV-FOCUSED ONTOLOGY FOR ML-SDV COMPETITIVE INTELLIGENCE MVP
-- ============================================================================

-- Step 1: Create ontology tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS ontology_domains (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ontology_concepts (
  id SERIAL PRIMARY KEY,
  domain_id INT REFERENCES ontology_domains(id) ON DELETE CASCADE,
  name TEXT UNIQUE NOT NULL,
  acronym TEXT,
  synonyms TEXT[] DEFAULT '{}',
  description TEXT,
  is_core BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ontology_relationships (
  id SERIAL PRIMARY KEY,
  concept_from_id INT REFERENCES ontology_concepts(id) ON DELETE CASCADE,
  concept_to_id INT REFERENCES ontology_concepts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength DECIMAL DEFAULT 1.0 CHECK (strength >= 0.0 AND strength <= 1.0),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_relationship UNIQUE(concept_from_id, concept_to_id, relationship_type),
  CONSTRAINT no_self_reference CHECK(concept_from_id != concept_to_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ontology_concepts_domain ON ontology_concepts(domain_id);
CREATE INDEX IF NOT EXISTS idx_ontology_relationships_from ON ontology_relationships(concept_from_id);
CREATE INDEX IF NOT EXISTS idx_ontology_relationships_to ON ontology_relationships(concept_to_id);
CREATE INDEX IF NOT EXISTS idx_ontology_concepts_synonyms ON ontology_concepts USING GIN(synonyms);

-- Add ontology_concept_id to technology_keywords for linking
ALTER TABLE technology_keywords ADD COLUMN IF NOT EXISTS ontology_concept_id INT REFERENCES ontology_concepts(id);

-- Enable RLS
ALTER TABLE ontology_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for authenticated, full access for superadmin)
CREATE POLICY "Anyone can view ontology domains" ON ontology_domains FOR SELECT USING (true);
CREATE POLICY "Anyone can view ontology concepts" ON ontology_concepts FOR SELECT USING (true);
CREATE POLICY "Anyone can view ontology relationships" ON ontology_relationships FOR SELECT USING (true);

CREATE POLICY "Superadmins manage domains" ON ontology_domains FOR ALL TO authenticated USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));
CREATE POLICY "Superadmins manage concepts" ON ontology_concepts FOR ALL TO authenticated USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));
CREATE POLICY "Superadmins manage relationships" ON ontology_relationships FOR ALL TO authenticated USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));

-- Step 2: Insert domains
INSERT INTO ontology_domains (code, name, description) VALUES
('SDV', 'Software-Defined Vehicle Ecosystem', 'Technologies directly enabling or using software-defined vehicles'),
('ENABLING', 'Enabling Technologies', 'Infrastructure and platform technologies that SDV depends on')
ON CONFLICT (code) DO NOTHING;

-- Step 3: Insert concepts
INSERT INTO ontology_concepts (domain_id, name, acronym, synonyms, description, is_core) VALUES
((SELECT id FROM ontology_domains WHERE code='SDV'),
 'Software-Defined Vehicle', 'SDV',
 ARRAY['Software Defined Vehicle', 'SDV', 'Vehicle as Software', 'software-defined vehicle', 'software defined vehicle', 'vehicle software platform'],
 'Vehicles where features, functions, and capabilities are defined and updated through software rather than hardware',
 TRUE),

((SELECT id FROM ontology_domains WHERE code='SDV'),
 'Autonomous Vehicle', 'AV',
 ARRAY['Autonomous Driving', 'Self-Driving Vehicle', 'Driverless Vehicle', 'autonomous car', 'self-driving', 'autonomous vehicle', 'autonomous driving'],
 'Vehicles capable of operating without human driver - a prime use case for SDV architecture',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='SDV'),
 'ADAS', 'ADAS',
 ARRAY['Advanced Driver Assistance Systems', 'Driver Assistance', 'ADAS', 'driver assistance systems'],
 'Driver assistance features that are software-defined and updatable in SDV',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='SDV'),
 'OTA Updates', 'OTA',
 ARRAY['Over-the-Air Updates', 'OTA', 'Remote Updates', 'Software Updates', 'over the air', 'firmware update'],
 'Core capability of SDV - ability to update vehicle software remotely',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='SDV'),
 'Vehicle Cybersecurity', NULL,
 ARRAY['Automotive Cybersecurity', 'Vehicle Security', 'Automotive Security', 'vehicle cybersecurity', 'automotive security'],
 'Critical for SDV as software-defined systems have expanded attack surface',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='SDV'),
 'Electric Vehicle', 'EV',
 ARRAY['EV', 'BEV', 'Battery Electric Vehicle', 'Electric Car', 'electric vehicle', 'battery electric', 'e-vehicle'],
 'Electric vehicles are natural platforms for SDV architecture due to electronic architecture',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='ENABLING'),
 'V2X', 'V2X',
 ARRAY['Vehicle to Everything', 'V2V', 'V2I', 'V2G', 'Vehicle to Vehicle', 'Vehicle to Infrastructure', 'v2x', 'v2v', 'v2i'],
 'Communication systems enabling SDV to interact with environment and grid',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='ENABLING'),
 '5G Connectivity', '5G',
 ARRAY['5G', '6G', '5G Network', 'Mobile Connectivity', '5g connectivity', '6g', 'cellular v2x'],
 'High-speed connectivity enabling real-time SDV updates and V2X communication',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='ENABLING'),
 'Telematics', NULL,
 ARRAY['Vehicle Telematics', 'Automotive Telematics', 'Connected Car Data', 'telematics', 'telemetry'],
 'Data collection systems that feed SDV decision-making and updates',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='ENABLING'),
 'Digital Twin', 'DT',
 ARRAY['Digital Twin', 'Vehicle Digital Twin', 'Virtual Twin', 'digital twin', 'virtual model'],
 'Virtual representation of vehicles used for SDV testing and optimization',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='SDV'),
 'Fleet Management', NULL,
 ARRAY['Fleet Software', 'Fleet Operations', 'Fleet Optimization', 'fleet management', 'fleet software'],
 'SDV architecture enables centralized fleet management and updates',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='SDV'),
 'MaaS', 'MaaS',
 ARRAY['Mobility as a Service', 'Mobility Service', 'MaaS', 'mobility as a service', 'shared mobility'],
 'Service models enabled by software-defined fleet vehicles',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='ENABLING'),
 'Cloud Infrastructure', NULL,
 ARRAY['Cloud Platform', 'Cloud Computing', 'Vehicle Cloud', 'cloud infrastructure', 'cloud platform'],
 'Backend infrastructure supporting SDV updates, data processing, and AI',
 FALSE),

((SELECT id FROM ontology_domains WHERE code='ENABLING'),
 'Edge Computing', NULL,
 ARRAY['Edge Processing', 'Vehicle Edge', 'Distributed Computing', 'edge computing', 'edge processing'],
 'Local processing capability in SDV for real-time decisions',
 FALSE)

ON CONFLICT (name) DO NOTHING;

-- Step 4: Insert relationships
INSERT INTO ontology_relationships (concept_from_id, concept_to_id, relationship_type, strength, description) VALUES

-- SDV REQUIRES
((SELECT id FROM ontology_concepts WHERE name='Software-Defined Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='OTA Updates'),
 'requires', 1.0, 'SDV fundamentally requires over-the-air update capability'),

((SELECT id FROM ontology_concepts WHERE name='Software-Defined Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='Vehicle Cybersecurity'),
 'requires', 0.95, 'Software-defined systems must have strong cybersecurity'),

((SELECT id FROM ontology_concepts WHERE name='Software-Defined Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='Cloud Infrastructure'),
 'requires', 0.9, 'SDV requires cloud backend for updates and data processing'),

((SELECT id FROM ontology_concepts WHERE name='Software-Defined Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='Telematics'),
 'requires', 0.85, 'SDV needs telemetry data for optimization and updates'),

-- SDV ENABLES
((SELECT id FROM ontology_concepts WHERE name='Software-Defined Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='Autonomous Vehicle'),
 'enables', 0.95, 'SDV architecture enables autonomous driving capabilities through software'),

((SELECT id FROM ontology_concepts WHERE name='Software-Defined Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='Fleet Management'),
 'enables', 0.9, 'SDV enables centralized fleet management and updates'),

((SELECT id FROM ontology_concepts WHERE name='Software-Defined Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='MaaS'),
 'enables', 0.8, 'SDV architecture enables flexible mobility services'),

-- AV RELATIONSHIPS
((SELECT id FROM ontology_concepts WHERE name='Autonomous Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='ADAS'),
 'requires', 0.9, 'Autonomous vehicles build upon ADAS foundations'),

((SELECT id FROM ontology_concepts WHERE name='Autonomous Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='V2X'),
 'uses', 0.75, 'Autonomous vehicles use V2X for enhanced awareness'),

((SELECT id FROM ontology_concepts WHERE name='Autonomous Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='Digital Twin'),
 'uses', 0.8, 'Autonomous systems are tested and validated via digital twins'),

-- EV AS PLATFORM
((SELECT id FROM ontology_concepts WHERE name='Electric Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='Software-Defined Vehicle'),
 'enables', 0.85, 'EVs provide ideal electronic architecture for SDV'),

((SELECT id FROM ontology_concepts WHERE name='Electric Vehicle'),
 (SELECT id FROM ontology_concepts WHERE name='V2X'),
 'uses', 0.7, 'EVs can participate in vehicle-to-grid communication'),

-- CONNECTIVITY
((SELECT id FROM ontology_concepts WHERE name='OTA Updates'),
 (SELECT id FROM ontology_concepts WHERE name='5G Connectivity'),
 'requires', 0.8, 'OTA updates benefit from high-speed 5G connectivity'),

((SELECT id FROM ontology_concepts WHERE name='V2X'),
 (SELECT id FROM ontology_concepts WHERE name='5G Connectivity'),
 'uses', 0.85, 'V2X communication leverages 5G for low latency'),

-- INFRASTRUCTURE
((SELECT id FROM ontology_concepts WHERE name='Cloud Infrastructure'),
 (SELECT id FROM ontology_concepts WHERE name='Edge Computing'),
 'related_to', 0.9, 'Cloud and edge work together in SDV architecture'),

((SELECT id FROM ontology_concepts WHERE name='Digital Twin'),
 (SELECT id FROM ontology_concepts WHERE name='Cloud Infrastructure'),
 'requires', 0.9, 'Digital twins run on cloud infrastructure'),

((SELECT id FROM ontology_concepts WHERE name='Telematics'),
 (SELECT id FROM ontology_concepts WHERE name='Cloud Infrastructure'),
 'requires', 0.85, 'Telemetry data is processed in the cloud')

ON CONFLICT (concept_from_id, concept_to_id, relationship_type) DO NOTHING;

-- Step 5: Link to existing technology_keywords
UPDATE technology_keywords tk
SET ontology_concept_id = oc.id
FROM ontology_concepts oc
WHERE LOWER(TRIM(tk.keyword)) = LOWER(TRIM(oc.name))
   OR LOWER(TRIM(tk.keyword)) = ANY(
       SELECT LOWER(TRIM(synonym))
       FROM unnest(oc.synonyms) AS synonym
   );