-- Add Challenge-Opportunity Matrix scores to technologies table
ALTER TABLE technologies
ADD COLUMN IF NOT EXISTS challenge_score integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS opportunity_score integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sector_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS market_signals jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS document_insights jsonb DEFAULT '{}';

COMMENT ON COLUMN technologies.challenge_score IS '0-2 scale: 0=Severe Challenge, 1=Manageable, 2=No Major Challenge';
COMMENT ON COLUMN technologies.opportunity_score IS '0-2 scale: 0=Limited, 1=Promising, 2=High Opportunity';
COMMENT ON COLUMN technologies.sector_tags IS 'Array of sectors: mobility, energy, manufacturing';
COMMENT ON COLUMN technologies.market_signals IS 'Aggregated market signals from documents (funding mentions, adoption rates, key players)';
COMMENT ON COLUMN technologies.document_insights IS 'AI-extracted challenges and opportunities text from CEI documents';

-- Create a function to calculate C-O scores from existing signals
CREATE OR REPLACE FUNCTION calculate_challenge_opportunity_scores(tech_keyword_id uuid)
RETURNS void AS $$
DECLARE
  avg_trl numeric;
  total_funding numeric;
  patent_count integer;
  policy_count integer;
  doc_mentions integer;
  challenge integer;
  opportunity integer;
BEGIN
  -- Get aggregated metrics
  SELECT 
    t.avg_trl_mentioned,
    t.total_funding_eur,
    t.total_patents,
    t.policy_mention_count,
    t.document_mention_count
  INTO avg_trl, total_funding, patent_count, policy_count, doc_mentions
  FROM technologies t
  WHERE t.keyword_id = tech_keyword_id;

  -- Challenge Score (higher TRL = fewer challenges, more policy support = fewer challenges)
  -- 2 = No Major Challenge (TRL 7+, strong policy support)
  -- 1 = Manageable Challenge (TRL 4-6, some policy support)
  -- 0 = Severe Challenge (TRL 1-3, limited support)
  IF avg_trl >= 7 AND policy_count >= 3 THEN
    challenge := 2;
  ELSIF avg_trl >= 4 OR policy_count >= 1 THEN
    challenge := 1;
  ELSE
    challenge := 0;
  END IF;

  -- Opportunity Score (based on investment, patents, market presence)
  -- 2 = High Opportunity (strong funding + patents + market traction)
  -- 1 = Promising Opportunity (moderate signals)
  -- 0 = Limited Opportunity (weak signals)
  IF total_funding > 100000000 AND patent_count > 50 THEN
    opportunity := 2;
  ELSIF total_funding > 10000000 OR patent_count > 10 OR doc_mentions > 5 THEN
    opportunity := 1;
  ELSE
    opportunity := 0;
  END IF;

  -- Update the technology record
  UPDATE technologies
  SET 
    challenge_score = challenge,
    opportunity_score = opportunity
  WHERE keyword_id = tech_keyword_id;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate document insights for a technology
CREATE OR REPLACE FUNCTION aggregate_document_insights(tech_keyword_id uuid)
RETURNS void AS $$
DECLARE
  sectors text[];
  policies text[];
  market_data jsonb;
  insights jsonb;
BEGIN
  -- Get unique sectors from document mentions
  SELECT ARRAY_AGG(DISTINCT unnest_sector)
  INTO sectors
  FROM (
    SELECT unnest(
      COALESCE(
        (SELECT (d.parsed_content->'h11_analysis'->'sectors')::jsonb FROM cei_documents d
         JOIN document_technology_mentions m ON m.document_id = d.id
         WHERE m.keyword_id = tech_keyword_id
         LIMIT 1),
        '[]'::jsonb
      )::text[]
    ) AS unnest_sector
  ) sub;

  -- Get unique policy references
  SELECT ARRAY_AGG(DISTINCT m.policy_reference)
  INTO policies
  FROM document_technology_mentions m
  WHERE m.keyword_id = tech_keyword_id
    AND m.policy_reference IS NOT NULL;

  -- Build market signals from document parsed content
  SELECT jsonb_build_object(
    'funding_mentions', COALESCE(
      (SELECT jsonb_agg(d.parsed_content->'h11_analysis'->'market_signals'->'fundingMentions')
       FROM cei_documents d
       JOIN document_technology_mentions m ON m.document_id = d.id
       WHERE m.keyword_id = tech_keyword_id),
      '[]'::jsonb
    ),
    'adoption_rates', COALESCE(
      (SELECT jsonb_agg(d.parsed_content->'h11_analysis'->'market_signals'->'adoptionRates')
       FROM cei_documents d
       JOIN document_technology_mentions m ON m.document_id = d.id
       WHERE m.keyword_id = tech_keyword_id),
      '[]'::jsonb
    )
  ) INTO market_data;

  -- Build document insights with extracted context
  SELECT jsonb_build_object(
    'mention_contexts', (
      SELECT jsonb_agg(jsonb_build_object(
        'context', m.mention_context,
        'trl', m.trl_mentioned,
        'confidence', m.confidence_score,
        'policy', m.policy_reference
      ))
      FROM document_technology_mentions m
      WHERE m.keyword_id = tech_keyword_id
      ORDER BY m.relevance_score DESC
      LIMIT 10
    ),
    'policy_references', policies,
    'source_count', (SELECT COUNT(DISTINCT document_id) FROM document_technology_mentions WHERE keyword_id = tech_keyword_id)
  ) INTO insights;

  -- Update technologies table
  UPDATE technologies
  SET 
    sector_tags = COALESCE(sectors, '{}'),
    market_signals = COALESCE(market_data, '{}'::jsonb),
    document_insights = COALESCE(insights, '{}'::jsonb)
  WHERE keyword_id = tech_keyword_id;

  -- Also calculate C-O scores
  PERFORM calculate_challenge_opportunity_scores(tech_keyword_id);
END;
$$ LANGUAGE plpgsql;