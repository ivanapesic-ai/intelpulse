-- Drop existing function first
DROP FUNCTION IF EXISTS public.aggregate_document_insights(uuid);

-- Create enhanced aggregate_document_insights function
CREATE OR REPLACE FUNCTION public.aggregate_document_insights(tech_keyword_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_concept_id INTEGER;
  v_avg_trl NUMERIC;
  v_policy_count INTEGER;
  v_mention_count INTEGER;
  v_avg_confidence NUMERIC;
  v_result JSONB;
BEGIN
  -- Get the linked ontology concept
  SELECT ontology_concept_id INTO v_concept_id
  FROM technology_keywords
  WHERE id = tech_keyword_id;
  
  IF v_concept_id IS NULL THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'No ontology concept linked');
  END IF;
  
  -- Aggregate document mention stats
  SELECT 
    COALESCE(AVG(trl_mentioned), 0),
    COUNT(CASE WHEN policy_reference IS NOT NULL THEN 1 END),
    COUNT(*),
    COALESCE(AVG(confidence_score), 0)
  INTO v_avg_trl, v_policy_count, v_mention_count, v_avg_confidence
  FROM document_technology_mentions
  WHERE keyword_id = tech_keyword_id;
  
  -- Insert/Update scoring factors from document analysis
  
  -- Factor: Document Visibility (mentions count)
  INSERT INTO concept_scoring_factors (
    concept_id, keyword_id, factor_type, factor_name, factor_value, 
    score_contribution, evidence, data_source
  )
  VALUES (
    v_concept_id, tech_keyword_id, 'opportunity', 'Document Visibility',
    v_mention_count::TEXT || ' mentions',
    LEAST(2, v_mention_count::NUMERIC / 10), -- Scale: 20+ mentions = 2
    'Frequency of technology mentions across CEI documents',
    'cei_documents'
  )
  ON CONFLICT (concept_id, factor_name) 
  DO UPDATE SET 
    factor_value = EXCLUDED.factor_value,
    score_contribution = EXCLUDED.score_contribution,
    keyword_id = EXCLUDED.keyword_id;
  
  -- Factor: TRL Maturity (from document mentions)
  IF v_avg_trl > 0 THEN
    INSERT INTO concept_scoring_factors (
      concept_id, keyword_id, factor_type, factor_name, factor_value,
      score_contribution, evidence, data_source
    )
    VALUES (
      v_concept_id, tech_keyword_id, 'challenge', 'TRL Maturity',
      'TRL ' || ROUND(v_avg_trl, 1)::TEXT,
      CASE 
        WHEN v_avg_trl >= 7 THEN 2  -- Mainstream = no challenge
        WHEN v_avg_trl >= 4 THEN 1  -- Early adoption = manageable
        ELSE 0                       -- Emerging = severe challenge
      END,
      'Average TRL level from document mentions',
      'document_technology_mentions'
    )
    ON CONFLICT (concept_id, factor_name)
    DO UPDATE SET
      factor_value = EXCLUDED.factor_value,
      score_contribution = EXCLUDED.score_contribution,
      keyword_id = EXCLUDED.keyword_id;
  END IF;
  
  -- Factor: EU Policy Alignment
  IF v_policy_count > 0 THEN
    INSERT INTO concept_scoring_factors (
      concept_id, keyword_id, factor_type, factor_name, factor_value,
      score_contribution, evidence, data_source
    )
    VALUES (
      v_concept_id, tech_keyword_id, 'opportunity', 'EU Policy Alignment',
      v_policy_count::TEXT || ' policy references',
      LEAST(2, v_policy_count::NUMERIC / 3), -- Scale: 6+ policies = 2
      'Number of EU policy references in document mentions',
      'document_technology_mentions'
    )
    ON CONFLICT (concept_id, factor_name)
    DO UPDATE SET
      factor_value = EXCLUDED.factor_value,
      score_contribution = EXCLUDED.score_contribution,
      keyword_id = EXCLUDED.keyword_id;
  END IF;
  
  -- Update ontology_concepts with latest scores
  UPDATE ontology_concepts oc SET
    last_scored_at = NOW(),
    challenge_score = COALESCE((
      SELECT AVG(score_contribution) 
      FROM concept_scoring_factors 
      WHERE concept_id = v_concept_id AND factor_type = 'challenge'
    ), oc.challenge_score),
    opportunity_score = COALESCE((
      SELECT AVG(score_contribution) 
      FROM concept_scoring_factors 
      WHERE concept_id = v_concept_id AND factor_type = 'opportunity'
    ), oc.opportunity_score),
    maturity_stage = CASE
      WHEN v_avg_trl >= 7 THEN 'Mainstream'
      WHEN v_avg_trl >= 4 THEN 'Early Adoption'
      ELSE 'Emerging'
    END
  WHERE id = v_concept_id;
  
  -- Build result
  v_result := jsonb_build_object(
    'status', 'success',
    'concept_id', v_concept_id,
    'keyword_id', tech_keyword_id,
    'aggregated', jsonb_build_object(
      'avg_trl', v_avg_trl,
      'policy_count', v_policy_count,
      'mention_count', v_mention_count,
      'avg_confidence', v_avg_confidence
    )
  );
  
  RETURN v_result;
END;
$$;

-- Add unique constraint for concept_scoring_factors to support upsert (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'concept_scoring_factors_concept_factor_unique'
  ) THEN
    ALTER TABLE concept_scoring_factors 
    ADD CONSTRAINT concept_scoring_factors_concept_factor_unique 
    UNIQUE (concept_id, factor_name);
  END IF;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.aggregate_document_insights(UUID) TO authenticated, anon, service_role;