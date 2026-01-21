-- Create table for storing scraped web content
CREATE TABLE public.scraped_web_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  website TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'mixed',
  title TEXT,
  markdown_content TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for website scrape logs
CREATE TABLE public.website_scrape_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website TEXT NOT NULL,
  scrape_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  pages_scraped INTEGER DEFAULT 0,
  mentions_extracted INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for web technology mentions (from scraped content)
CREATE TABLE public.web_technology_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID NOT NULL REFERENCES public.technology_keywords(id) ON DELETE CASCADE,
  source_url TEXT,
  mention_context TEXT,
  trl_mentioned INTEGER CHECK (trl_mentioned BETWEEN 1 AND 9),
  confidence_score NUMERIC(3,2) DEFAULT 0.70 CHECK (confidence_score BETWEEN 0 AND 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_scraped_web_content_website ON public.scraped_web_content(website);
CREATE INDEX idx_scraped_web_content_scraped_at ON public.scraped_web_content(scraped_at DESC);
CREATE INDEX idx_website_scrape_logs_website ON public.website_scrape_logs(website);
CREATE INDEX idx_website_scrape_logs_status ON public.website_scrape_logs(status);
CREATE INDEX idx_web_technology_mentions_keyword ON public.web_technology_mentions(keyword_id);

-- Enable RLS on all tables
ALTER TABLE public.scraped_web_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_scrape_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_technology_mentions ENABLE ROW LEVEL SECURITY;

-- RLS policies for scraped_web_content (public read, service role write)
CREATE POLICY "Anyone can view scraped content" 
ON public.scraped_web_content 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can insert scraped content" 
ON public.scraped_web_content 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update scraped content" 
ON public.scraped_web_content 
FOR UPDATE 
USING (true);

-- RLS policies for website_scrape_logs (public read, service role write)
CREATE POLICY "Anyone can view scrape logs" 
ON public.website_scrape_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can insert scrape logs" 
ON public.website_scrape_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update scrape logs" 
ON public.website_scrape_logs 
FOR UPDATE 
USING (true);

-- RLS policies for web_technology_mentions (public read, service role write)
CREATE POLICY "Anyone can view web mentions" 
ON public.web_technology_mentions 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can insert web mentions" 
ON public.web_technology_mentions 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at on scraped_web_content
CREATE TRIGGER update_scraped_web_content_updated_at
BEFORE UPDATE ON public.scraped_web_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();