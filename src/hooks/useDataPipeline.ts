import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncResult {
  success: boolean;
  mappings_synced: number;
  orphaned_mappings_removed: number;
  technologies_updated: number;
  duration_ms: number;
}

export function useDataPipelineSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      const { data, error } = await supabase.rpc('sync_keyword_data_pipeline');
      
      if (error) throw error;
      return data as unknown as SyncResult;
    },
    onSuccess: (result) => {
      toast.success(
        `Pipeline synced! ${result.mappings_synced} mappings, ${result.technologies_updated} technologies updated (${result.duration_ms}ms)`
      );
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['technologies'] });
      queryClient.invalidateQueries({ queryKey: ['technology-region-stats'] });
      queryClient.invalidateQueries({ queryKey: ['crunchbase-companies'] });
      queryClient.invalidateQueries({ queryKey: ['crunchbase-stats'] });
      queryClient.invalidateQueries({ queryKey: ['keyword-stats'] });
      queryClient.invalidateQueries({ queryKey: ['technology-intelligence'] });
      queryClient.invalidateQueries({ queryKey: ['technology-ontology'] });
    },
    onError: (error) => {
      console.error('Pipeline sync failed:', error);
      toast.error('Failed to sync data pipeline');
    },
  });
}
