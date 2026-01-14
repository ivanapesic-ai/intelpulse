-- Create table to track Dealroom API usage per billing period
CREATE TABLE public.dealroom_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  api_calls_limit INTEGER DEFAULT 50000,
  api_calls_used INTEGER DEFAULT 0,
  last_sync_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dealroom_api_usage ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view API usage"
ON public.dealroom_api_usage FOR SELECT
USING (true);

CREATE POLICY "Service role can manage API usage"
ON public.dealroom_api_usage FOR ALL
USING (true)
WITH CHECK (true);

-- Add api_calls_made column to sync logs
ALTER TABLE public.dealroom_sync_logs 
ADD COLUMN api_calls_made INTEGER DEFAULT 0;

-- Insert initial record for current billing period
INSERT INTO public.dealroom_api_usage (period_start, period_end, api_calls_limit)
VALUES (
  DATE_TRUNC('month', NOW())::DATE,
  (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE,
  50000
);

-- Trigger for updated_at
CREATE TRIGGER update_dealroom_api_usage_updated_at
BEFORE UPDATE ON public.dealroom_api_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();