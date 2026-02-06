-- The sync_keyword_data_pipeline function needs SECURITY DEFINER to bypass RLS
-- Drop and recreate with proper permissions

DROP FUNCTION IF EXISTS sync_keyword_data_pipeline();

CREATE OR REPLACE FUNCTION sync_keyword_data_pipeline()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time timestamptz := clock_timestamp();
  v_mappings_synced int := 0;
  v_orphans_removed int := 0;
  v_technologies_updated int := 0;
BEGIN
  -- Step 1: Remove orphaned mappings (keywords that no longer exist or are inactive)
  DELETE FROM crunchbase_keyword_mapping ckm
  WHERE NOT EXISTS (
    SELECT 1 FROM technology_keywords tk 
    WHERE tk.id = ckm.keyword_id AND tk.is_active = true
  );
  GET DIAGNOSTICS v_orphans_removed = ROW_COUNT;

  -- Step 2: Sync mappings from crunchbase_companies.technology_keywords array
  -- Match against technology_keywords.display_name and aliases
  INSERT INTO crunchbase_keyword_mapping (company_id, keyword_id, match_source, match_confidence)
  SELECT DISTINCT 
    cc.id as company_id,
    tk.id as keyword_id,
    'auto_sync' as match_source,
    0.85 as match_confidence
  FROM crunchbase_companies cc
  CROSS JOIN LATERAL unnest(cc.technology_keywords) AS tag
  JOIN technology_keywords tk ON (
    lower(tk.display_name) = lower(tag)
    OR lower(tk.keyword) = lower(tag)
    OR tag = ANY(tk.aliases)
  )
  WHERE tk.is_active = true
  ON CONFLICT (company_id, keyword_id) DO NOTHING;
  
  GET DIAGNOSTICS v_mappings_synced = ROW_COUNT;

  -- Step 3: Aggregate stats into technologies table
  WITH aggregated AS (
    SELECT 
      tk.id as keyword_id,
      tk.display_name as name,
      COUNT(DISTINCT ckm.company_id) as company_count,
      COALESCE(SUM(cc.total_funding_usd * 0.92), 0) as total_funding_eur,
      COALESCE(SUM(
        CASE cc.number_of_employees
          WHEN '1-10' THEN 5
          WHEN '11-50' THEN 30
          WHEN '51-100' THEN 75
          WHEN '101-250' THEN 175
          WHEN '251-500' THEN 375
          WHEN '501-1000' THEN 750
          WHEN '1001-5000' THEN 3000
          WHEN '5001-10000' THEN 7500
          WHEN '10001+' THEN 15000
          ELSE 0
        END
      ), 0) as total_employees,
      COALESCE(SUM(cc.patents_count), 0) as total_patents
    FROM technology_keywords tk
    LEFT JOIN crunchbase_keyword_mapping ckm ON ckm.keyword_id = tk.id
    LEFT JOIN crunchbase_companies cc ON cc.id = ckm.company_id
    WHERE tk.is_active = true
    GROUP BY tk.id, tk.display_name
  )
  INSERT INTO technologies (keyword_id, name, dealroom_company_count, total_funding_eur, total_employees, total_patents, last_updated)
  SELECT 
    keyword_id,
    name,
    company_count,
    total_funding_eur,
    total_employees::int,
    total_patents::int,
    now()
  FROM aggregated
  ON CONFLICT (keyword_id) DO UPDATE SET
    name = EXCLUDED.name,
    dealroom_company_count = EXCLUDED.dealroom_company_count,
    total_funding_eur = EXCLUDED.total_funding_eur,
    total_employees = EXCLUDED.total_employees,
    total_patents = EXCLUDED.total_patents,
    last_updated = now();
  
  GET DIAGNOSTICS v_technologies_updated = ROW_COUNT;

  -- Step 4: Refresh composite scores
  PERFORM refresh_log_composite_scores();

  RETURN jsonb_build_object(
    'success', true,
    'mappings_synced', v_mappings_synced,
    'orphaned_mappings_removed', v_orphans_removed,
    'technologies_updated', v_technologies_updated,
    'duration_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::int
  );
END;
$$;

-- Also ensure crunchbase_keyword_mapping has a unique constraint for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'crunchbase_keyword_mapping_company_keyword_unique'
  ) THEN
    ALTER TABLE crunchbase_keyword_mapping 
    ADD CONSTRAINT crunchbase_keyword_mapping_company_keyword_unique 
    UNIQUE (company_id, keyword_id);
  END IF;
END $$;