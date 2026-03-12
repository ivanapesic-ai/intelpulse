
-- User watchlist: tracks which keywords each user is watching
CREATE TABLE public.user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword_id uuid REFERENCES public.technology_keywords(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, keyword_id)
);

ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- Users can only see their own watchlist
CREATE POLICY "Users can view own watchlist"
  ON public.user_watchlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to own watchlist"
  ON public.user_watchlist FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from own watchlist"
  ON public.user_watchlist FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Keyword signal snapshots: periodic metric captures for trend tracking
CREATE TABLE public.keyword_signal_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid REFERENCES public.technology_keywords(id) ON DELETE CASCADE NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  company_count integer DEFAULT 0,
  total_funding_usd bigint DEFAULT 0,
  total_patents integer DEFAULT 0,
  total_employees integer DEFAULT 0,
  news_mention_count integer DEFAULT 0,
  composite_score numeric DEFAULT 0,
  investment_score integer DEFAULT 0,
  patents_score integer DEFAULT 0,
  visibility_score integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (keyword_id, snapshot_date)
);

ALTER TABLE public.keyword_signal_snapshots ENABLE ROW LEVEL SECURITY;

-- Snapshots are publicly readable
CREATE POLICY "Anyone can view signal snapshots"
  ON public.keyword_signal_snapshots FOR SELECT
  TO public
  USING (true);

-- Only service role can insert snapshots
CREATE POLICY "Service role can manage snapshots"
  ON public.keyword_signal_snapshots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
