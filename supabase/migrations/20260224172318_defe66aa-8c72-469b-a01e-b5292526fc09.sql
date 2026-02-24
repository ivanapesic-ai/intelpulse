
-- Table for international standards linked to technology keywords
CREATE TABLE public.keyword_standards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id uuid NOT NULL REFERENCES public.technology_keywords(id) ON DELETE CASCADE,
  standard_code text NOT NULL,           -- e.g. "ISO 15118", "IEC 61851"
  standard_title text NOT NULL,          -- e.g. "Road vehicles — Vehicle to grid communication interface"
  issuing_body text NOT NULL,            -- e.g. "ISO", "IEC", "IEEE", "ETSI", "ITU"
  body_type text NOT NULL DEFAULT 'sdo', -- 'sdo' (standards dev org) or 'consortia' (private consortia)
  url text,                              -- link to standard page
  description text,                      -- brief description of relevance
  status text DEFAULT 'active',          -- 'active', 'draft', 'withdrawn'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(keyword_id, standard_code)
);

-- Enable RLS
ALTER TABLE public.keyword_standards ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view keyword standards"
  ON public.keyword_standards FOR SELECT USING (true);

-- Admin/superadmin manage
CREATE POLICY "Admins can manage keyword standards"
  ON public.keyword_standards FOR ALL
  USING (can_manage_users(auth.uid()))
  WITH CHECK (can_manage_users(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_keyword_standards_updated_at
  BEFORE UPDATE ON public.keyword_standards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
