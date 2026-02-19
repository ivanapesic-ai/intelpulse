
-- Function: calculate news mention trends for technologies
-- Compares mention counts between two time windows to derive velocity
CREATE OR REPLACE FUNCTION public.get_news_trends(
  p_window_days integer DEFAULT 30,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  keyword_id uuid,
  display_name text,
  current_count bigint,
  previous_count bigint,
  trend_velocity numeric,
  trend_direction text,
  total_all_time bigint
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH current_window AS (
    SELECT 
      nkm.keyword_id as kid,
      COUNT(*) as cnt
    FROM news_keyword_matches nkm
    JOIN news_items ni ON ni.id = nkm.news_id
    WHERE ni.published_at >= now() - (p_window_days || ' days')::interval
    GROUP BY nkm.keyword_id
  ),
  previous_window AS (
    SELECT 
      nkm.keyword_id as kid,
      COUNT(*) as cnt
    FROM news_keyword_matches nkm
    JOIN news_items ni ON ni.id = nkm.news_id
    WHERE ni.published_at >= now() - (p_window_days * 2 || ' days')::interval
      AND ni.published_at < now() - (p_window_days || ' days')::interval
    GROUP BY nkm.keyword_id
  ),
  all_time AS (
    SELECT 
      nkm.keyword_id as kid,
      COUNT(*) as cnt
    FROM news_keyword_matches nkm
    GROUP BY nkm.keyword_id
  )
  SELECT 
    tk.id as keyword_id,
    tk.display_name,
    COALESCE(cw.cnt, 0) as current_count,
    COALESCE(pw.cnt, 0) as previous_count,
    CASE 
      WHEN COALESCE(pw.cnt, 0) = 0 AND COALESCE(cw.cnt, 0) > 0 THEN 100.0
      WHEN COALESCE(pw.cnt, 0) = 0 THEN 0.0
      ELSE ROUND(((COALESCE(cw.cnt, 0) - pw.cnt)::numeric / pw.cnt) * 100, 1)
    END as trend_velocity,
    CASE 
      WHEN COALESCE(cw.cnt, 0) > COALESCE(pw.cnt, 0) * 1.2 THEN 'rising'
      WHEN COALESCE(cw.cnt, 0) < COALESCE(pw.cnt, 0) * 0.8 THEN 'falling'
      ELSE 'stable'
    END as trend_direction,
    COALESCE(at.cnt, 0) as total_all_time
  FROM technology_keywords tk
  LEFT JOIN current_window cw ON cw.kid = tk.id
  LEFT JOIN previous_window pw ON pw.kid = tk.id
  LEFT JOIN all_time at ON at.kid = tk.id
  WHERE tk.is_active = true
    AND (COALESCE(cw.cnt, 0) > 0 OR COALESCE(pw.cnt, 0) > 0)
  ORDER BY COALESCE(cw.cnt, 0) DESC, trend_velocity DESC
  LIMIT p_limit;
END;
$function$;

-- Function: get weekly mention counts for a specific technology (for timeline chart)
CREATE OR REPLACE FUNCTION public.get_news_timeline(
  p_keyword_id uuid,
  p_weeks integer DEFAULT 12
)
RETURNS TABLE(
  week_start date,
  mention_count bigint
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH week_series AS (
    SELECT generate_series(
      date_trunc('week', now() - (p_weeks || ' weeks')::interval)::date,
      date_trunc('week', now())::date,
      '1 week'::interval
    )::date as week_start
  )
  SELECT 
    ws.week_start,
    COUNT(ni.id) as mention_count
  FROM week_series ws
  LEFT JOIN news_keyword_matches nkm ON nkm.keyword_id = p_keyword_id
  LEFT JOIN news_items ni ON ni.id = nkm.news_id
    AND ni.published_at >= ws.week_start::timestamp with time zone
    AND ni.published_at < (ws.week_start + 7)::timestamp with time zone
  GROUP BY ws.week_start
  ORDER BY ws.week_start;
END;
$function$;
