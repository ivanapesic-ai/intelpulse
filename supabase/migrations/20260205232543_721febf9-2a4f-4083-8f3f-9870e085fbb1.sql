-- Update aggregate_crunchbase_signals to use log-scaled scoring
-- This calculates continuous 0-2 scores for investment, employees, patents, and company count

CREATE OR REPLACE FUNCTION public.aggregate_crunchbase_signals()
RETURNS TABLE(keywords_processed integer, total_funding_aggregated numeric, total_patents_aggregated bigint, companies_with_data integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_keywords INTEGER := 0;
  v_funding NUMERIC := 0;
  v_patents BIGINT := 0;
  v_companies INTEGER := 0;
  -- Dataset maximums for relative scoring
  max_funding NUMERIC;
  max_patents NUMERIC;
  max_employees NUMERIC;
  max_companies NUMERIC;
BEGIN
  -- Get dataset maximums across all technologies
  WITH aggregates AS (
    SELECT 
      ckm.keyword_id,
      COALESCE(SUM(cc.total_funding_usd), 0) as total_funding,
      COALESCE(SUM(cc.patents_count), 0) as total_patents,
      COALESCE(SUM(
        CASE 
          WHEN cc.number_of_employees = '1-10' THEN 5
          WHEN cc.number_of_employees = '11-50' THEN 30
          WHEN cc.number_of_employees = '51-100' THEN 75
          WHEN cc.number_of_employees = '101-250' THEN 175
          WHEN cc.number_of_employees = '251-500' THEN 375
          WHEN cc.number_of_employees = '501-1000' THEN 750
          WHEN cc.number_of_employees = '1001-5000' THEN 3000
          WHEN cc.number_of_employees = '5001-10000' THEN 7500
          WHEN cc.number_of_employees = '10001+' THEN 15000
          ELSE 0
        END
      ), 0) as est_employees,
      COUNT(DISTINCT cc.id) as company_count
    FROM crunchbase_keyword_mapping ckm
    JOIN crunchbase_companies cc ON ckm.company_id = cc.id
    GROUP BY ckm.keyword_id
  )
  SELECT 
    GREATEST(MAX(total_funding), 1),
    GREATEST(MAX(total_patents), 1),
    GREATEST(MAX(est_employees), 1),
    GREATEST(MAX(company_count), 1)
  INTO max_funding, max_patents, max_employees, max_companies
  FROM aggregates;

  -- Aggregate signals with log-scaled scoring
  WITH company_signals AS (
    SELECT 
      ckm.keyword_id,
      COUNT(DISTINCT cc.id) as company_count,
      COALESCE(SUM(cc.total_funding_usd), 0) as total_funding,
      COALESCE(SUM(cc.patents_count), 0) as total_patents,
      COALESCE(SUM(
        CASE 
          WHEN cc.number_of_employees = '1-10' THEN 5
          WHEN cc.number_of_employees = '11-50' THEN 30
          WHEN cc.number_of_employees = '51-100' THEN 75
          WHEN cc.number_of_employees = '101-250' THEN 175
          WHEN cc.number_of_employees = '251-500' THEN 375
          WHEN cc.number_of_employees = '501-1000' THEN 750
          WHEN cc.number_of_employees = '1001-5000' THEN 3000
          WHEN cc.number_of_employees = '5001-10000' THEN 7500
          WHEN cc.number_of_employees = '10001+' THEN 15000
          ELSE 0
        END
      ), 0) as est_employees
    FROM crunchbase_keyword_mapping ckm
    JOIN crunchbase_companies cc ON ckm.company_id = cc.id
    GROUP BY ckm.keyword_id
  )
  UPDATE technologies t
  SET 
    -- Raw values (USD to EUR rough conversion 0.92)
    total_funding_eur = (cs.total_funding * 0.92)::numeric,
    total_patents = cs.total_patents,
    total_employees = cs.est_employees,
    dealroom_company_count = cs.company_count,
    
    -- LOG-SCALED SCORES (0-2 continuous, relative to dataset max)
    -- Investment score: log-scaled relative to max funding
    investment_score = CASE 
      WHEN cs.total_funding > 0 
      THEN ROUND(LEAST(2, (LN(cs.total_funding + 1) / LN(max_funding + 1)) * 2)::NUMERIC)::INTEGER
      ELSE 0
    END,
    
    -- Patents score: log-scaled relative to max patents
    patents_score = CASE 
      WHEN cs.total_patents > 0 
      THEN ROUND(LEAST(2, (LN(cs.total_patents + 1) / LN(max_patents + 1)) * 2)::NUMERIC)::INTEGER
      ELSE 0
    END,
    
    -- Employees score: log-scaled relative to max employees  
    employees_score = CASE 
      WHEN cs.est_employees > 0 
      THEN ROUND(LEAST(2, (LN(cs.est_employees + 1) / LN(max_employees + 1)) * 2)::NUMERIC)::INTEGER
      ELSE 0
    END,
    
    last_updated = now()
  FROM company_signals cs
  WHERE t.keyword_id = cs.keyword_id;

  GET DIAGNOSTICS v_keywords = ROW_COUNT;

  -- Get totals
  SELECT 
    COALESCE(SUM(total_funding_usd), 0),
    COALESCE(SUM(patents_count), 0),
    COUNT(*) FILTER (WHERE patents_count > 0 OR total_funding_usd > 0)
  INTO v_funding, v_patents, v_companies
  FROM crunchbase_companies;

  RETURN QUERY SELECT v_keywords, v_funding, v_patents, v_companies;
END;
$function$;