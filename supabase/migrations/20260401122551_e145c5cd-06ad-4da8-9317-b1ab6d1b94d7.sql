-- CharIN Interoperability Test Data tables

CREATE TABLE IF NOT EXISTS charin_test_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  location TEXT,
  country TEXT,
  start_date DATE,
  end_date DATE,
  organizer TEXT DEFAULT 'CharIN',
  total_test_hours NUMERIC(8, 1),
  total_pairings INT,
  total_individual_tests INT,
  total_evs INT,
  total_evses INT,
  total_test_systems INT,
  total_attendees INT,
  report_url TEXT,
  source_document_id UUID,
  scraped_from_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_event UNIQUE (event_name, start_date)
);

CREATE TABLE IF NOT EXISTS charin_test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES charin_test_events(id) ON DELETE CASCADE,
  test_scenario TEXT NOT NULL,
  test_category TEXT,
  protocol TEXT,
  ev_model TEXT,
  ev_manufacturer TEXT,
  evse_model TEXT,
  evse_manufacturer TEXT,
  test_system TEXT,
  result TEXT NOT NULL,
  result_detail TEXT,
  duration_minutes NUMERIC(6, 1),
  charging_power_kw NUMERIC(8, 2),
  uses_iso15118 BOOLEAN DEFAULT false,
  uses_plug_and_charge BOOLEAN DEFAULT false,
  is_bidirectional BOOLEAN DEFAULT false,
  is_dc BOOLEAN DEFAULT true,
  is_megawatt BOOLEAN DEFAULT false,
  keyword_id UUID REFERENCES technology_keywords(id),
  keyword TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS charin_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_type TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT,
  supports_iso15118 BOOLEAN,
  supports_plug_and_charge BOOLEAN,
  supports_bidirectional BOOLEAN,
  supports_megawatt BOOLEAN,
  max_power_kw NUMERIC(8, 2),
  events_participated INT DEFAULT 0,
  total_tests INT DEFAULT 0,
  pass_rate NUMERIC(5, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_equipment UNIQUE (equipment_type, manufacturer, model)
);

-- Indexes
CREATE INDEX idx_charin_results_event ON charin_test_results(event_id);
CREATE INDEX idx_charin_results_protocol ON charin_test_results(protocol);
CREATE INDEX idx_charin_results_result ON charin_test_results(result);
CREATE INDEX idx_charin_results_keyword ON charin_test_results(keyword_id);
CREATE INDEX idx_charin_equipment_type ON charin_equipment(equipment_type);
CREATE INDEX idx_charin_equipment_mfr ON charin_equipment(manufacturer);

-- RLS
ALTER TABLE charin_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE charin_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE charin_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read charin_test_events" ON charin_test_events FOR SELECT USING (true);
CREATE POLICY "Auth write charin_test_events" ON charin_test_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update charin_test_events" ON charin_test_events FOR UPDATE USING (true);

CREATE POLICY "Public read charin_test_results" ON charin_test_results FOR SELECT USING (true);
CREATE POLICY "Auth write charin_test_results" ON charin_test_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update charin_test_results" ON charin_test_results FOR UPDATE USING (true);

CREATE POLICY "Public read charin_equipment" ON charin_equipment FOR SELECT USING (true);
CREATE POLICY "Auth write charin_equipment" ON charin_equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update charin_equipment" ON charin_equipment FOR UPDATE USING (true);

-- Aggregation Views
CREATE OR REPLACE VIEW charin_protocol_summary AS
SELECT
  protocol,
  COUNT(*) AS total_tests,
  COUNT(*) FILTER (WHERE result = 'PASS') AS passed,
  COUNT(*) FILTER (WHERE result = 'FAIL') AS failed,
  COUNT(*) FILTER (WHERE result = 'PARTIAL') AS partial,
  ROUND(100.0 * COUNT(*) FILTER (WHERE result = 'PASS') / NULLIF(COUNT(*), 0), 1) AS pass_rate_pct
FROM charin_test_results
GROUP BY protocol
ORDER BY total_tests DESC;

CREATE OR REPLACE VIEW charin_keyword_summary AS
SELECT
  k.id AS keyword_id,
  k.keyword,
  k.display_name,
  COUNT(DISTINCT r.event_id) AS events_with_tests,
  COUNT(*) AS total_tests,
  COUNT(*) FILTER (WHERE r.result = 'PASS') AS passed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE r.result = 'PASS') / NULLIF(COUNT(*), 0), 1) AS pass_rate_pct,
  COUNT(DISTINCT r.ev_manufacturer) AS ev_manufacturers_tested,
  COUNT(DISTINCT r.evse_manufacturer) AS evse_manufacturers_tested
FROM technology_keywords k
LEFT JOIN charin_test_results r ON r.keyword_id = k.id
GROUP BY k.id, k.keyword, k.display_name;

CREATE OR REPLACE VIEW charin_event_overview AS
SELECT
  e.*,
  COUNT(r.id) AS loaded_test_count,
  COUNT(DISTINCT r.protocol) AS protocols_tested,
  ROUND(100.0 * COUNT(r.id) FILTER (WHERE r.result = 'PASS') / NULLIF(COUNT(r.id), 0), 1) AS overall_pass_rate
FROM charin_test_events e
LEFT JOIN charin_test_results r ON r.event_id = e.id
GROUP BY e.id;

COMMENT ON TABLE charin_test_events IS 'CharIN VOLTS/Testival/ChargeX interoperability test events';
COMMENT ON TABLE charin_test_results IS 'Individual test outcomes from CharIN interoperability events';
COMMENT ON TABLE charin_equipment IS 'EVs, EVSEs, and test systems participating in CharIN events';