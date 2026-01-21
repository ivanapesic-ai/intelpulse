-- Add storage bucket for scraped PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('scraped-documents', 'scraped-documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Add 'scraped' to document_source enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'scraped' AND enumtypid = 'document_source'::regtype) THEN
    ALTER TYPE document_source ADD VALUE 'scraped';
  END IF;
END $$;

-- Add PDF tracking columns to scraped_web_content
ALTER TABLE scraped_web_content 
ADD COLUMN IF NOT EXISTS pdf_links jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pdfs_processed integer DEFAULT 0;

-- Add pdfs_processed to website_scrape_logs
ALTER TABLE website_scrape_logs
ADD COLUMN IF NOT EXISTS pdfs_processed integer DEFAULT 0;

-- Storage policy for service role to manage scraped documents
CREATE POLICY "Service role full access to scraped documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'scraped-documents')
WITH CHECK (bucket_id = 'scraped-documents');