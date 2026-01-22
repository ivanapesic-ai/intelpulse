-- H11 Hybrid Scoring Model: KeyBERT semantic similarity + TextRank co-occurrence

-- Phase 1: Add semantic similarity columns to mention tables
ALTER TABLE web_technology_mentions 
  ADD COLUMN IF NOT EXISTS semantic_similarity numeric;

ALTER TABLE document_technology_mentions 
  ADD COLUMN IF NOT EXISTS semantic_similarity numeric;

-- Phase 2: Add aggregated scores to technologies table
ALTER TABLE technologies 
  ADD COLUMN IF NOT EXISTS avg_semantic_score numeric,
  ADD COLUMN IF NOT EXISTS network_centrality numeric;

-- Phase 3: Create co-occurrence tracking table for TextRank
CREATE TABLE IF NOT EXISTS technology_cooccurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id_a uuid NOT NULL REFERENCES technology_keywords(id) ON DELETE CASCADE,
  keyword_id_b uuid NOT NULL REFERENCES technology_keywords(id) ON DELETE CASCADE,
  cooccurrence_count integer DEFAULT 1,
  source_documents integer DEFAULT 1,
  avg_combined_relevance numeric DEFAULT 0.5,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(keyword_id_a, keyword_id_b),
  CONSTRAINT different_keywords CHECK (keyword_id_a != keyword_id_b)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cooccurrences_keyword_a ON technology_cooccurrences(keyword_id_a);
CREATE INDEX IF NOT EXISTS idx_cooccurrences_keyword_b ON technology_cooccurrences(keyword_id_b);
CREATE INDEX IF NOT EXISTS idx_cooccurrences_count ON technology_cooccurrences(cooccurrence_count DESC);

-- Enable RLS on cooccurrences table
ALTER TABLE technology_cooccurrences ENABLE ROW LEVEL SECURITY;

-- Allow public read access (analytics data)
CREATE POLICY "Allow public read access to cooccurrences"
  ON technology_cooccurrences
  FOR SELECT
  USING (true);

-- Phase 4: Create function to upsert co-occurrences
CREATE OR REPLACE FUNCTION upsert_cooccurrence(
  kw_a uuid,
  kw_b uuid,
  relevance_score numeric DEFAULT 0.5
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ordered_a uuid;
  ordered_b uuid;
BEGIN
  -- Always store in consistent order (smaller uuid first) to prevent duplicates
  IF kw_a < kw_b THEN
    ordered_a := kw_a;
    ordered_b := kw_b;
  ELSE
    ordered_a := kw_b;
    ordered_b := kw_a;
  END IF;

  INSERT INTO technology_cooccurrences (keyword_id_a, keyword_id_b, cooccurrence_count, source_documents, avg_combined_relevance, last_seen_at)
  VALUES (ordered_a, ordered_b, 1, 1, relevance_score, now())
  ON CONFLICT (keyword_id_a, keyword_id_b) DO UPDATE SET
    cooccurrence_count = technology_cooccurrences.cooccurrence_count + 1,
    source_documents = technology_cooccurrences.source_documents + 1,
    avg_combined_relevance = (technology_cooccurrences.avg_combined_relevance * technology_cooccurrences.cooccurrence_count + relevance_score) / (technology_cooccurrences.cooccurrence_count + 1),
    last_seen_at = now();
END;
$$;

-- Phase 5: Create PageRank-style network centrality calculation
CREATE OR REPLACE FUNCTION calculate_network_centrality()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  damping_factor numeric := 0.85;
  max_iterations integer := 20;
  convergence_threshold numeric := 0.0001;
  iteration integer := 0;
  max_delta numeric;
  total_nodes integer;
BEGIN
  -- Get total number of technologies with co-occurrences
  SELECT COUNT(DISTINCT keyword_id) INTO total_nodes
  FROM (
    SELECT keyword_id_a as keyword_id FROM technology_cooccurrences
    UNION
    SELECT keyword_id_b as keyword_id FROM technology_cooccurrences
  ) nodes;

  IF total_nodes = 0 THEN
    RETURN;
  END IF;

  -- Create temp table for iterative calculation
  CREATE TEMP TABLE IF NOT EXISTS temp_centrality (
    keyword_id uuid PRIMARY KEY,
    score numeric DEFAULT 0,
    new_score numeric DEFAULT 0
  );
  TRUNCATE temp_centrality;

  -- Initialize all nodes with equal score (1/N)
  INSERT INTO temp_centrality (keyword_id, score, new_score)
  SELECT keyword_id, 1.0 / total_nodes, 0
  FROM (
    SELECT keyword_id_a as keyword_id FROM technology_cooccurrences
    UNION
    SELECT keyword_id_b as keyword_id FROM technology_cooccurrences
  ) nodes;

  -- Iterative PageRank calculation
  WHILE iteration < max_iterations LOOP
    -- Reset new scores
    UPDATE temp_centrality SET new_score = (1 - damping_factor) / total_nodes;

    -- Calculate contribution from neighbors (weighted by co-occurrence strength)
    WITH edge_weights AS (
      SELECT 
        keyword_id_a, 
        keyword_id_b,
        cooccurrence_count::numeric / NULLIF(
          SUM(cooccurrence_count) OVER (PARTITION BY keyword_id_a), 0
        ) as weight_ab,
        cooccurrence_count::numeric / NULLIF(
          SUM(cooccurrence_count) OVER (PARTITION BY keyword_id_b), 0
        ) as weight_ba
      FROM technology_cooccurrences
    ),
    contributions AS (
      -- Contribution from A to B
      SELECT 
        ew.keyword_id_b as target,
        SUM(tc.score * ew.weight_ab * damping_factor) as contrib
      FROM edge_weights ew
      JOIN temp_centrality tc ON tc.keyword_id = ew.keyword_id_a
      GROUP BY ew.keyword_id_b
      
      UNION ALL
      
      -- Contribution from B to A (bidirectional)
      SELECT 
        ew.keyword_id_a as target,
        SUM(tc.score * ew.weight_ba * damping_factor) as contrib
      FROM edge_weights ew
      JOIN temp_centrality tc ON tc.keyword_id = ew.keyword_id_b
      GROUP BY ew.keyword_id_a
    )
    UPDATE temp_centrality tc
    SET new_score = tc.new_score + COALESCE((
      SELECT SUM(contrib) FROM contributions c WHERE c.target = tc.keyword_id
    ), 0);

    -- Check convergence
    SELECT MAX(ABS(new_score - score)) INTO max_delta FROM temp_centrality;
    
    -- Update scores for next iteration
    UPDATE temp_centrality SET score = new_score;
    
    iteration := iteration + 1;
    
    IF max_delta < convergence_threshold THEN
      EXIT;
    END IF;
  END LOOP;

  -- Normalize scores to 0-1 range and update technologies table
  WITH normalized AS (
    SELECT 
      keyword_id,
      (score - MIN(score) OVER()) / NULLIF(MAX(score) OVER() - MIN(score) OVER(), 0) as normalized_score
    FROM temp_centrality
  )
  UPDATE technologies t
  SET network_centrality = ROUND(COALESCE(n.normalized_score, 0), 3)
  FROM normalized n
  WHERE t.keyword_id = n.keyword_id;

  -- Set 0 for technologies not in the network
  UPDATE technologies SET network_centrality = 0 WHERE network_centrality IS NULL;

  DROP TABLE IF EXISTS temp_centrality;
END;
$$;

-- Phase 6: Update refresh_technology_scores to include semantic and network scores
CREATE OR REPLACE FUNCTION public.refresh_technology_scores(tech_keyword_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  doc_avg_trl numeric;
  doc_policy_count integer;
  web_avg_trl numeric;
  web_policy_count integer;
  total_avg_trl numeric;
  total_policy_count integer;
  total_doc_mentions integer;
  total_web_mentions integer;
  -- H11 scoring variables
  doc_weighted_freq numeric;
  web_weighted_freq numeric;
  doc_avg_relevance numeric;
  web_avg_relevance numeric;
  total_weighted_freq numeric;
  total_avg_relevance numeric;
  doc_diversity integer;
  web_diversity integer;
  total_diversity integer;
  -- KeyBERT semantic scoring
  doc_avg_semantic numeric;
  web_avg_semantic numeric;
  total_avg_semantic numeric;
BEGIN
  -- Get averages from document_technology_mentions
  SELECT 
    AVG(trl_mentioned)::numeric,
    COUNT(*) FILTER (WHERE policy_reference IS NOT NULL AND policy_reference != ''),
    COUNT(*),
    SUM(COALESCE(position_weight, 1) * COALESCE(relevance_score, 0.5))::numeric,
    AVG(COALESCE(relevance_score, 0.5))::numeric,
    COUNT(DISTINCT document_id),
    AVG(semantic_similarity)::numeric
  INTO doc_avg_trl, doc_policy_count, total_doc_mentions, doc_weighted_freq, doc_avg_relevance, doc_diversity, doc_avg_semantic
  FROM document_technology_mentions
  WHERE keyword_id = tech_keyword_id;

  -- Get averages from web_technology_mentions  
  SELECT 
    AVG(trl_mentioned)::numeric,
    COUNT(*) FILTER (WHERE policy_reference IS NOT NULL AND policy_reference != ''),
    COUNT(*),
    SUM(COALESCE(position_weight, 1) * COALESCE(relevance_score, 0.5))::numeric,
    AVG(COALESCE(relevance_score, 0.5))::numeric,
    COUNT(DISTINCT source_url),
    AVG(semantic_similarity)::numeric
  INTO web_avg_trl, web_policy_count, total_web_mentions, web_weighted_freq, web_avg_relevance, web_diversity, web_avg_semantic
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

  -- Calculate H11 metrics
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

  -- Calculate KeyBERT semantic score average
  IF COALESCE(total_doc_mentions, 0) + COALESCE(total_web_mentions, 0) > 0 THEN
    total_avg_semantic := (
      COALESCE(doc_avg_semantic * total_doc_mentions, 0) + 
      COALESCE(web_avg_semantic * total_web_mentions, 0)
    ) / NULLIF(
      (CASE WHEN doc_avg_semantic IS NOT NULL THEN total_doc_mentions ELSE 0 END) +
      (CASE WHEN web_avg_semantic IS NOT NULL THEN total_web_mentions ELSE 0 END), 0
    );
  ELSE
    total_avg_semantic := NULL;
  END IF;

  -- Update the technologies table
  UPDATE technologies
  SET 
    avg_trl_mentioned = total_avg_trl,
    policy_mention_count = total_policy_count,
    document_mention_count = COALESCE(total_doc_mentions, 0) + COALESCE(total_web_mentions, 0),
    weighted_frequency_score = total_weighted_freq,
    avg_relevance_score = ROUND(total_avg_relevance, 2),
    document_diversity = total_diversity,
    avg_semantic_score = ROUND(COALESCE(total_avg_semantic, 0), 3),
    last_updated = now()
  WHERE keyword_id = tech_keyword_id;
END;
$$;

-- Add comment documenting the H11 model
COMMENT ON TABLE technology_cooccurrences IS 'TextRank co-occurrence data for H11 network centrality scoring';
COMMENT ON COLUMN technologies.avg_semantic_score IS 'H11 KeyBERT-style semantic similarity average (0-1)';
COMMENT ON COLUMN technologies.network_centrality IS 'H11 TextRank network centrality score (0-1)';