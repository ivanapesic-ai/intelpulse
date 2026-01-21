-- Add visibility_score column to technologies table
ALTER TABLE technologies ADD COLUMN IF NOT EXISTS visibility_score INTEGER DEFAULT 0;

-- Add constraint to ensure score is 0-2 (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'visibility_score_range'
  ) THEN
    ALTER TABLE technologies ADD CONSTRAINT visibility_score_range CHECK (visibility_score >= 0 AND visibility_score <= 2);
  END IF;
END $$;

-- Create or replace function to calculate visibility score from mention count
CREATE OR REPLACE FUNCTION public.calculate_visibility_score(mention_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF mention_count >= 10 THEN RETURN 2;
  ELSIF mention_count >= 3 THEN RETURN 1;
  ELSE RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update composite score trigger to use visibility_score instead of patents_score
CREATE OR REPLACE FUNCTION public.calculate_technology_composite_score()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- First calculate visibility_score from document_mention_count
  NEW.visibility_score := public.calculate_visibility_score(COALESCE(NEW.document_mention_count, 0));
  
  -- Then calculate composite using investment, employees, and visibility
  NEW.composite_score := ROUND(
    (COALESCE(NEW.investment_score, 0) + COALESCE(NEW.employees_score, 0) + COALESCE(NEW.visibility_score, 0))::numeric / 3,
    2
  );
  RETURN NEW;
END;
$function$;