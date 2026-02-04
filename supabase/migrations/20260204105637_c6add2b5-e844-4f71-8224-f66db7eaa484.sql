-- Create function to aggregate patent counts from crunchbase_companies to technologies via keyword mappings
CREATE OR REPLACE FUNCTION public.aggregate_patent_scores()
RETURNS TABLE(keywords_updated integer, total_patents_aggregated bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_keywords_updated INTEGER := 0;
  v_total_patents BIGINT := 0;
BEGIN
  -- Update technologies table with aggregated patent data from crunchbase companies
  WITH patent_aggregates AS (
    SELECT 
      ckm.keyword_id,
      COUNT(DISTINCT cc.id) as company_count,
      COALESCE(SUM(cc.patents_count), 0) as total_patents,
      COALESCE(AVG(cc.patents_count) FILTER (WHERE cc.patents_count > 0), 0) as avg_patents
    FROM crunchbase_keyword_mapping ckm
    JOIN crunchbase_companies cc ON ckm.company_id = cc.id
    WHERE cc.patents_count IS NOT NULL AND cc.patents_count > 0
    GROUP BY ckm.keyword_id
  )
  UPDATE technologies t
  SET 
    total_patents = pa.total_patents,
    patents_score = CASE 
      WHEN pa.total_patents >= 100 THEN 2
      WHEN pa.total_patents >= 20 THEN 1
      ELSE 0
    END,
    last_updated = now()
  FROM patent_aggregates pa
  WHERE t.keyword_id = pa.keyword_id;

  GET DIAGNOSTICS v_keywords_updated = ROW_COUNT;

  -- Get total patents aggregated
  SELECT COALESCE(SUM(patents_count), 0) INTO v_total_patents
  FROM crunchbase_companies
  WHERE patents_count > 0;

  RETURN QUERY SELECT v_keywords_updated, v_total_patents;
END;
$function$;

-- Create function to refresh all market signals from Crunchbase data
CREATE OR REPLACE FUNCTION public.aggregate_crunchbase_signals()
RETURNS TABLE(
  keywords_processed integer, 
  total_funding_aggregated numeric,
  total_patents_aggregated bigint,
  companies_with_data integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_keywords INTEGER := 0;
  v_funding NUMERIC := 0;
  v_patents BIGINT := 0;
  v_companies INTEGER := 0;
BEGIN
  -- Aggregate all signals from crunchbase_companies to technologies
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
    -- USD to EUR rough conversion (0.92)
    total_funding_eur = (cs.total_funding * 0.92)::numeric,
    total_patents = cs.total_patents,
    total_employees = cs.est_employees,
    dealroom_company_count = cs.company_count,
    -- Score calculations (0-2 scale)
    investment_score = CASE 
      WHEN cs.total_funding >= 500000000 THEN 2  -- $500M+
      WHEN cs.total_funding >= 50000000 THEN 1   -- $50M+
      ELSE 0
    END,
    patents_score = CASE 
      WHEN cs.total_patents >= 100 THEN 2
      WHEN cs.total_patents >= 20 THEN 1
      ELSE 0
    END,
    employees_score = CASE 
      WHEN cs.est_employees >= 5000 THEN 2
      WHEN cs.est_employees >= 500 THEN 1
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