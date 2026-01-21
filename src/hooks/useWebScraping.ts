import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { toast } from 'sonner';

export interface WebsiteScrapeLog {
  id: string;
  website: string;
  scrapeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  pagesScraped: number;
  mentionsExtracted: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface ScrapedWebContent {
  id: string;
  url: string;
  website: string;
  pageType: string;
  title?: string;
  scrapedAt: string;
}

// Database row types for new tables (not yet in generated types)
interface WebsiteScrapeLogRow {
  id: string;
  website: string;
  scrape_type: string;
  status: string;
  pages_scraped: number | null;
  mentions_extracted: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface ScrapedWebContentRow {
  id: string;
  url: string;
  website: string;
  page_type: string;
  title: string | null;
  scraped_at: string;
}

export function useWebScrapeLogs(limit = 10) {
  return useQuery({
    queryKey: ['web-scrape-logs', limit],
    queryFn: async (): Promise<WebsiteScrapeLog[]> => {
      const { data, error } = await supabase
        .from('website_scrape_logs' as any)
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching scrape logs:', error);
        return [];
      }

      const rows = (data || []) as unknown as WebsiteScrapeLogRow[];
      return rows.map(row => ({
        id: row.id,
        website: row.website,
        scrapeType: row.scrape_type,
        status: row.status as WebsiteScrapeLog['status'],
        pagesScraped: row.pages_scraped || 0,
        mentionsExtracted: row.mentions_extracted || 0,
        startedAt: row.started_at,
        completedAt: row.completed_at || undefined,
        errorMessage: row.error_message || undefined,
      }));
    },
    refetchInterval: 5000, // Refetch every 5 seconds while scraping
  });
}

export function useScrapedContent(website?: string) {
  return useQuery({
    queryKey: ['scraped-content', website],
    queryFn: async (): Promise<ScrapedWebContent[]> => {
      let query = supabase
        .from('scraped_web_content' as any)
        .select('id, url, website, page_type, title, scraped_at')
        .order('scraped_at', { ascending: false })
        .limit(50);

      if (website) {
        query = query.eq('website', website);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching scraped content:', error);
        return [];
      }

      const rows = (data || []) as unknown as ScrapedWebContentRow[];
      return rows.map(row => ({
        id: row.id,
        url: row.url,
        website: row.website,
        pageType: row.page_type,
        title: row.title || undefined,
        scrapedAt: row.scraped_at,
      }));
    },
  });
}

export function useWebScrapingStats() {
  return useQuery({
    queryKey: ['web-scraping-stats'],
    queryFn: async () => {
      const [logsResult, contentResult] = await Promise.all([
        supabase
          .from('website_scrape_logs' as any)
          .select('website, status, pages_scraped, mentions_extracted')
          .eq('status', 'completed'),
        supabase
          .from('scraped_web_content' as any)
          .select('website', { count: 'exact' }),
      ]);

      const logs = (logsResult.data || []) as unknown as { website: string; status: string; pages_scraped: number | null; mentions_extracted: number | null }[];
      const totalPages = contentResult.count || 0;

      const ceiSpherePages = logs
        .filter(l => l.website === 'ceisphere')
        .reduce((sum, l) => sum + (l.pages_scraped || 0), 0);
      
      const euCloudPages = logs
        .filter(l => l.website === 'eucloudedgeiot')
        .reduce((sum, l) => sum + (l.pages_scraped || 0), 0);

      const totalMentions = logs.reduce((sum, l) => sum + (l.mentions_extracted || 0), 0);

      return {
        totalPages,
        ceiSpherePages,
        euCloudPages,
        totalMentions,
        lastScrape: logs[0]?.website || null,
      };
    },
  });
}

export function useScrapeWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: { website: 'ceisphere' | 'eucloudedgeiot'; scrapeType: 'publications' | 'news' | 'projects' | 'all' }) => {
      return firecrawlApi.scrapeWebsite(options);
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success(`Scraped ${data.pagesScraped || 0} pages, extracted ${data.mentionsExtracted || 0} mentions`);
        queryClient.invalidateQueries({ queryKey: ['web-scrape-logs'] });
        queryClient.invalidateQueries({ queryKey: ['scraped-content'] });
        queryClient.invalidateQueries({ queryKey: ['web-scraping-stats'] });
      } else {
        toast.error(data.error || 'Scraping failed');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Scraping failed');
    },
  });
}
