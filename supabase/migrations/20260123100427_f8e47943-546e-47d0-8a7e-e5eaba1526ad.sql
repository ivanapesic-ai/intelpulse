-- Add high-priority Dealroom fields to dealroom_companies table
ALTER TABLE public.dealroom_companies 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS employee_growth numeric,
ADD COLUMN IF NOT EXISTS jobs_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tech_stack text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lead_investors text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS funding_rounds jsonb DEFAULT '[]'::jsonb;

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_dealroom_companies_status ON public.dealroom_companies(status);

-- Add comment for documentation
COMMENT ON COLUMN public.dealroom_companies.status IS 'Company status: active, closed, acquired';
COMMENT ON COLUMN public.dealroom_companies.employee_growth IS 'Employee growth rate percentage';
COMMENT ON COLUMN public.dealroom_companies.jobs_count IS 'Number of open job positions';
COMMENT ON COLUMN public.dealroom_companies.tech_stack IS 'Technology tags from Dealroom';
COMMENT ON COLUMN public.dealroom_companies.lead_investors IS 'Lead investors from funding rounds';
COMMENT ON COLUMN public.dealroom_companies.funding_rounds IS 'Historical funding rounds data';