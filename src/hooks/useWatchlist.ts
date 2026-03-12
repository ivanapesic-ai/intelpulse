import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useWatchlist() {
  const { user } = useAuth();

  const { data: watchlist = [], ...rest } = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_watchlist")
        .select("keyword_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((r) => r.keyword_id);
    },
    enabled: !!user,
  });

  return { watchedKeywordIds: watchlist, ...rest };
}

export function useToggleWatch() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ keywordId, watched }: { keywordId: string; watched: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (watched) {
        // Remove
        const { error } = await supabase
          .from("user_watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("keyword_id", keywordId);
        if (error) throw error;
      } else {
        // Add
        const { error } = await supabase
          .from("user_watchlist")
          .insert({ user_id: user.id, keyword_id: keywordId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}
