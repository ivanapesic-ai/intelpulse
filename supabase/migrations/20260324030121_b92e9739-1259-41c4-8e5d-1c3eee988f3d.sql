-- Drop and recreate the materialized view with technology_id and additional columns
DROP MATERIALIZED VIEW IF EXISTS technology_intelligence;

CREATE MATERIALIZED VIEW technology_intelligence AS
SELECT
  t.id AS technology_id,
  tk.id AS keyword_id,
  tk.display_name AS name,
  tk.keyword AS slug,
  tk.aliases,
  od.name AS domain_name,
  od.id AS domain_id,
  get_investment_score(tk.id) AS investment_score,
  get_employees_score(tk.id) AS employees_score,
  get_patents_score(tk.id) AS patents_score,
  get_research_score(tk.id) AS research_score,
  get_visibility_score(tk.id) AS visibility_score,
  get_maturity_score(tk.id) AS maturity_score,
  get_company_count(tk.id) AS company_count,
  get_total_funding(tk.id) AS total_funding_eur,
  t.total_patents,
  t.total_employees,
  t.total_research_works,
  t.research_growth_rate,
  t.research_citations,
  t.trl_score,
  t.avg_trl_mentioned,
  t.eu_alignment_score,
  t.document_mention_count,
  t.policy_mention_count,
  t.news_mention_count,
  t.challenge_score,
  t.opportunity_score,
  t.regulatory_status,
  t.growth_rate_pct,
  t.log_composite_score,
  t.composite_score,
  t.recent_news,
  t.key_players,
  t.trend,
  t.sector_tags,
  t.description AS tech_description,
  t.avg_semantic_score,
  t.network_centrality,
  t.corpus_rarity_score,
  t.weighted_frequency_score,
  t.avg_relevance_score,
  t.document_diversity,
  t.market_signals,
  t.document_insights,
  now() AS refreshed_at
FROM technology_keywords tk
JOIN technologies t ON t.keyword_id = tk.id
LEFT JOIN ontology_concepts oc ON tk.ontology_concept_id = oc.id
LEFT JOIN ontology_domains od ON oc.domain_id = od.id
WHERE tk.is_active = true AND COALESCE(tk.excluded_from_sdv, false) = false;

CREATE UNIQUE INDEX idx_ti_keyword ON technology_intelligence(keyword_id);
CREATE INDEX idx_ti_technology ON technology_intelligence(technology_id);

-- Recreate the refresh function
CREATE OR REPLACE FUNCTION refresh_technology_intelligence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY technology_intelligence;
END;
$$;