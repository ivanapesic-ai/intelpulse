import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewsTrend {
  keyword_id: string;
  display_name: string;
  current_count: number;
  previous_count: number;
  trend_velocity: number;
  trend_direction: "rising" | "falling" | "stable";
  total_all_time: number;
}

export interface NewsTimelinePoint {
  week_start: string;
  mention_count: number;
}

export type TimeWindow = 7 | 30 | 90;

export function useNewsTrends(windowDays: TimeWindow = 30, limit = 15) {
  return useQuery({
    queryKey: ["news-trends", windowDays, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_news_trends", {
        p_window_days: windowDays,
        p_limit: limit,
      });
      if (error) throw error;
      return (data as unknown as NewsTrend[]) || [];
    },
  });
}

export function useNewsTimeline(keywordId: string | null, weeks = 12) {
  return useQuery({
    queryKey: ["news-timeline", keywordId, weeks],
    queryFn: async () => {
      if (!keywordId) return [];
      const { data, error } = await supabase.rpc("get_news_timeline", {
        p_keyword_id: keywordId,
        p_weeks: weeks,
      });
      if (error) throw error;
      return (data as unknown as NewsTimelinePoint[]) || [];
    },
    enabled: !!keywordId,
  });
}
