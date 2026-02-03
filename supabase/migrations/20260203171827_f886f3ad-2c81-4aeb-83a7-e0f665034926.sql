
-- Create function to populate technology co-occurrences based on shared companies
-- Only considers "quality" companies (with funding OR employees > 10)
CREATE OR REPLACE FUNCTION public.populate_cooccurrences_from_companies()
RETURNS TABLE(
  pairs_created integer,
  pairs_updated integer,
  quality_companies_used integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pairs_created INTEGER := 0;
  v_pairs_updated INTEGER := 0;
  v_quality_companies INTEGER := 0;
BEGIN
  -- Count quality companies
  SELECT COUNT(*) INTO v_quality_companies
  FROM dealroom_companies
  WHERE total_funding_eur > 0 OR employees_count > 10;

  -- Create temp table of quality company-keyword pairs
  CREATE TEMP TABLE IF NOT EXISTS temp_quality_pairs AS
  SELECT DISTINCT 
    kcm.keyword_id,
    kcm.company_id
  FROM keyword_company_mapping kcm
  JOIN dealroom_companies dc ON kcm.company_id = dc.id
  WHERE dc.total_funding_eur > 0 OR dc.employees_count > 10;

  -- Insert/update co-occurrences based on shared quality companies
  WITH company_tech_pairs AS (
    SELECT 
      LEAST(p1.keyword_id, p2.keyword_id) as keyword_id_a,
      GREATEST(p1.keyword_id, p2.keyword_id) as keyword_id_b,
      COUNT(DISTINCT p1.company_id) as shared_count
    FROM temp_quality_pairs p1
    JOIN temp_quality_pairs p2 ON p1.company_id = p2.company_id AND p1.keyword_id < p2.keyword_id
    GROUP BY 1, 2
    HAVING COUNT(DISTINCT p1.company_id) >= 1
  )
  INSERT INTO technology_cooccurrences (keyword_id_a, keyword_id_b, cooccurrence_count, source_documents, avg_combined_relevance, last_seen_at)
  SELECT 
    keyword_id_a,
    keyword_id_b,
    shared_count,
    shared_count, -- using company count as document proxy
    0.7, -- base relevance for company-derived connections
    now()
  FROM company_tech_pairs
  ON CONFLICT (keyword_id_a, keyword_id_b) DO UPDATE SET
    cooccurrence_count = EXCLUDED.cooccurrence_count,
    source_documents = EXCLUDED.source_documents,
    last_seen_at = now();

  GET DIAGNOSTICS v_pairs_created = ROW_COUNT;

  DROP TABLE IF EXISTS temp_quality_pairs;

  RETURN QUERY SELECT v_pairs_created, v_pairs_updated, v_quality_companies;
END;
$$;

-- Add is_quality_company column for filtering
ALTER TABLE dealroom_companies 
ADD COLUMN IF NOT EXISTS is_quality_company boolean 
GENERATED ALWAYS AS (total_funding_eur > 0 OR employees_count > 10) STORED;

-- Create index for quality filtering
CREATE INDEX IF NOT EXISTS idx_dealroom_quality ON dealroom_companies (is_quality_company) WHERE is_quality_company = true;
