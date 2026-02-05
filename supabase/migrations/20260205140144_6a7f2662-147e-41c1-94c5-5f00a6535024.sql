-- Fix the is_sdv_company function to be smarter about exclusions
-- Keep EV aviation companies, exclude pure airlines
CREATE OR REPLACE FUNCTION public.is_sdv_company(company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM crunchbase_companies c
    WHERE c.id = company_id
    AND (
      -- Exclude pure airlines (but not if they have EV/Electric Vehicle in industries)
      (('Airlines' = ANY(c.industries) OR 'Airline' = ANY(c.industries)) 
       AND NOT 'Electric Vehicle' = ANY(c.industries))
      OR
      -- Exclude pure shipping/maritime (non-automotive)
      (('Shipping' = ANY(c.industries) OR 'Ocean Freight' = ANY(c.industries) OR 'Maritime' = ANY(c.industries))
       AND NOT 'Electric Vehicle' = ANY(c.industries)
       AND NOT 'Automotive' = ANY(c.industries))
      OR
      -- Exclude pure warehousing (unless logistics tech)
      (('Warehousing' = ANY(c.industries) OR 'Warehouse' = ANY(c.industries))
       AND NOT 'Logistics' = ANY(c.industries)
       AND NOT 'Supply Chain' = ANY(c.industries)
       AND NOT 'Automotive' = ANY(c.industries))
    )
  );
$$;

-- Fix calculate_co_scores to have proper search_path
CREATE OR REPLACE FUNCTION public.calculate_co_scores(tech_keyword_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_investment_score int;
  v_employees_score int;
  v_trl_score int;
  v_patents_score int;
  v_document_count int;
  v_policy_count int;
  v_avg_trl numeric;
  v_funding numeric;
  v_challenge int;
  v_opportunity int;
BEGIN
  SELECT 
    COALESCE(investment_score, 0),
    COALESCE(employees_score, 0),
    COALESCE(trl_score, 0),
    COALESCE(patents_score, 0),
    COALESCE(document_mention_count, 0),
    COALESCE(policy_mention_count, 0),
    COALESCE(avg_trl_mentioned, 5),
    COALESCE(total_funding_eur, 0)
  INTO v_investment_score, v_employees_score, v_trl_score, v_patents_score, 
       v_document_count, v_policy_count, v_avg_trl, v_funding
  FROM technologies
  WHERE keyword_id = tech_keyword_id;

  -- CHALLENGE: 0=Severe, 1=Manageable, 2=No Major Challenge
  v_challenge := ROUND(
    (
      CASE WHEN v_avg_trl >= 7 THEN 2 WHEN v_avg_trl >= 5 THEN 1 ELSE 0 END +
      v_patents_score +
      v_investment_score
    )::numeric / 3
  );

  -- OPPORTUNITY: 0=Limited, 1=Promising, 2=High
  v_opportunity := ROUND(
    (
      v_investment_score +
      v_employees_score +
      CASE WHEN v_document_count >= 10 THEN 2 WHEN v_document_count >= 3 THEN 1 ELSE 0 END
    )::numeric / 3
  );

  v_challenge := GREATEST(0, LEAST(2, v_challenge));
  v_opportunity := GREATEST(0, LEAST(2, v_opportunity));

  UPDATE technologies
  SET challenge_score = v_challenge, opportunity_score = v_opportunity, last_updated = now()
  WHERE keyword_id = tech_keyword_id;
END;
$$;