-- Add unique constraint on keyword_id for upsert to work
ALTER TABLE public.technologies ADD CONSTRAINT technologies_keyword_id_key UNIQUE (keyword_id);

-- Also create composite score column calculation
CREATE OR REPLACE FUNCTION public.calculate_technology_composite_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.composite_score := ROUND(
    (COALESCE(NEW.investment_score, 0) + COALESCE(NEW.employees_score, 0) + COALESCE(NEW.patents_score, 0))::numeric / 3,
    2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_composite_score_trigger
BEFORE INSERT OR UPDATE ON public.technologies
FOR EACH ROW
EXECUTE FUNCTION public.calculate_technology_composite_score();