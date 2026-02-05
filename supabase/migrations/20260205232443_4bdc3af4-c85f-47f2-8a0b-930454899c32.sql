-- Fix: Cast to numeric for ROUND function
CREATE OR REPLACE FUNCTION public.calculate_weighted_composite_score()
RETURNS TABLE(keywords_updated integer, score_range text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated INTEGER := 0;
  v_min_score NUMERIC;
  v_max_score NUMERIC;
  max_funding NUMERIC;
  max_patents NUMERIC;
  max_employees NUMERIC;
  max_companies NUMERIC;
BEGIN
  -- Get dataset maximums
  SELECT 
    GREATEST(MAX(total_funding_eur), 1),
    GREATEST(MAX(total_patents), 1),
    GREATEST(MAX(total_employees), 1),
    GREATEST(MAX(dealroom_company_count), 1)
  INTO max_funding, max_patents, max_employees, max_companies
  FROM technologies
  WHERE total_funding_eur > 0 OR total_patents > 0 OR total_employees > 0;

  -- Update composite scores using log-scaled weighted formula
  UPDATE technologies t
  SET composite_score = ROUND(
    (
      0.30 * CASE 
        WHEN COALESCE(t.total_funding_eur, 0) > 0 
        THEN LEAST(2.0, (LN(t.total_funding_eur + 1) / LN(max_funding + 1)) * 2)
        ELSE 0 
      END +
      0.25 * CASE 
        WHEN COALESCE(t.total_patents, 0) > 0 
        THEN LEAST(2.0, (LN(t.total_patents + 1) / LN(max_patents + 1)) * 2)
        ELSE 0 
      END +
      0.25 * CASE 
        WHEN COALESCE(t.total_employees, 0) > 0 
        THEN LEAST(2.0, (LN(t.total_employees + 1) / LN(max_employees + 1)) * 2)
        ELSE 0 
      END +
      0.20 * CASE 
        WHEN COALESCE(t.dealroom_company_count, 0) > 0 
        THEN LEAST(2.0, (LN(t.dealroom_company_count + 1) / LN(max_companies + 1)) * 2)
        ELSE 0 
      END
    )::NUMERIC, 2
  )
  WHERE t.keyword_id IS NOT NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  SELECT MIN(composite_score), MAX(composite_score)
  INTO v_min_score, v_max_score
  FROM technologies WHERE composite_score IS NOT NULL;

  RETURN QUERY SELECT v_updated, 
    ROUND(COALESCE(v_min_score, 0), 2)::TEXT || ' - ' || ROUND(COALESCE(v_max_score, 0), 2)::TEXT;
END;
$function$;

-- Fix trigger too
CREATE OR REPLACE FUNCTION public.calculate_technology_composite_score()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  max_funding NUMERIC;
  max_patents NUMERIC;
  max_employees NUMERIC;
  max_companies NUMERIC;
BEGIN
  SELECT 
    GREATEST(MAX(total_funding_eur), 1),
    GREATEST(MAX(total_patents), 1),
    GREATEST(MAX(total_employees), 1),
    GREATEST(MAX(dealroom_company_count), 1)
  INTO max_funding, max_patents, max_employees, max_companies
  FROM technologies;

  NEW.visibility_score := public.calculate_visibility_score(COALESCE(NEW.document_mention_count, 0));
  NEW.trl_score := public.calculate_trl_score(NEW.avg_trl_mentioned);
  NEW.eu_alignment_score := public.calculate_eu_alignment_score(COALESCE(NEW.policy_mention_count, 0));
  
  NEW.composite_score := ROUND(
    (
      0.30 * CASE 
        WHEN COALESCE(NEW.total_funding_eur, 0) > 0 
        THEN LEAST(2.0, (LN(NEW.total_funding_eur + 1) / LN(max_funding + 1)) * 2)
        ELSE 0 
      END +
      0.25 * CASE 
        WHEN COALESCE(NEW.total_patents, 0) > 0 
        THEN LEAST(2.0, (LN(NEW.total_patents + 1) / LN(max_patents + 1)) * 2)
        ELSE 0 
      END +
      0.25 * CASE 
        WHEN COALESCE(NEW.total_employees, 0) > 0 
        THEN LEAST(2.0, (LN(NEW.total_employees + 1) / LN(max_employees + 1)) * 2)
        ELSE 0 
      END +
      0.20 * CASE 
        WHEN COALESCE(NEW.dealroom_company_count, 0) > 0 
        THEN LEAST(2.0, (LN(NEW.dealroom_company_count + 1) / LN(max_companies + 1)) * 2)
        ELSE 0 
      END
    )::NUMERIC, 2
  );
  
  RETURN NEW;
END;
$function$;