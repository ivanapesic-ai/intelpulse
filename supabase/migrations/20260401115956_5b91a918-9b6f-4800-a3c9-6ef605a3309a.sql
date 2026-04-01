
-- Drop old CORDIS tables (replaced by SPARQL-based version)
DROP TABLE IF EXISTS cordis_projects CASCADE;
DROP TABLE IF EXISTS cordis_keyword_summary CASCADE;

-- Create new cordis_eu_projects table
CREATE TABLE IF NOT EXISTS cordis_eu_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cordis_id TEXT NOT NULL,
  acronym TEXT,
  title TEXT NOT NULL,
  total_cost_eur NUMERIC(15, 2),
  eu_contribution_eur NUMERIC(15, 2),
  start_date DATE,
  end_date DATE,
  status TEXT,
  framework_programme TEXT,
  call_identifier TEXT,
  keyword_id UUID REFERENCES technology_keywords(id),
  keyword TEXT NOT NULL,
  relevance_score NUMERIC(3, 2) DEFAULT 1.0,
  cordis_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_cordis_keyword UNIQUE (cordis_id, keyword_id)
);

-- Indexes
CREATE INDEX idx_cordis_keyword_id ON cordis_eu_projects(keyword_id);
CREATE INDEX idx_cordis_framework ON cordis_eu_projects(framework_programme);
CREATE INDEX idx_cordis_status ON cordis_eu_projects(status);
CREATE INDEX idx_cordis_start_date ON cordis_eu_projects(start_date);
CREATE INDEX idx_cordis_total_cost ON cordis_eu_projects(total_cost_eur DESC);

-- RLS
ALTER TABLE cordis_eu_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON cordis_eu_projects
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert" ON cordis_eu_projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated update" ON cordis_eu_projects
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated delete" ON cordis_eu_projects
  FOR DELETE USING (true);

-- Aggregation view
CREATE OR REPLACE VIEW cordis_keyword_summary AS
SELECT
  k.id AS keyword_id,
  k.keyword,
  k.display_name,
  COUNT(DISTINCT c.cordis_id) AS project_count,
  SUM(c.total_cost_eur) AS total_project_cost_eur,
  SUM(c.eu_contribution_eur) AS total_eu_funding_eur,
  COUNT(DISTINCT c.cordis_id) FILTER (WHERE c.status = 'SIGNED') AS active_projects,
  COUNT(DISTINCT c.cordis_id) FILTER (WHERE c.status = 'CLOSED') AS completed_projects,
  COUNT(DISTINCT c.framework_programme) AS programme_count,
  MIN(c.start_date) AS earliest_project,
  MAX(c.end_date) AS latest_project,
  MAX(c.fetched_at) AS last_fetched
FROM technology_keywords k
LEFT JOIN cordis_eu_projects c ON c.keyword_id = k.id
GROUP BY k.id, k.keyword, k.display_name;

COMMENT ON TABLE cordis_eu_projects IS 'EU-funded R&D projects from CORDIS SPARQL endpoint, linked to technology keywords';
