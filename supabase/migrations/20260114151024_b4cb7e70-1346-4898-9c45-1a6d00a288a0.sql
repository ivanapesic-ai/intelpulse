-- =============================================
-- AI-CE Heatmap Platform: Complete Schema Migration
-- Based on January 22, 2025 Meeting Notes
-- =============================================

-- 1. Create ENUMs
CREATE TYPE public.keyword_source AS ENUM ('cei_sphere', 'dealroom', 'manual');
CREATE TYPE public.maturity_score AS ENUM ('0', '1', '2');
CREATE TYPE public.trend_direction AS ENUM ('up', 'down', 'stable');
CREATE TYPE public.sync_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE public.parse_status AS ENUM ('pending', 'parsing', 'completed', 'failed');
CREATE TYPE public.document_type AS ENUM ('pdf', 'pptx', 'docx');
CREATE TYPE public.document_source AS ENUM ('teams', 'cei_sphere_website', 'eucloudedgeiot', 'manual');

-- 2. Technology Keywords Table (50+ keywords from CEI-SPHERE and Dealroom)
CREATE TABLE public.technology_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  source keyword_source NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  parent_keyword_id UUID REFERENCES public.technology_keywords(id),
  aliases TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Technologies Table (revised with 0-2 scoring)
CREATE TABLE public.technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES public.technology_keywords(id),
  name TEXT NOT NULL,
  description TEXT,
  investment_score INTEGER CHECK (investment_score BETWEEN 0 AND 2),
  employees_score INTEGER CHECK (employees_score BETWEEN 0 AND 2),
  patents_score INTEGER CHECK (patents_score BETWEEN 0 AND 2),
  composite_score NUMERIC GENERATED ALWAYS AS (
    (COALESCE(investment_score, 0) + COALESCE(employees_score, 0) + COALESCE(patents_score, 0))::NUMERIC / 3
  ) STORED,
  trend trend_direction DEFAULT 'stable',
  key_players TEXT[],
  total_patents INTEGER DEFAULT 0,
  total_funding_eur NUMERIC DEFAULT 0,
  total_employees INTEGER DEFAULT 0,
  dealroom_company_count INTEGER DEFAULT 0,
  document_mention_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Dealroom Companies Table
CREATE TABLE public.dealroom_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealroom_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  website TEXT,
  hq_country TEXT,
  hq_city TEXT,
  founded_year INTEGER,
  employees_count INTEGER,
  total_funding_eur NUMERIC,
  valuation_eur NUMERIC,
  last_funding_date DATE,
  last_funding_amount_eur NUMERIC,
  growth_stage TEXT,
  investors TEXT[],
  industries TEXT[],
  patents_count INTEGER DEFAULT 0,
  news_items JSONB,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Keyword to Company Mapping
CREATE TABLE public.keyword_company_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES public.technology_keywords(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.dealroom_companies(id) ON DELETE CASCADE,
  relevance_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(keyword_id, company_id)
);

-- 6. Dealroom Sync Logs
CREATE TABLE public.dealroom_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  keywords_searched TEXT[],
  records_fetched INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  status sync_status DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 7. CEI Documents Table
CREATE TABLE public.cei_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_type document_type NOT NULL,
  storage_path TEXT NOT NULL,
  source document_source DEFAULT 'manual',
  title TEXT,
  upload_date DATE DEFAULT CURRENT_DATE,
  parse_status parse_status DEFAULT 'pending',
  parsed_content JSONB,
  page_count INTEGER,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Document Technology Mentions
CREATE TABLE public.document_technology_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.cei_documents(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES public.technology_keywords(id) ON DELETE CASCADE,
  mention_context TEXT,
  trl_mentioned INTEGER CHECK (trl_mentioned BETWEEN 1 AND 9),
  policy_reference TEXT,
  confidence_score NUMERIC CHECK (confidence_score BETWEEN 0 AND 1),
  page_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Dealroom Cache (for after trial expires)
CREATE TABLE public.dealroom_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_date DATE NOT NULL DEFAULT CURRENT_DATE,
  keyword TEXT NOT NULL,
  company_count INTEGER DEFAULT 0,
  total_funding_eur NUMERIC DEFAULT 0,
  total_employees INTEGER DEFAULT 0,
  total_patents INTEGER DEFAULT 0,
  companies_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create Indexes for Performance
CREATE INDEX idx_technology_keywords_source ON public.technology_keywords(source);
CREATE INDEX idx_technology_keywords_active ON public.technology_keywords(is_active);
CREATE INDEX idx_technologies_keyword_id ON public.technologies(keyword_id);
CREATE INDEX idx_technologies_composite_score ON public.technologies(composite_score DESC);
CREATE INDEX idx_dealroom_companies_country ON public.dealroom_companies(hq_country);
CREATE INDEX idx_dealroom_companies_funding ON public.dealroom_companies(total_funding_eur DESC);
CREATE INDEX idx_keyword_company_mapping_keyword ON public.keyword_company_mapping(keyword_id);
CREATE INDEX idx_keyword_company_mapping_company ON public.keyword_company_mapping(company_id);
CREATE INDEX idx_cei_documents_status ON public.cei_documents(parse_status);
CREATE INDEX idx_document_mentions_document ON public.document_technology_mentions(document_id);
CREATE INDEX idx_document_mentions_keyword ON public.document_technology_mentions(keyword_id);

-- 11. Enable Row Level Security
ALTER TABLE public.technology_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealroom_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_company_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealroom_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cei_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_technology_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealroom_cache ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies - Public Read Access for Keywords and Technologies
CREATE POLICY "Anyone can view active keywords"
ON public.technology_keywords FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can view technologies"
ON public.technologies FOR SELECT
USING (true);

CREATE POLICY "Anyone can view dealroom companies"
ON public.dealroom_companies FOR SELECT
USING (true);

CREATE POLICY "Anyone can view keyword company mappings"
ON public.keyword_company_mapping FOR SELECT
USING (true);

CREATE POLICY "Anyone can view sync logs"
ON public.dealroom_sync_logs FOR SELECT
USING (true);

CREATE POLICY "Anyone can view documents"
ON public.cei_documents FOR SELECT
USING (true);

CREATE POLICY "Anyone can view document mentions"
ON public.document_technology_mentions FOR SELECT
USING (true);

CREATE POLICY "Anyone can view cache"
ON public.dealroom_cache FOR SELECT
USING (true);

-- 13. Service role can insert/update (for edge functions)
CREATE POLICY "Service role can manage keywords"
ON public.technology_keywords FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage technologies"
ON public.technologies FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage dealroom companies"
ON public.dealroom_companies FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage mappings"
ON public.keyword_company_mapping FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage sync logs"
ON public.dealroom_sync_logs FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage documents"
ON public.cei_documents FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage mentions"
ON public.document_technology_mentions FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage cache"
ON public.dealroom_cache FOR ALL
USING (true)
WITH CHECK (true);

-- 14. Seed CEI-SPHERE Keywords (30+)
INSERT INTO public.technology_keywords (keyword, source, display_name, description, aliases) VALUES
('sdv', 'cei_sphere', 'Software Defined Vehicle', 'Vehicles with software-centric architecture enabling OTA updates and new features', ARRAY['software-defined-vehicle']),
('vas', 'cei_sphere', 'Vehicle as Software', 'Concept treating the entire vehicle as a software platform', ARRAY['vehicle-as-software']),
('v2g', 'cei_sphere', 'Vehicle to Grid', 'Bidirectional energy flow between EVs and power grid', ARRAY['vehicle-to-grid']),
('v2x', 'cei_sphere', 'Vehicle to Everything', 'Communication between vehicles and infrastructure, pedestrians, networks', ARRAY['vehicle-to-everything']),
('ems', 'cei_sphere', 'Energy Management Systems', 'Systems for monitoring and optimizing energy consumption', ARRAY['energy-management-system']),
('bev', 'cei_sphere', 'Battery Electric Vehicle', 'Vehicles powered entirely by rechargeable batteries', ARRAY['battery-electric-vehicle']),
('sbs', 'cei_sphere', 'Storage Battery Systems', 'Large-scale battery storage for grid stabilization', ARRAY['storage-battery-system']),
('mesu', 'cei_sphere', 'Mobile Energy Storage Units', 'Portable battery systems for flexible energy deployment', ARRAY['mobile-energy-storage']),
('vehicle_safety', 'cei_sphere', 'Vehicle Safety', 'Technologies ensuring occupant and pedestrian safety', ARRAY['automotive-safety']),
('sustainable_mobility', 'cei_sphere', 'Sustainable Mobility', 'Eco-friendly transportation solutions', ARRAY['green-mobility']),
('ev', 'cei_sphere', 'Electric Vehicle', 'Vehicles powered by electric motors', ARRAY['electric-vehicle', 'e-vehicle']),
('ev_charging', 'cei_sphere', 'EV Charging', 'Infrastructure and technology for charging electric vehicles', ARRAY['electric-vehicle-charging']),
('logistics', 'cei_sphere', 'Logistics', 'Supply chain and distribution optimization', ARRAY['supply-chain-logistics']),
('bidirectional_charging', 'cei_sphere', 'Bidirectional Charging', 'Charging systems that can both charge and discharge vehicle batteries', ARRAY['bi-directional-charging']),
('autonomous_driving', 'cei_sphere', 'Autonomous Driving', 'Self-driving vehicle technology', ARRAY['self-driving', 'autonomous-vehicle']),
('smart_city', 'cei_sphere', 'Smart City', 'Urban areas using IoT and data for improved services', ARRAY['smart-cities']),
('maritime', 'cei_sphere', 'Maritime', 'Shipping and naval technology applications', ARRAY['marine-tech']),
('smart_logistics', 'cei_sphere', 'Smart Logistics', 'AI-powered supply chain optimization', ARRAY['intelligent-logistics']),
('supply_chain', 'cei_sphere', 'Supply Chain', 'End-to-end product delivery networks', ARRAY['supply-chain-management']),
('smart_grid', 'cei_sphere', 'Smart Grid', 'Intelligent electricity distribution networks', ARRAY['intelligent-grid']),
('micro_grid', 'cei_sphere', 'Micro Grid', 'Localized energy grids that can operate independently', ARRAY['microgrid']),
('res', 'cei_sphere', 'Renewable Energy Sources', 'Solar, wind, and other sustainable energy', ARRAY['renewable-energy']),
('ups', 'cei_sphere', 'Uninterrupted Power Supply', 'Backup power systems for critical infrastructure', ARRAY['uninterruptible-power-supply']),
('residential_energy', 'cei_sphere', 'Residential Energy Management', 'Home energy optimization systems', ARRAY['home-energy-management']),
('smart_recharging', 'cei_sphere', 'Smart Recharging', 'Intelligent EV charging optimization', ARRAY['intelligent-charging']),
('self_adaptive_energy', 'cei_sphere', 'Self Adaptive Energy', 'Systems that automatically adjust to energy conditions', ARRAY['adaptive-energy']),
('ses', 'cei_sphere', 'Shared Energy Storage', 'Community-based energy storage solutions', ARRAY['shared-storage', 'solar-energy-storage']);

-- 15. Seed Dealroom Keywords (20+)
INSERT INTO public.technology_keywords (keyword, source, display_name, description, aliases) VALUES
('autonomous_mobile_robots', 'dealroom', 'Autonomous Mobile Robots', 'Self-navigating robots for industrial applications', ARRAY['amr', 'mobile-robots']),
('logistics_robots', 'dealroom', 'Logistics Robots', 'Robots designed for warehouse and delivery operations', ARRAY['warehouse-robots']),
('av_software', 'dealroom', 'AV Software', 'Software platforms for autonomous vehicles', ARRAY['autonomous-vehicle-software']),
('av_simulation', 'dealroom', 'AV Simulation', 'Virtual testing environments for autonomous vehicles', ARRAY['autonomous-simulation']),
('av_labeling', 'dealroom', 'AV Labeling', 'Data annotation for autonomous vehicle training', ARRAY['av-annotation']),
('lidar', 'dealroom', 'LiDAR', 'Light detection and ranging sensors for 3D mapping', ARRAY['laser-radar']),
('av_camera', 'dealroom', 'AV Camera', 'Computer vision cameras for autonomous vehicles', ARRAY['autonomous-camera']),
('av_radar', 'dealroom', 'AV Radar', 'Radar systems for autonomous vehicle perception', ARRAY['autonomous-radar']),
('battery_management', 'dealroom', 'Battery Management Systems', 'Systems for monitoring and optimizing battery performance', ARRAY['bms']),
('electric_mobility', 'dealroom', 'Electric Mobility', 'Electric transportation ecosystem', ARRAY['e-mobility']),
('ev_battery', 'dealroom', 'EV Battery', 'Battery technology for electric vehicles', ARRAY['electric-vehicle-battery']),
('ev_manufacturing', 'dealroom', 'EV Manufacturing', 'Production of electric vehicles and components', ARRAY['ev-production']),
('ev_motor', 'dealroom', 'EV Motor', 'Electric motors for vehicle propulsion', ARRAY['electric-motor']),
('ev_services', 'dealroom', 'EV Services', 'Services supporting electric vehicle ownership', ARRAY['ev-support']),
('fleet_management', 'dealroom', 'Fleet Management', 'Software for managing vehicle fleets', ARRAY['fleet-tracking']),
('logistics_tech', 'dealroom', 'Logistics Tech', 'Technology solutions for logistics optimization', ARRAY['logtech']),
('micromobility', 'dealroom', 'Micromobility', 'Small personal electric vehicles like scooters and bikes', ARRAY['micro-mobility']),
('smart_cities', 'dealroom', 'Smart Cities', 'Urban technology and IoT infrastructure', ARRAY['smart-city-tech']),
('teledriving', 'dealroom', 'Teledriving', 'Remote operation of vehicles', ARRAY['remote-driving']),
('telematics', 'dealroom', 'Telematics', 'Vehicle tracking and diagnostics systems', ARRAY['vehicle-telematics']),
('supply_chain_management', 'dealroom', 'Supply Chain Management', 'Software for optimizing supply chains', ARRAY['scm']),
('sustainability_measurement', 'dealroom', 'Sustainability Measurement', 'Tools for tracking environmental impact', ARRAY['carbon-tracking']);

-- 16. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. Apply triggers
CREATE TRIGGER update_technology_keywords_updated_at
  BEFORE UPDATE ON public.technology_keywords
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cei_documents_updated_at
  BEFORE UPDATE ON public.cei_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();