-- Create company_technology_evidence table for structured document-company linking
CREATE TABLE company_technology_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES dealroom_companies(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES technology_keywords(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('document', 'web', 'dealroom')),
  source_reference TEXT NOT NULL,
  trl_mentioned INTEGER CHECK (trl_mentioned BETWEEN 1 AND 9),
  policy_reference TEXT,
  context TEXT,
  confidence_score NUMERIC DEFAULT 0.7,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, keyword_id, source_reference)
);

-- Enable RLS
ALTER TABLE company_technology_evidence ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view evidence" ON company_technology_evidence
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage evidence" ON company_technology_evidence
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_evidence_company ON company_technology_evidence(company_id);
CREATE INDEX idx_evidence_keyword ON company_technology_evidence(keyword_id);
CREATE INDEX idx_evidence_source_type ON company_technology_evidence(source_type);
CREATE INDEX idx_evidence_trl ON company_technology_evidence(trl_mentioned) WHERE trl_mentioned IS NOT NULL;

-- Create materialized view for integrated technology intelligence
CREATE MATERIALIZED VIEW technology_intelligence AS
SELECT 
  t.id,
  t.keyword_id,
  t.name,
  tk.display_name,
  tk.description as keyword_description,
  -- Dealroom signals
  t.dealroom_company_count,
  t.total_funding_eur,
  t.total_employees,
  t.total_patents,
  t.key_players,
  -- Document signals
  t.document_mention_count,
  t.avg_trl_mentioned,
  t.policy_mention_count,
  t.document_diversity,
  -- H11 scores
  t.composite_score,
  t.avg_semantic_score,
  t.network_centrality,
  t.corpus_rarity_score,
  t.avg_relevance_score,
  t.weighted_frequency_score,
  -- Component scores
  t.visibility_score,
  t.trl_score,
  t.eu_alignment_score,
  t.investment_score,
  t.employees_score,
  -- Company aggregation
  COALESCE(
    (SELECT ARRAY_AGG(DISTINCT dc.name ORDER BY dc.name) 
     FROM keyword_company_mapping kcm 
     JOIN dealroom_companies dc ON kcm.company_id = dc.id 
     WHERE kcm.keyword_id = t.keyword_id),
    '{}'::TEXT[]
  ) as company_names,
  -- TRL distribution from mentions
  COALESCE(
    (SELECT JSONB_BUILD_OBJECT(
      'low', COUNT(*) FILTER (WHERE trl_mentioned BETWEEN 1 AND 3),
      'mid', COUNT(*) FILTER (WHERE trl_mentioned BETWEEN 4 AND 6),
      'high', COUNT(*) FILTER (WHERE trl_mentioned BETWEEN 7 AND 9),
      'unknown', COUNT(*) FILTER (WHERE trl_mentioned IS NULL)
    )
    FROM (
      SELECT trl_mentioned FROM web_technology_mentions WHERE keyword_id = t.keyword_id
      UNION ALL
      SELECT trl_mentioned FROM document_technology_mentions WHERE keyword_id = t.keyword_id
    ) all_mentions),
    '{"low": 0, "mid": 0, "high": 0, "unknown": 0}'::JSONB
  ) as trl_distribution,
  -- Evidence counts by source
  COALESCE(
    (SELECT JSONB_BUILD_OBJECT(
      'document', COUNT(*) FILTER (WHERE source_type = 'document'),
      'web', COUNT(*) FILTER (WHERE source_type = 'web'),
      'dealroom', COUNT(*) FILTER (WHERE source_type = 'dealroom')
    )
    FROM company_technology_evidence cte 
    WHERE cte.keyword_id = t.keyword_id),
    '{"document": 0, "web": 0, "dealroom": 0}'::JSONB
  ) as evidence_by_source,
  t.last_updated,
  t.trend
FROM technologies t
LEFT JOIN technology_keywords tk ON t.keyword_id = tk.id
WHERE tk.is_active = true;

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_tech_intel_id ON technology_intelligence(id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_technology_intelligence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY technology_intelligence;
END;
$$;

-- Create function to populate evidence from existing mentions
CREATE OR REPLACE FUNCTION populate_company_evidence()
RETURNS TABLE(evidence_created INTEGER, companies_linked INTEGER, technologies_linked INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_evidence_created INTEGER := 0;
  v_companies_linked INTEGER := 0;
  v_technologies_linked INTEGER := 0;
BEGIN
  -- Insert evidence from web_technology_mentions
  INSERT INTO company_technology_evidence (company_id, keyword_id, source_type, source_reference, trl_mentioned, policy_reference, context, confidence_score)
  SELECT DISTINCT
    kcm.company_id,
    wtm.keyword_id,
    'web'::TEXT,
    wtm.source_url,
    wtm.trl_mentioned,
    wtm.policy_reference,
    LEFT(wtm.mention_context, 500),
    wtm.confidence_score
  FROM web_technology_mentions wtm
  JOIN keyword_company_mapping kcm ON wtm.keyword_id = kcm.keyword_id
  WHERE wtm.source_url IS NOT NULL
  ON CONFLICT (company_id, keyword_id, source_reference) DO UPDATE SET
    trl_mentioned = COALESCE(EXCLUDED.trl_mentioned, company_technology_evidence.trl_mentioned),
    policy_reference = COALESCE(EXCLUDED.policy_reference, company_technology_evidence.policy_reference),
    context = COALESCE(EXCLUDED.context, company_technology_evidence.context);

  GET DIAGNOSTICS v_evidence_created = ROW_COUNT;

  -- Insert evidence from document_technology_mentions
  INSERT INTO company_technology_evidence (company_id, keyword_id, source_type, source_reference, trl_mentioned, policy_reference, context, confidence_score)
  SELECT DISTINCT
    kcm.company_id,
    dtm.keyword_id,
    'document'::TEXT,
    dtm.document_id::TEXT,
    dtm.trl_mentioned,
    dtm.policy_reference,
    LEFT(dtm.mention_context, 500),
    dtm.confidence_score
  FROM document_technology_mentions dtm
  JOIN keyword_company_mapping kcm ON dtm.keyword_id = kcm.keyword_id
  WHERE dtm.document_id IS NOT NULL
  ON CONFLICT (company_id, keyword_id, source_reference) DO UPDATE SET
    trl_mentioned = COALESCE(EXCLUDED.trl_mentioned, company_technology_evidence.trl_mentioned),
    policy_reference = COALESCE(EXCLUDED.policy_reference, company_technology_evidence.policy_reference),
    context = COALESCE(EXCLUDED.context, company_technology_evidence.context);

  v_evidence_created := v_evidence_created + ROW_COUNT;

  -- Get counts
  SELECT COUNT(DISTINCT company_id), COUNT(DISTINCT keyword_id) 
  INTO v_companies_linked, v_technologies_linked
  FROM company_technology_evidence;

  RETURN QUERY SELECT v_evidence_created, v_companies_linked, v_technologies_linked;
END;
$$;