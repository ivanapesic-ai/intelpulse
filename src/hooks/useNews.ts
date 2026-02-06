import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
export function useNewsForKeyword(keywordId: string | null) {
  return useQuery({
    queryKey: ["news", "keyword", keywordId],
    queryFn: async () => {
      if (!keywordId) return [];

      const { data, error } = await supabase
        .from("news_keyword_matches")
        .select(`
          news_id,
          match_confidence,
          news_items!inner (
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
        .order("match_confidence", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Flatten the response
      return data.map((match: any) => ({
        ...match.news_items,
        match_confidence: match.match_confidence,
      })) as (NewsItem & { match_confidence: number })[];
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
