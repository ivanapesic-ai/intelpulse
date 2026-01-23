-- Add acquisition tracking columns to dealroom_companies
ALTER TABLE public.dealroom_companies
ADD COLUMN IF NOT EXISTS acquired_by text,
ADD COLUMN IF NOT EXISTS acquired_date date,
ADD COLUMN IF NOT EXISTS acquisition_amount_eur numeric;

-- Create index for efficient acquisition queries
CREATE INDEX IF NOT EXISTS idx_dealroom_companies_acquired_by ON public.dealroom_companies(acquired_by) WHERE acquired_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dealroom_companies_status_acquired ON public.dealroom_companies(status) WHERE status = 'acquired';