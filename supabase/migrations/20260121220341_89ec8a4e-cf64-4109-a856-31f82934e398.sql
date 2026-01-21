-- Add TRL and EU Alignment score columns to technologies table
ALTER TABLE technologies ADD COLUMN IF NOT EXISTS trl_score INTEGER DEFAULT 0;
ALTER TABLE technologies ADD COLUMN IF NOT EXISTS eu_alignment_score INTEGER DEFAULT 0;
ALTER TABLE technologies ADD COLUMN IF NOT EXISTS avg_trl_mentioned NUMERIC DEFAULT NULL;
ALTER TABLE technologies ADD COLUMN IF NOT EXISTS policy_mention_count INTEGER DEFAULT 0;

-- Add constraints for score ranges
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trl_score_range') THEN
    ALTER TABLE technologies ADD CONSTRAINT trl_score_range CHECK (trl_score >= 0 AND trl_score <= 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'eu_alignment_score_range') THEN
    ALTER TABLE technologies ADD CONSTRAINT eu_alignment_score_range CHECK (eu_alignment_score >= 0 AND eu_alignment_score <= 2);
  END IF;
END $$;

-- Create function to calculate TRL score from average TRL mentioned
-- TRL 7-9 = mature (score 2), TRL 4-6 = developing (score 1), TRL 1-3 = early (score 0)
CREATE OR REPLACE FUNCTION public.calculate_trl_score(avg_trl NUMERIC)
RETURNS INTEGER AS $$
BEGIN
  IF avg_trl IS NULL THEN RETURN 0;
  ELSIF avg_trl >= 7 THEN RETURN 2;
  ELSIF avg_trl >= 4 THEN RETURN 1;
  ELSE RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate EU Alignment score from policy mention count
-- 5+ policy mentions = high alignment (2), 2-4 = medium (1), 0-1 = low (0)
CREATE OR REPLACE FUNCTION public.calculate_eu_alignment_score(policy_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF policy_count >= 5 THEN RETURN 2;
  ELSIF policy_count >= 2 THEN RETURN 1;
  ELSE RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update composite score trigger to use all 4 dimensions
CREATE OR REPLACE FUNCTION public.calculate_technology_composite_score()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculate visibility_score from document_mention_count
  NEW.visibility_score := public.calculate_visibility_score(COALESCE(NEW.document_mention_count, 0));
  
  -- Calculate trl_score from avg_trl_mentioned
  NEW.trl_score := public.calculate_trl_score(NEW.avg_trl_mentioned);
  
  -- Calculate eu_alignment_score from policy_mention_count
  NEW.eu_alignment_score := public.calculate_eu_alignment_score(COALESCE(NEW.policy_mention_count, 0));
  
  -- Calculate 4-dimension composite (Investment + Employees + TRL + EU Alignment) / 4
  -- Note: Visibility feeds into the overall picture but we use the 4 core dimensions from proposal
  NEW.composite_score := ROUND(
    (COALESCE(NEW.investment_score, 0) + 
     COALESCE(NEW.employees_score, 0) + 
     COALESCE(NEW.trl_score, 0) + 
     COALESCE(NEW.eu_alignment_score, 0))::numeric / 4,
    2
  );
  RETURN NEW;
END;
$function$;