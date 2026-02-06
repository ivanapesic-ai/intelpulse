-- Align Signal 3 (Market Response) to combine Crunchbase article volume + live RSS matches

CREATE OR REPLACE FUNCTION public.calculate_market_response_score(p_keyword_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_cb_articles integer := 0;
  v_rss_count integer := 0;
BEGIN
  IF p_keyword_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(cc.number_of_articles), 0)::integer
  INTO v_cb_articles
  FROM public.crunchbase_keyword_mapping ckm
  JOIN public.crunchbase_companies cc ON cc.id = ckm.company_id
  WHERE ckm.keyword_id = p_keyword_id;

  SELECT COUNT(*)::integer
  INTO v_rss_count
  FROM public.news_keyword_matches
  WHERE keyword_id = p_keyword_id;

  -- Thresholds (as agreed):
  -- 2 = Strong: >5,000 Crunchbase articles OR >30 RSS matches
  -- 1 = Moderate: >500 Crunchbase articles OR >5 RSS matches
  IF (v_cb_articles > 5000) OR (v_rss_count > 30) THEN
    RETURN 2;
  ELSIF (v_cb_articles > 500) OR (v_rss_count > 5) THEN
    RETURN 1;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_market_response_count(p_keyword_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_cb_articles integer := 0;
  v_rss_count integer := 0;
BEGIN
  IF p_keyword_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(cc.number_of_articles), 0)::integer
  INTO v_cb_articles
  FROM public.crunchbase_keyword_mapping ckm
  JOIN public.crunchbase_companies cc ON cc.id = ckm.company_id
  WHERE ckm.keyword_id = p_keyword_id;

  SELECT COUNT(*)::integer
  INTO v_rss_count
  FROM public.news_keyword_matches
  WHERE keyword_id = p_keyword_id;

  -- Store a single comparable count in technologies.news_mention_count:
  --   RSS matches (real-time) + scaled Crunchbase article volume (historical)
  -- Scaling: 100 articles ~ 1 unit, capped at +200 to prevent domination.
  RETURN v_rss_count + LEAST((v_cb_articles / 100), 200);
END;
$$;

-- Update trigger-based derived fields to use Market Response (not document mentions)
CREATE OR REPLACE FUNCTION public.calculate_technology_composite_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
  FROM public.technologies;

  -- Signal 3: Market Response (Crunchbase + RSS)
  NEW.news_mention_count := public.calculate_market_response_count(NEW.keyword_id);
  NEW.visibility_score := public.calculate_market_response_score(NEW.keyword_id);

  -- Keep TRL + EU alignment derived from document analysis
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
$$;