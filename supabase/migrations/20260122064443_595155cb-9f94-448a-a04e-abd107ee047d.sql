-- Fix the refresh_technology_scores function - remove updated_at reference
CREATE OR REPLACE FUNCTION public.refresh_technology_scores(tech_keyword_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  doc_avg_trl numeric;
  doc_policy_count integer;
  web_avg_trl numeric;
  web_policy_count integer;
  total_avg_trl numeric;
  total_policy_count integer;
  total_doc_mentions integer;
  total_web_mentions integer;
BEGIN
  -- Get averages from document_technology_mentions
  SELECT 
    AVG(trl_mentioned)::numeric,
    COUNT(*) FILTER (WHERE policy_reference IS NOT NULL AND policy_reference != ''),
    COUNT(*)
  INTO doc_avg_trl, doc_policy_count, total_doc_mentions
  FROM document_technology_mentions
  WHERE keyword_id = tech_keyword_id;

  -- Get averages from web_technology_mentions  
  SELECT 
    AVG(trl_mentioned)::numeric,
    COUNT(*) FILTER (WHERE policy_reference IS NOT NULL AND policy_reference != ''),
    COUNT(*)
  INTO web_avg_trl, web_policy_count, total_web_mentions
  FROM web_technology_mentions
  WHERE keyword_id = tech_keyword_id;

  -- Calculate combined averages (weighted by mention count)
  IF COALESCE(total_doc_mentions, 0) + COALESCE(total_web_mentions, 0) > 0 THEN
    total_avg_trl := (
      COALESCE(doc_avg_trl * total_doc_mentions, 0) + 
      COALESCE(web_avg_trl * total_web_mentions, 0)
    ) / NULLIF(
      (CASE WHEN doc_avg_trl IS NOT NULL THEN total_doc_mentions ELSE 0 END) +
      (CASE WHEN web_avg_trl IS NOT NULL THEN total_web_mentions ELSE 0 END), 0
    );
  END IF;

  -- Sum policy counts from both sources
  total_policy_count := COALESCE(doc_policy_count, 0) + COALESCE(web_policy_count, 0);

  -- Update the technologies table (use last_updated instead of updated_at)
  UPDATE technologies
  SET 
    avg_trl_mentioned = total_avg_trl,
    policy_mention_count = total_policy_count,
    document_mention_count = COALESCE(total_doc_mentions, 0) + COALESCE(total_web_mentions, 0),
    last_updated = now()
  WHERE keyword_id = tech_keyword_id;
END;
$function$;