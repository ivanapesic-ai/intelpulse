
-- Create storage bucket for CEI documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('cei-documents', 'cei-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload CEI documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cei-documents');

-- Allow authenticated users to view their uploaded files
CREATE POLICY "Authenticated users can view CEI documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'cei-documents');

-- Allow service role full access
CREATE POLICY "Service role full access to CEI documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'cei-documents')
WITH CHECK (bucket_id = 'cei-documents');
