-- Create news_items table for RSS feed aggregation
CREATE TABLE public.news_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL UNIQUE,
    source_feed TEXT NOT NULL,
    source_name TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for news-keyword relationships
CREATE TABLE public.news_keyword_matches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id UUID NOT NULL REFERENCES public.news_items(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES public.technology_keywords(id) ON DELETE CASCADE,
    match_confidence NUMERIC DEFAULT 1.0,
    match_source TEXT DEFAULT 'title_match',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(news_id, keyword_id)
);

-- Create RSS feed sources table for admin management
CREATE TABLE public.rss_feed_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    fetch_frequency_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_keyword_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feed_sources ENABLE ROW LEVEL SECURITY;

-- Public read access for news (teaser + authenticated users)
CREATE POLICY "News items are publicly readable" 
ON public.news_items FOR SELECT 
USING (true);

CREATE POLICY "News keyword matches are publicly readable" 
ON public.news_keyword_matches FOR SELECT 
USING (true);

CREATE POLICY "RSS feed sources are publicly readable" 
ON public.rss_feed_sources FOR SELECT 
USING (true);

-- Insert/update/delete only via service role (edge functions)
CREATE POLICY "Service role can manage news_items" 
ON public.news_items FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage news_keyword_matches" 
ON public.news_keyword_matches FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage rss_feed_sources" 
ON public.rss_feed_sources FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_news_items_published_at ON public.news_items(published_at DESC);
CREATE INDEX idx_news_keyword_matches_keyword_id ON public.news_keyword_matches(keyword_id);
CREATE INDEX idx_news_keyword_matches_news_id ON public.news_keyword_matches(news_id);

-- Insert default RSS feed sources
INSERT INTO public.rss_feed_sources (name, url) VALUES
    ('CEI-Sphere News', 'https://www.2zero-project.eu/feed/'),
    ('EUCloudEdgeIoT', 'https://eucloudedgeiot.eu/feed/'),
    ('Automotive News Europe', 'https://europe.autonews.com/rss.xml'),
    ('CleanTechnica', 'https://cleantechnica.com/feed/'),
    ('InsideEVs', 'https://insideevs.com/rss/news/all/');