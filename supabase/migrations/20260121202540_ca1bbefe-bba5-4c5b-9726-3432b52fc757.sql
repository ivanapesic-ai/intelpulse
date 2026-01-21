-- Create a table to track individual PDF processing status
CREATE TABLE public.pdf_processing_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  source_page_id UUID REFERENCES scraped_web_content(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'zenodo'
  zenodo_record_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'skipped'
  file_size_bytes INTEGER,
  filename TEXT,
  storage_path TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  mentions_extracted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(url)
);

-- Enable RLS
ALTER TABLE public.pdf_processing_queue ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Anyone can view pdf queue" ON public.pdf_processing_queue
  FOR SELECT USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage pdf queue" ON public.pdf_processing_queue
  FOR ALL USING (true) WITH CHECK (true);

-- Index for status queries
CREATE INDEX idx_pdf_queue_status ON public.pdf_processing_queue(status);
CREATE INDEX idx_pdf_queue_source ON public.pdf_processing_queue(source_page_id);