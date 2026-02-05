-- Update aggregate_document_insights to properly calculate C-O scores from AI assessments
CREATE OR REPLACE FUNCTION public.aggregate_document_insights(tech_keyword_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  sectors text[];
  policies text[];
  market_data jsonb;
  insights jsonb;
  avg_challenge numeric;
  avg_opportunity numeric;
  doc_challenge integer;
  doc_opportunity integer;
BEGIN
  -- Get unique policy references
  SELECT ARRAY_AGG(DISTINCT m.policy_reference)
  INTO policies
  FROM document_technology_mentions m
  WHERE m.keyword_id = tech_keyword_id
    AND m.policy_reference IS NOT NULL;

  -- Get C-O scores from parsed document content (from AI assessments)
  SELECT 
    AVG((d.parsed_content->'co_analysis'->'keyword_assessments'->0->>'avg_challenge')::numeric),
    AVG((d.parsed_content->'co_analysis'->'keyword_assessments'->0->>'avg_opportunity')::numeric)
  INTO avg_challenge, avg_opportunity
  FROM cei_documents d
  JOIN document_technology_mentions m ON m.document_id = d.id
  WHERE m.keyword_id = tech_keyword_id
    AND d.parsed_content->'co_analysis' IS NOT NULL;

  -- Convert to 0-2 scale if we have AI assessments
  IF avg_challenge IS NOT NULL THEN
    doc_challenge := ROUND(avg_challenge)::integer;
  ELSE
    -- Fallback: derive from TRL (higher TRL = fewer challenges)
    SELECT CASE 
      WHEN AVG(m.trl_mentioned) >= 7 THEN 2
      WHEN AVG(m.trl_mentioned) >= 4 THEN 1
      ELSE 0
    END INTO doc_challenge
    FROM document_technology_mentions m
    WHERE m.keyword_id = tech_keyword_id AND m.trl_mentioned IS NOT NULL;
  END IF;

  IF avg_opportunity IS NOT NULL THEN
    doc_opportunity := ROUND(avg_opportunity)::integer;
  ELSE
    -- Fallback: derive from policy count and document mentions
    SELECT CASE 
      WHEN COUNT(*) >= 5 AND COUNT(DISTINCT m.policy_reference) >= 2 THEN 2
      WHEN COUNT(*) >= 2 THEN 1
      ELSE 0
    END INTO doc_opportunity
    FROM document_technology_mentions m
    WHERE m.keyword_id = tech_keyword_id;
  END IF;

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

  -- Get sectors from latest parsed documents
  SELECT ARRAY_AGG(DISTINCT sector)
  INTO sectors
  FROM (
    SELECT jsonb_array_elements_text(d.parsed_content->'co_analysis'->'sectors') as sector
    FROM cei_documents d
    JOIN document_technology_mentions m ON m.document_id = d.id
    WHERE m.keyword_id = tech_keyword_id
      AND d.parsed_content->'co_analysis'->'sectors' IS NOT NULL
  ) sub;

  -- Get market signals from documents
  SELECT jsonb_build_object(
    'from_documents', (
      SELECT jsonb_agg(d.parsed_content->'co_analysis'->'market_signals')
      FROM cei_documents d
      JOIN document_technology_mentions m ON m.document_id = d.id
      WHERE m.keyword_id = tech_keyword_id
        AND d.parsed_content->'co_analysis'->'market_signals' IS NOT NULL
      LIMIT 5
    )
  ) INTO market_data;

  -- Update technologies table with C-O scores
  UPDATE technologies
  SET 
    challenge_score = COALESCE(doc_challenge, challenge_score, 1),
    opportunity_score = COALESCE(doc_opportunity, opportunity_score, 1),
    sector_tags = COALESCE(sectors, sector_tags, '{}'),
    market_signals = COALESCE(market_data, market_signals, '{}'::jsonb),
    document_insights = COALESCE(insights, document_insights, '{}'::jsonb),
    last_updated = now()
  WHERE keyword_id = tech_keyword_id;
END;
$function$;