import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Stop words to ignore when comparing titles
const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","are","was","were","be","been","being","has","have","had","do",
  "does","did","will","would","shall","should","may","might","can","could",
  "it","its","this","that","these","those","how","what","which","who","whom",
  "why","where","when","not","no","nor","so","if","then","than","too","very",
  "just","about","up","out","over","into","after","before","new","says","said",
]);

function normalizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function titleSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let overlap = 0;
  for (const w of setA) if (setB.has(w)) overlap++;
  const minLen = Math.min(setA.size, setB.size);
  return minLen > 0 ? overlap / minLen : 0;
}

/** Keep the earliest article per story cluster (≥50% word overlap). */
function deduplicateStories<T extends { title: string }>(items: T[]): T[] {
  const clusters: { words: string[]; item: T }[] = [];
  for (const item of items) {
    const words = normalizeTitle(item.title);
    const match = clusters.find((c) => titleSimilarity(c.words, words) >= 0.5);
    if (!match) {
      clusters.push({ words, item });
    }
    // else skip — earlier item already claimed this cluster
  }
  return clusters.map((c) => c.item);
}

interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source_name: string | null;
  published_at: string | null;
  image_url: string | null;
  created_at: string;
}

interface NewsWithKeywords extends NewsItem {
  keyword_ids: string[];
}

// Fetch latest news items
export function useLatestNews(limit = 10) {
  return useQuery({
    queryKey: ["news", "latest", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_items")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;
      return data as NewsItem[];
    },
  });
}

// Fetch news for a specific technology keyword
export function useNewsForKeyword(keywordId: string | null, options?: { limit?: number; deduplicate?: boolean }) {
  const limit = options?.limit ?? 50;
  const deduplicate = options?.deduplicate ?? true;

  return useQuery({
    queryKey: ["news", "keyword", keywordId, limit],
    queryFn: async () => {
      if (!keywordId) return [];

      const { data, error } = await supabase
        .from("news_keyword_matches")
        .select(`
          news_id,
          match_confidence,
          news_items (
            id,
            title,
            description,
            url,
            source_name,
            published_at,
            image_url
          )
        `)
        .eq("keyword_id", keywordId)
        .not("news_items", "is", null)
        .order("match_confidence", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Flatten and dedupe by news_id
      const seen = new Set<string>();
      const results: (NewsItem & { match_confidence: number })[] = [];
      
      for (const match of data || []) {
        const newsItem = match.news_items as any;
        if (newsItem && !seen.has(newsItem.id)) {
          seen.add(newsItem.id);
          results.push({
            id: newsItem.id,
            title: newsItem.title,
            description: newsItem.description,
            url: newsItem.url,
            source_name: newsItem.source_name,
            published_at: newsItem.published_at,
            image_url: newsItem.image_url,
            created_at: newsItem.published_at || new Date().toISOString(),
            match_confidence: match.match_confidence || 0,
          });
        }
      }
      
      // Sort by confidence first, then by date
      results.sort((a, b) => {
        const confDiff = b.match_confidence - a.match_confidence;
        if (Math.abs(confDiff) > 0.1) return confDiff;
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      });

      if (!deduplicate) return results;

      // Deduplicate similar stories — keep highest-confidence one
      const deduped = deduplicateStories(results);

      // Final sort: newest first for display
      return deduped.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      });
    },
    enabled: !!keywordId,
  });
}

// Fetch RSS feed sources for admin
export function useRssFeedSources() {
  return useQuery({
    queryKey: ["rss-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rss_feed_sources")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

// Trigger RSS fetch
export function useFetchRss() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-rss");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success(`Fetched ${data.itemsInserted} news items with ${data.matchesCreated} technology matches`);
    },
    onError: (error) => {
      toast.error(`RSS fetch failed: ${error.message}`);
    },
  });
}

// Trigger NewsAPI fetch
export function useFetchNewsAPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customQuery?: string) => {
      const { data, error } = await supabase.functions.invoke("fetch-newsapi", {
        body: customQuery ? { query: customQuery } : {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success(
        `NewsAPI: ${data.articlesInserted} articles imported, ${data.matchesCreated} keyword matches`
      );
    },
    onError: (error) => {
      toast.error(`NewsAPI fetch failed: ${error.message}`);
    },
  });
}
