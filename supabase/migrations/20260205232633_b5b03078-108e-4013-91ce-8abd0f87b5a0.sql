-- Add a new column for log-scaled continuous composite score
-- This provides better differentiation than the integer-based generated column

ALTER TABLE technologies 
ADD COLUMN IF NOT EXISTS log_composite_score NUMERIC(4,2);

-- Create function to calculate log-scaled composite for all technologies
CREATE OR REPLACE FUNCTION public.refresh_log_composite_scores()
RETURNS TABLE(keywords_updated integer, min_score numeric, max_score numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated INTEGER := 0;
  v_min NUMERIC;
  v_max NUMERIC;
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

  -- Update with log-scaled continuous scores
  -- Weights: Funding 30%, Patents 25%, Employees 25%, Companies 20%
  UPDATE technologies t
  SET log_composite_score = ROUND(
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

  SELECT MIN(log_composite_score), MAX(log_composite_score)
  INTO v_min, v_max
  FROM technologies WHERE log_composite_score IS NOT NULL;

  RETURN QUERY SELECT v_updated, ROUND(COALESCE(v_min, 0), 2), ROUND(COALESCE(v_max, 0), 2);
END;
$function$;