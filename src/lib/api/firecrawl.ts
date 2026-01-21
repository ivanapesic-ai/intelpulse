import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

type ScrapeOptions = {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  onlyMainContent?: boolean;
  waitFor?: number;
};

type MapOptions = {
  search?: string;
  limit?: number;
  includeSubdomains?: boolean;
};

type WebsiteScrapeOptions = {
  website: 'ceisphere' | 'eucloudedgeiot';
  scrapeType: 'publications' | 'news' | 'projects' | 'all';
};

export const firecrawlApi = {
  // Scrape a single URL
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Map a website to discover all URLs (fast sitemap)
  async map(url: string, options?: MapOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-map', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Scrape CEI-Sphere or EUCloudEdgeIoT website
  async scrapeWebsite(options: WebsiteScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('website-scrape', {
      body: options,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
