-- Allow authenticated users to delete and update crunchbase_keyword_mapping
CREATE POLICY "Authenticated delete for crunchbase_keyword_mapping"
  ON public.crunchbase_keyword_mapping
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated update for crunchbase_keyword_mapping"
  ON public.crunchbase_keyword_mapping
  FOR UPDATE
  TO authenticated
  USING (true);