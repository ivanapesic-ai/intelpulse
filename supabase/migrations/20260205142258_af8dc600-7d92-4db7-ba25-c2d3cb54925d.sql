-- Enable RLS on concept_scoring_factors table
ALTER TABLE concept_scoring_factors ENABLE ROW LEVEL SECURITY;

-- Public read access for scoring factors (transparency for all users)
CREATE POLICY "Scoring factors are viewable by everyone"
ON concept_scoring_factors
FOR SELECT
USING (true);

-- Admin-only write access for scoring factors
CREATE POLICY "Admins can manage scoring factors"
ON concept_scoring_factors
FOR ALL
USING (public.can_manage_users(auth.uid()))
WITH CHECK (public.can_manage_users(auth.uid()));