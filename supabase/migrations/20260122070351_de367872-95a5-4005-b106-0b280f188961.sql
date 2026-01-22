-- Add position_weight and relevance_score to mention tables
ALTER TABLE web_technology_mentions ADD COLUMN IF NOT EXISTS
  position_weight integer DEFAULT 1;

ALTER TABLE web_technology_mentions ADD COLUMN IF NOT EXISTS
  relevance_score numeric DEFAULT 0.5;

ALTER TABLE document_technology_mentions ADD COLUMN IF NOT EXISTS
  position_weight integer DEFAULT 1;

ALTER TABLE document_technology_mentions ADD COLUMN IF NOT EXISTS
  relevance_score numeric DEFAULT 0.5;

-- Add aggregated scores to technologies table
ALTER TABLE technologies ADD COLUMN IF NOT EXISTS
  weighted_frequency_score numeric DEFAULT 0;

ALTER TABLE technologies ADD COLUMN IF NOT EXISTS
  avg_relevance_score numeric DEFAULT 0;

ALTER TABLE technologies ADD COLUMN IF NOT EXISTS
  document_diversity integer DEFAULT 0;

-- Update refresh_technology_scores to include new dimensions
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
  -- New Headai-style variables
  doc_weighted_freq numeric;
  web_weighted_freq numeric;
  doc_avg_relevance numeric;
  web_avg_relevance numeric;
  total_weighted_freq numeric;
  total_avg_relevance numeric;
  doc_diversity integer;
  web_diversity integer;
  total_diversity integer;
BEGIN
  -- Get averages from document_technology_mentions
  SELECT 
    AVG(trl_mentioned)::numeric,
    COUNT(*) FILTER (WHERE policy_reference IS NOT NULL AND policy_reference != ''),
    COUNT(*),
    SUM(COALESCE(position_weight, 1) * COALESCE(relevance_score, 0.5))::numeric,
    AVG(COALESCE(relevance_score, 0.5))::numeric,
    COUNT(DISTINCT document_id)
  INTO doc_avg_trl, doc_policy_count, total_doc_mentions, doc_weighted_freq, doc_avg_relevance, doc_diversity
  FROM document_technology_mentions
  WHERE keyword_id = tech_keyword_id;

  -- Get averages from web_technology_mentions  
  SELECT 
    AVG(trl_mentioned)::numeric,
    COUNT(*) FILTER (WHERE policy_reference IS NOT NULL AND policy_reference != ''),
    COUNT(*),
    SUM(COALESCE(position_weight, 1) * COALESCE(relevance_score, 0.5))::numeric,
    AVG(COALESCE(relevance_score, 0.5))::numeric,
    COUNT(DISTINCT source_url)
  INTO web_avg_trl, web_policy_count, total_web_mentions, web_weighted_freq, web_avg_relevance, web_diversity
  FROM web_technology_mentions
  WHERE keyword_id = tech_keyword_id;

  -- Calculate combined TRL average (weighted by mention count)
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

  -- Calculate Headai-style metrics
  total_weighted_freq := COALESCE(doc_weighted_freq, 0) + COALESCE(web_weighted_freq, 0);
  
  -- Weighted average of relevance scores
  IF COALESCE(total_doc_mentions, 0) + COALESCE(total_web_mentions, 0) > 0 THEN
    total_avg_relevance := (
      COALESCE(doc_avg_relevance * total_doc_mentions, 0) + 
      COALESCE(web_avg_relevance * total_web_mentions, 0)
    ) / (COALESCE(total_doc_mentions, 0) + COALESCE(total_web_mentions, 0));
  ELSE
    total_avg_relevance := 0;
  END IF;

  -- Document diversity (unique sources)
  total_diversity := COALESCE(doc_diversity, 0) + COALESCE(web_diversity, 0);

  -- Update the technologies table
  UPDATE technologies
  SET 
    avg_trl_mentioned = total_avg_trl,
    policy_mention_count = total_policy_count,
    document_mention_count = COALESCE(total_doc_mentions, 0) + COALESCE(total_web_mentions, 0),
    weighted_frequency_score = total_weighted_freq,
    avg_relevance_score = ROUND(total_avg_relevance, 2),
    document_diversity = total_diversity,
    last_updated = now()
  WHERE keyword_id = tech_keyword_id;
END;
$function$;