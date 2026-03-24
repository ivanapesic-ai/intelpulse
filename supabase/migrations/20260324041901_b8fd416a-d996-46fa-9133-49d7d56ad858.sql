CREATE TABLE public.signal_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid NOT NULL REFERENCES public.technology_keywords(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id text NOT NULL,
  source_title text NOT NULL,
  source_date date,
  target_type text NOT NULL,
  target_id text NOT NULL,
  target_title text NOT NULL,
  target_date date,
  confidence numeric DEFAULT 0.5,
  relationship_description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(keyword_id, source_type, source_id, target_type, target_id)
);

ALTER TABLE public.signal_lineage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lineage" ON public.signal_lineage FOR SELECT USING (true);
CREATE POLICY "Service role manages lineage" ON public.signal_lineage FOR ALL TO service_role USING (true) WITH CHECK (true);