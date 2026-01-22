-- Add corpus rarity score column for TF-IDF
ALTER TABLE technologies ADD COLUMN IF NOT EXISTS corpus_rarity_score numeric DEFAULT 0;

-- Create TF-IDF calculation function
CREATE OR REPLACE FUNCTION public.calculate_tfidf_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_documents integer;
  max_idf numeric;
BEGIN
  -- Count unique source documents from both mention tables
  SELECT COUNT(DISTINCT source) INTO total_documents
  FROM (
    SELECT source_url as source FROM web_technology_mentions
    UNION
    SELECT document_id::text as source FROM document_technology_mentions
  ) sources;

  IF total_documents = 0 THEN
    RETURN;
  END IF;

  -- Calculate raw IDF scores
  WITH doc_frequencies AS (
    SELECT 
      keyword_id,
      COUNT(DISTINCT source) as doc_count
    FROM (
      SELECT keyword_id, source_url as source FROM web_technology_mentions
      UNION ALL
      SELECT keyword_id, document_id::text as source FROM document_technology_mentions
    ) all_mentions
    GROUP BY keyword_id
  ),
  idf_scores AS (
    SELECT 
      keyword_id,
      -- IDF = log(total_docs / doc_frequency) normalized
      CASE 
        WHEN doc_count > 0 THEN LOG(total_documents::numeric / doc_count)
        ELSE 0
      END as raw_idf
    FROM doc_frequencies
  ),
  normalized_idf AS (
    SELECT 
      keyword_id,
      -- Normalize to 0-1 range (higher = rarer = more interesting)
      CASE 
        WHEN MAX(raw_idf) OVER() > 0 THEN raw_idf / MAX(raw_idf) OVER()
        ELSE 0
      END as normalized_score
    FROM idf_scores
  )
  UPDATE technologies t
  SET corpus_rarity_score = ROUND(COALESCE(n.normalized_score, 0), 3)
  FROM normalized_idf n
  WHERE t.keyword_id = n.keyword_id;

  -- Set 0 for technologies not in any document
  UPDATE technologies SET corpus_rarity_score = 0 WHERE corpus_rarity_score IS NULL;
END;
$$;

-- Update composite score calculation to include all H11 dimensions
CREATE OR REPLACE FUNCTION public.calculate_technology_composite_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  h11_composite numeric;
BEGIN
  -- Calculate visibility_score from document_mention_count
  NEW.visibility_score := public.calculate_visibility_score(COALESCE(NEW.document_mention_count, 0));
  
  -- Calculate trl_score from avg_trl_mentioned
  NEW.trl_score := public.calculate_trl_score(NEW.avg_trl_mentioned);
  
  -- Calculate eu_alignment_score from policy_mention_count
  NEW.eu_alignment_score := public.calculate_eu_alignment_score(COALESCE(NEW.policy_mention_count, 0));
  
  -- H11 Hybrid Composite (6 dimensions, weighted)
  -- Normalize all scores to 0-1 range before combining
  h11_composite := (
    0.15 * COALESCE(NEW.avg_semantic_score, 0) +           -- KeyBERT semantic similarity
    0.15 * COALESCE(NEW.network_centrality, 0) +           -- TextRank co-occurrence
    0.10 * COALESCE(NEW.corpus_rarity_score, 0) +          -- TF-IDF rarity
    0.15 * LEAST(COALESCE(NEW.avg_relevance_score, 0), 1) + -- Position-weighted relevance
    0.15 * (COALESCE(NEW.trl_score, 0) / 2.0) +            -- TRL maturity (0-2 -> 0-1)
    0.10 * (COALESCE(NEW.eu_alignment_score, 0) / 2.0) +   -- EU policy alignment
    0.10 * (COALESCE(NEW.investment_score, 0) / 2.0) +     -- Investment maturity
    0.10 * (COALESCE(NEW.employees_score, 0) / 2.0)        -- Employee growth
  );
  
  -- Scale to 0-2 range for backward compatibility
  NEW.composite_score := ROUND(h11_composite * 2, 2);
  
  RETURN NEW;
END;
$$;