
-- Research signals table for OpenAlex data (Horizon 3)
CREATE TABLE public.research_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid NOT NULL REFERENCES public.technology_keywords(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_works integer DEFAULT 0,
  works_last_5y integer DEFAULT 0,
  works_last_2y integer DEFAULT 0,
  citation_count integer DEFAULT 0,
  h_index integer DEFAULT 0,
  growth_rate_yoy numeric DEFAULT 0,
  top_institutions jsonb DEFAULT '[]'::jsonb,
  top_papers jsonb DEFAULT '[]'::jsonb,
  co_author_network jsonb DEFAULT '{}'::jsonb,
  research_score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(keyword_id, snapshot_date)
);

-- RLS
ALTER TABLE public.research_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Research signals are publicly readable"
  ON public.research_signals FOR SELECT TO public USING (true);

CREATE POLICY "Service role can manage research signals"
  ON public.research_signals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add research_score column to technologies table
ALTER TABLE public.technologies ADD COLUMN IF NOT EXISTS research_score integer DEFAULT 0;
ALTER TABLE public.technologies ADD COLUMN IF NOT EXISTS total_research_works integer DEFAULT 0;
ALTER TABLE public.technologies ADD COLUMN IF NOT EXISTS research_growth_rate numeric DEFAULT 0;
ALTER TABLE public.technologies ADD COLUMN IF NOT EXISTS research_citations integer DEFAULT 0;

-- Enable realtime for research signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_signals;
