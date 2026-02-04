-- Create crunchbase_companies table for Signal 1 (Investment) data
CREATE TABLE public.crunchbase_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  crunchbase_url TEXT,
  website TEXT,
  description TEXT,
  full_description TEXT,
  hq_location TEXT,
  hq_country TEXT,
  founded_date DATE,
  operating_status TEXT,
  industries TEXT[] DEFAULT '{}',
  industry_groups TEXT[] DEFAULT '{}',
  total_funding_usd BIGINT DEFAULT 0,
  last_funding_date DATE,
  last_funding_type TEXT,
  funding_rounds_count INT DEFAULT 0,
  top_5_investors TEXT[] DEFAULT '{}',
  lead_investors TEXT[] DEFAULT '{}',
  investor_count INT DEFAULT 0,
  number_of_employees TEXT,
  number_of_articles INT DEFAULT 0,
  patents_count INT DEFAULT 0,
  technology_keywords TEXT[] DEFAULT '{}',
  data_quality_score INT DEFAULT 0,
  source_export TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT crunchbase_companies_unique_org UNIQUE(organization_name, crunchbase_url)
);

-- Create indexes for performance
CREATE INDEX idx_crunchbase_org_name ON public.crunchbase_companies(organization_name);
CREATE INDEX idx_crunchbase_tech_keywords ON public.crunchbase_companies USING GIN(technology_keywords);
CREATE INDEX idx_crunchbase_funding ON public.crunchbase_companies(total_funding_usd DESC);
CREATE INDEX idx_crunchbase_country ON public.crunchbase_companies(hq_country);
CREATE INDEX idx_crunchbase_articles ON public.crunchbase_companies(number_of_articles DESC);

-- Create junction table for linking Crunchbase companies to CEI keywords
CREATE TABLE public.crunchbase_keyword_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.crunchbase_companies(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES public.technology_keywords(id) ON DELETE CASCADE,
  match_confidence INT DEFAULT 100,
  match_source TEXT DEFAULT 'auto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_company_keyword UNIQUE(company_id, keyword_id)
);

CREATE INDEX idx_crunchbase_keyword_company ON public.crunchbase_keyword_mapping(company_id);
CREATE INDEX idx_crunchbase_keyword_keyword ON public.crunchbase_keyword_mapping(keyword_id);

-- Create import logs table
CREATE TABLE public.crunchbase_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  total_rows INT DEFAULT 0,
  imported_rows INT DEFAULT 0,
  skipped_rows INT DEFAULT 0,
  error_rows INT DEFAULT 0,
  companies_with_keywords INT DEFAULT 0,
  keyword_distribution JSONB DEFAULT '{}',
  data_quality_summary JSONB DEFAULT '{}',
  errors JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.crunchbase_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crunchbase_keyword_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crunchbase_import_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (public read for demo, would restrict in production)
CREATE POLICY "Public read access for crunchbase_companies"
  ON public.crunchbase_companies FOR SELECT
  USING (true);

CREATE POLICY "Public insert for crunchbase_companies"
  ON public.crunchbase_companies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update for crunchbase_companies"
  ON public.crunchbase_companies FOR UPDATE
  USING (true);

CREATE POLICY "Public read for crunchbase_keyword_mapping"
  ON public.crunchbase_keyword_mapping FOR SELECT
  USING (true);

CREATE POLICY "Public insert for crunchbase_keyword_mapping"
  ON public.crunchbase_keyword_mapping FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public read for crunchbase_import_logs"
  ON public.crunchbase_import_logs FOR SELECT
  USING (true);

CREATE POLICY "Public insert for crunchbase_import_logs"
  ON public.crunchbase_import_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update for crunchbase_import_logs"
  ON public.crunchbase_import_logs FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_crunchbase_companies_updated_at
  BEFORE UPDATE ON public.crunchbase_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();