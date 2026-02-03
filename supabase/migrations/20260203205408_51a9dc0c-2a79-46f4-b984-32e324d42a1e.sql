-- Create table for AI-generated CEI to Dealroom mappings with confidence and reasoning
CREATE TABLE public.cei_dealroom_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID NOT NULL REFERENCES public.technology_keywords(id) ON DELETE CASCADE,
  dealroom_term TEXT NOT NULL,
  term_type TEXT NOT NULL CHECK (term_type IN ('industry', 'sub_industry', 'tag')),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('primary', 'related', 'tangential')),
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning TEXT,
  mapped_by TEXT NOT NULL DEFAULT 'gemini-ai',
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(keyword_id, dealroom_term, term_type)
);

-- Create indexes for efficient querying
CREATE INDEX idx_cei_mappings_keyword ON public.cei_dealroom_mappings(keyword_id);
CREATE INDEX idx_cei_mappings_term ON public.cei_dealroom_mappings(dealroom_term);
CREATE INDEX idx_cei_mappings_relationship ON public.cei_dealroom_mappings(relationship_type);
CREATE INDEX idx_cei_mappings_verified ON public.cei_dealroom_mappings(verified);
CREATE INDEX idx_cei_mappings_confidence ON public.cei_dealroom_mappings(confidence_score DESC);

-- Add updated_at trigger
CREATE TRIGGER update_cei_dealroom_mappings_updated_at
  BEFORE UPDATE ON public.cei_dealroom_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cei_dealroom_mappings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (analytics/display)
CREATE POLICY "Allow public read access to mappings"
  ON public.cei_dealroom_mappings
  FOR SELECT
  USING (true);

-- Allow service role full access (edge functions)
CREATE POLICY "Allow service role full access"
  ON public.cei_dealroom_mappings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a view for easy keyword mapping overview
CREATE OR REPLACE VIEW public.keyword_mapping_summary AS
SELECT 
  tk.id as keyword_id,
  tk.display_name as keyword_name,
  tk.source as keyword_source,
  COUNT(cm.id) as total_mappings,
  COUNT(cm.id) FILTER (WHERE cm.relationship_type = 'primary') as primary_mappings,
  COUNT(cm.id) FILTER (WHERE cm.relationship_type = 'related') as related_mappings,
  COUNT(cm.id) FILTER (WHERE cm.relationship_type = 'tangential') as tangential_mappings,
  COUNT(cm.id) FILTER (WHERE cm.verified = true) as verified_mappings,
  ROUND(AVG(cm.confidence_score)::numeric, 1) as avg_confidence,
  MAX(cm.created_at) as last_mapped_at
FROM public.technology_keywords tk
LEFT JOIN public.cei_dealroom_mappings cm ON tk.id = cm.keyword_id
GROUP BY tk.id, tk.display_name, tk.source;