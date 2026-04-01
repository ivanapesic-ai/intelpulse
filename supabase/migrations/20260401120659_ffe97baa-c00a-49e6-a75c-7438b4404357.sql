CREATE TABLE IF NOT EXISTS github_oss_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  github_id BIGINT NOT NULL,
  full_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  description TEXT,
  stars INT DEFAULT 0,
  forks INT DEFAULT 0,
  open_issues INT DEFAULT 0,
  watchers INT DEFAULT 0,
  size_kb INT DEFAULT 0,
  language TEXT,
  topics TEXT[],
  license TEXT,
  created_at_gh TIMESTAMPTZ,
  updated_at_gh TIMESTAMPTZ,
  pushed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  activity_score NUMERIC(5, 2),
  momentum TEXT,
  keyword_id UUID REFERENCES technology_keywords(id),
  keyword TEXT NOT NULL,
  search_query TEXT,
  relevance_rank INT,
  github_url TEXT,
  homepage_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_github_keyword UNIQUE (github_id, keyword_id)
);

CREATE INDEX idx_github_keyword_id ON github_oss_activity(keyword_id);
CREATE INDEX idx_github_stars ON github_oss_activity(stars DESC);
CREATE INDEX idx_github_updated ON github_oss_activity(updated_at_gh DESC);
CREATE INDEX idx_github_active ON github_oss_activity(is_active);
CREATE INDEX idx_github_language ON github_oss_activity(language);

ALTER TABLE github_oss_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON github_oss_activity FOR SELECT USING (true);
CREATE POLICY "Authenticated insert" ON github_oss_activity FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update" ON github_oss_activity FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete" ON github_oss_activity FOR DELETE USING (true);

CREATE OR REPLACE VIEW github_keyword_summary AS
SELECT
  k.id AS keyword_id,
  k.keyword,
  k.display_name,
  COUNT(DISTINCT g.github_id) AS repo_count,
  COUNT(DISTINCT g.github_id) FILTER (WHERE g.is_active) AS active_repos,
  COALESCE(SUM(g.stars), 0) AS total_stars,
  COALESCE(SUM(g.forks), 0) AS total_forks,
  AVG(g.stars) AS avg_stars,
  MAX(g.stars) AS max_stars,
  MAX(g.updated_at_gh) AS latest_activity,
  ARRAY_AGG(DISTINCT g.language) FILTER (WHERE g.language IS NOT NULL) AS languages,
  (SELECT ARRAY_AGG(sub.full_name ORDER BY sub.stars DESC)
   FROM (SELECT full_name, stars FROM github_oss_activity
         WHERE keyword_id = k.id ORDER BY stars DESC LIMIT 3) sub
  ) AS top_repos,
  MAX(g.fetched_at) AS last_fetched
FROM technology_keywords k
LEFT JOIN github_oss_activity g ON g.keyword_id = k.id
GROUP BY k.id, k.keyword, k.display_name;

COMMENT ON TABLE github_oss_activity IS 'Open-source repository metrics from GitHub, linked to technology keywords';
COMMENT ON VIEW github_keyword_summary IS 'Aggregated open-source momentum signal per technology keyword';