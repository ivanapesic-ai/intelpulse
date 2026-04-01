
CREATE TABLE public.cordis_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid REFERENCES public.technology_keywords(id) ON DELETE CASCADE NOT NULL,
  project_acronym text,
  project_title text NOT NULL,
  project_status text,
  start_date date,
  end_date date,
  total_cost_eur numeric,
  ec_contribution_eur numeric,
  cordis_url text,
  cordis_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(keyword_id, cordis_id)
);

ALTER TABLE public.cordis_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cordis projects" ON public.cordis_projects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage cordis projects" ON public.cordis_projects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE TABLE public.cordis_keyword_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid REFERENCES public.technology_keywords(id) ON DELETE CASCADE NOT NULL UNIQUE,
  project_count integer DEFAULT 0,
  total_funding_eur numeric DEFAULT 0,
  ec_contribution_eur numeric DEFAULT 0,
  active_projects integer DEFAULT 0,
  completed_projects integer DEFAULT 0,
  last_fetched_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cordis_keyword_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cordis summary" ON public.cordis_keyword_summary
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage cordis summary" ON public.cordis_keyword_summary
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
