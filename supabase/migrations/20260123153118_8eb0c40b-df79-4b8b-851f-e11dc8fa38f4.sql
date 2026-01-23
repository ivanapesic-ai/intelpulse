-- Create table to store complete Dealroom taxonomy
CREATE TABLE public.dealroom_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_type TEXT NOT NULL, -- 'industry', 'sub_industry', 'technology', 'tag'
  name TEXT NOT NULL,
  slug TEXT, -- URL-friendly version if provided by API
  parent_name TEXT, -- for sub-industries (their parent industry)
  dealroom_id TEXT, -- if Dealroom provides IDs
  description TEXT, -- if available
  company_count INTEGER, -- how many companies in Dealroom use this
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(taxonomy_type, name)
);

-- Enable RLS
ALTER TABLE public.dealroom_taxonomy ENABLE ROW LEVEL SECURITY;

-- Public read access (taxonomy is public reference data)
CREATE POLICY "Dealroom taxonomy is publicly readable" 
ON public.dealroom_taxonomy 
FOR SELECT 
USING (true);

-- Only service role can modify (via edge functions)
CREATE POLICY "Service role can manage taxonomy" 
ON public.dealroom_taxonomy 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create index for efficient lookups
CREATE INDEX idx_dealroom_taxonomy_type ON public.dealroom_taxonomy(taxonomy_type);
CREATE INDEX idx_dealroom_taxonomy_name ON public.dealroom_taxonomy(name);
CREATE INDEX idx_dealroom_taxonomy_parent ON public.dealroom_taxonomy(parent_name) WHERE parent_name IS NOT NULL;