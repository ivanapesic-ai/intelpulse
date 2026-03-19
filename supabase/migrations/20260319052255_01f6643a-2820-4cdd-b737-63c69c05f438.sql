
CREATE OR REPLACE FUNCTION recalculate_signal_percentiles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tech_count integer;
  result jsonb;
BEGIN
  SELECT count(*) INTO tech_count
  FROM technologies
  WHERE keyword_id IS NOT NULL;

  IF tech_count = 0 THEN
    RETURN jsonb_build_object('error', 'No technologies found');
  END IF;

  -- Signal 1: Investment - based on total_funding_eur
  WITH ranked AS (
    SELECT id,
      percent_rank() OVER (ORDER BY COALESCE(total_funding_eur, 0)) as pctile
    FROM technologies WHERE keyword_id IS NOT NULL
  )
  UPDATE technologies t SET investment_score = 
    CASE 
      WHEN r.pctile >= 0.80 THEN 2
      WHEN r.pctile >= 0.40 THEN 1
      ELSE 0
    END
  FROM ranked r WHERE t.id = r.id;

  -- Signal 2: Patents - based on total_patents
  WITH ranked AS (
    SELECT id,
      percent_rank() OVER (ORDER BY COALESCE(total_patents, 0)) as pctile
    FROM technologies WHERE keyword_id IS NOT NULL
  )
  UPDATE technologies t SET patents_score = 
    CASE 
      WHEN r.pctile >= 0.80 THEN 2
      WHEN r.pctile >= 0.40 THEN 1
      ELSE 0
    END
  FROM ranked r WHERE t.id = r.id;

  -- Signal 3: Market Response - based on document_mention_count + news_mention_count
  WITH ranked AS (
    SELECT id,
      percent_rank() OVER (
        ORDER BY COALESCE(document_mention_count, 0) + COALESCE(news_mention_count, 0)
      ) as pctile
    FROM technologies WHERE keyword_id IS NOT NULL
  )
  UPDATE technologies t SET visibility_score = 
    CASE 
      WHEN r.pctile >= 0.80 THEN 2
      WHEN r.pctile >= 0.40 THEN 1
      ELSE 0
    END
  FROM ranked r WHERE t.id = r.id;

  -- Signal 4: Research - based on total_research_works
  WITH ranked AS (
    SELECT id,
      percent_rank() OVER (ORDER BY COALESCE(total_research_works, 0)) as pctile
    FROM technologies WHERE keyword_id IS NOT NULL
  )
  UPDATE technologies t SET research_score = 
    CASE 
      WHEN r.pctile >= 0.80 THEN 2
      WHEN r.pctile >= 0.40 THEN 1
      ELSE 0
    END
  FROM ranked r WHERE t.id = r.id;

  -- Also update research_signals table to match
  UPDATE research_signals rs SET research_score = t.research_score
  FROM technologies t
  WHERE rs.keyword_id = t.keyword_id;

  -- Update last_updated (skip composite_score - it's a generated column)
  UPDATE technologies SET last_updated = now()
  WHERE keyword_id IS NOT NULL;

  -- Build summary
  SELECT jsonb_build_object(
    'total_technologies', tech_count,
    'investment', jsonb_build_object(
      'strong', (SELECT count(*) FROM technologies WHERE investment_score = 2),
      'moderate', (SELECT count(*) FROM technologies WHERE investment_score = 1),
      'emerging', (SELECT count(*) FROM technologies WHERE investment_score = 0)
    ),
    'patents', jsonb_build_object(
      'strong', (SELECT count(*) FROM technologies WHERE patents_score = 2),
      'moderate', (SELECT count(*) FROM technologies WHERE patents_score = 1),
      'emerging', (SELECT count(*) FROM technologies WHERE patents_score = 0)
    ),
    'visibility', jsonb_build_object(
      'strong', (SELECT count(*) FROM technologies WHERE visibility_score = 2),
      'moderate', (SELECT count(*) FROM technologies WHERE visibility_score = 1),
      'emerging', (SELECT count(*) FROM technologies WHERE visibility_score = 0)
    ),
    'research', jsonb_build_object(
      'strong', (SELECT count(*) FROM technologies WHERE research_score = 2),
      'moderate', (SELECT count(*) FROM technologies WHERE research_score = 1),
      'emerging', (SELECT count(*) FROM technologies WHERE research_score = 0)
    )
  ) INTO result;

  RETURN result;
END;
$$;
