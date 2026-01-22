-- Add news aggregation columns to technologies table
ALTER TABLE public.technologies
ADD COLUMN IF NOT EXISTS news_mention_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recent_news JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.technologies.news_mention_count IS 'Count of news/publication mentions from scraped sources';
COMMENT ON COLUMN public.technologies.recent_news IS 'Array of recent news items: [{title, url, date, source}]';