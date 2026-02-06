-- Create table to track async processing jobs
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL, -- 'parse_document' | 'process_pdf'
  target_id uuid NOT NULL, -- document id or pdf queue id
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  progress integer DEFAULT 0, -- 0-100
  result jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_processing_jobs_target ON public.processing_jobs(target_id, job_type);
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status);

-- RLS: public read/write for jobs (server-side service role will do actual writes)
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on jobs" ON public.processing_jobs FOR SELECT USING (true);
CREATE POLICY "Public insert access on jobs" ON public.processing_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access on jobs" ON public.processing_jobs FOR UPDATE USING (true);
CREATE POLICY "Public delete access on jobs" ON public.processing_jobs FOR DELETE USING (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_processing_jobs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_processing_jobs_updated
BEFORE UPDATE ON public.processing_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_processing_jobs();