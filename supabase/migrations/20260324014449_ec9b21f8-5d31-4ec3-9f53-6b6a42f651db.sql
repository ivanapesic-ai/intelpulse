
CREATE OR REPLACE FUNCTION recalculate_signal_percentiles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

  UPDATE technologies SET investment_score =
    CASE
      WHEN COALESCE(total_funding_eur, 0) >= 5000000000 THEN 2
      WHEN COALESCE(total_funding_eur, 0) >= 500000000 THEN 1
      ELSE 0
    END
  WHERE keyword_id IS NOT NULL;

  UPDATE technologies SET employees_score =
    CASE
      WHEN COALESCE(total_employees, 0) >= 50000 THEN 2
      WHEN COALESCE(total_employees, 0) >= 5000 THEN 1
      ELSE 0
    END
  WHERE keyword_id IS NOT NULL;

  UPDATE technologies SET patents_score =
    CASE
      WHEN COALESCE(total_patents, 0) >= 10000 THEN 2
      WHEN COALESCE(total_patents, 0) >= 500 THEN 1
      ELSE 0
    END
  WHERE keyword_id IS NOT NULL;

  UPDATE technologies SET visibility_score =
    CASE
      WHEN COALESCE(news_mention_count, 0) >= 30
        OR COALESCE(document_mention_count, 0) >= 50 THEN 2
      WHEN COALESCE(news_mention_count, 0) >= 5
        OR COALESCE(document_mention_count, 0) >= 10 THEN 1
      ELSE 0
    END
  WHERE keyword_id IS NOT NULL;

  UPDATE technologies SET research_score =
    CASE
      WHEN COALESCE(total_research_works, 0) >= 100000 THEN 2
      WHEN COALESCE(total_research_works, 0) >= 10000 THEN 1
      ELSE 0
    END
  WHERE keyword_id IS NOT NULL;

  UPDATE research_signals rs SET research_score = t.research_score
  FROM technologies t
  WHERE rs.keyword_id = t.keyword_id;

  UPDATE technologies SET last_updated = now()
  WHERE keyword_id IS NOT NULL;

  SELECT jsonb_build_object(
    'total_technologies', tech_count,
    'patents_distribution', (
      SELECT jsonb_build_object(
        'strong', count(*) FILTER (WHERE patents_score = 2),
        'moderate', count(*) FILTER (WHERE patents_score = 1),
        'emerging', count(*) FILTER (WHERE patents_score = 0)
      ) FROM technologies WHERE keyword_id IS NOT NULL
    ),
    'research_distribution', (
      SELECT jsonb_build_object(
        'strong', count(*) FILTER (WHERE research_score = 2),
        'moderate', count(*) FILTER (WHERE research_score = 1),
        'emerging', count(*) FILTER (WHERE research_score = 0)
      ) FROM technologies WHERE keyword_id IS NOT NULL
    ),
    'investment_distribution', (
      SELECT jsonb_build_object(
        'strong', count(*) FILTER (WHERE investment_score = 2),
        'moderate', count(*) FILTER (WHERE investment_score = 1),
        'emerging', count(*) FILTER (WHERE investment_score = 0)
      ) FROM technologies WHERE keyword_id IS NOT NULL
    )
  ) INTO result;

  RETURN result;
END;
$$
