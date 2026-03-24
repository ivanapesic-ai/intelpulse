
CREATE TABLE public.news_company_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news_items(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.crunchbase_companies(id) ON DELETE CASCADE,
  keyword_id uuid REFERENCES public.technology_keywords(id) ON DELETE SET NULL,
  match_confidence numeric DEFAULT 1.0,
  match_source text DEFAULT 'title_match',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(news_id, company_id)
);

ALTER TABLE public.news_company_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view news company mentions"
  ON public.news_company_mentions FOR SELECT
  TO public USING (true);

CREATE POLICY "Service role can manage news company mentions"
  ON public.news_company_mentions FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_news_company_mentions_news ON public.news_company_mentions(news_id);
CREATE INDEX idx_news_company_mentions_company ON public.news_company_mentions(company_id);
CREATE INDEX idx_news_company_mentions_keyword ON public.news_company_mentions(keyword_id);
