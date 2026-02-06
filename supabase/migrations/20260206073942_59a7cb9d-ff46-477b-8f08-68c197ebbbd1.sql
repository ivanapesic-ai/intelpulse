
-- Create a unified sync function that handles the entire data pipeline
-- technology_keywords (source of truth) → crunchbase_keyword_mapping → technologies

CREATE OR REPLACE FUNCTION sync_keyword_data_pipeline()
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_mappings_created int := 0;
  v_mappings_deleted int := 0;
  v_technologies_updated int := 0;
  v_start_time timestamptz := clock_timestamp();
BEGIN
  -- Step 1: Sync crunchbase_keyword_mapping from company technology_keywords arrays
  -- First, remove orphaned mappings where keyword no longer active
  DELETE FROM crunchbase_keyword_mapping ckm
  WHERE NOT EXISTS (
    SELECT 1 FROM technology_keywords tk 
    WHERE tk.id = ckm.keyword_id AND tk.is_active = true
  );
  GET DIAGNOSTICS v_mappings_deleted = ROW_COUNT;
  
  -- Step 2: Insert/update mappings based on company keyword arrays
  -- Match by display_name or aliases
  INSERT INTO crunchbase_keyword_mapping (company_id, keyword_id, match_source, match_confidence)
  SELECT DISTINCT
    cc.id as company_id,
    tk.id as keyword_id,
    'pipeline_sync' as match_source,
    CASE 
      WHEN cc_kw = tk.display_name THEN 95
      WHEN cc_kw = ANY(tk.aliases) THEN 85
      ELSE 75
    END as match_confidence
  FROM crunchbase_companies cc
  CROSS JOIN LATERAL unnest(cc.technology_keywords) as cc_kw
  JOIN technology_keywords tk ON (
    lower(cc_kw) = lower(tk.display_name)
    OR lower(cc_kw) = ANY(SELECT lower(unnest(tk.aliases)))
    OR lower(tk.display_name) = ANY(SELECT lower(unnest(cc.technology_keywords)))
  )
  WHERE tk.is_active = true
  ON CONFLICT (company_id, keyword_id) 
  DO UPDATE SET 
    match_source = 'pipeline_sync',
    match_confidence = EXCLUDED.match_confidence,
    created_at = now();
  GET DIAGNOSTICS v_mappings_created = ROW_COUNT;
  
  -- Step 3: Sync technologies table with aggregated data from junction
  -- First ensure all active keywords have a technologies row
  INSERT INTO technologies (name, keyword_id)
  SELECT tk.display_name, tk.id
  FROM technology_keywords tk
  WHERE tk.is_active = true
  AND NOT EXISTS (SELECT 1 FROM technologies t WHERE t.keyword_id = tk.id)
  ON CONFLICT (keyword_id) DO NOTHING;
  
  -- Step 4: Update technologies with aggregated Crunchbase data
  UPDATE technologies t
  SET 
    dealroom_company_count = agg.company_count,
    total_funding_eur = agg.total_funding,
    total_employees = agg.total_employees,
    total_patents = agg.total_patents,
    last_updated = now()
  FROM (
    SELECT 
      ckm.keyword_id,
      COUNT(DISTINCT cc.id) as company_count,
      COALESCE(SUM(cc.total_funding_usd * 0.92), 0) as total_funding, -- Convert USD to EUR
      COALESCE(SUM(
        CASE 
          WHEN cc.number_of_employees ~ '^\d+$' THEN cc.number_of_employees::int
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
      ), 0) as total_employees,
      COALESCE(SUM(cc.patents_count), 0) as total_patents
    FROM crunchbase_keyword_mapping ckm
    JOIN crunchbase_companies cc ON cc.id = ckm.company_id
    GROUP BY ckm.keyword_id
  ) agg
  WHERE t.keyword_id = agg.keyword_id;
  GET DIAGNOSTICS v_technologies_updated = ROW_COUNT;
  
  -- Step 5: Recalculate log composite scores
  PERFORM refresh_log_composite_scores();
  
  RETURN jsonb_build_object(
    'success', true,
    'mappings_synced', v_mappings_created,
    'orphaned_mappings_removed', v_mappings_deleted,
    'technologies_updated', v_technologies_updated,
    'duration_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::int
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sync_keyword_data_pipeline() TO anon, authenticated;
