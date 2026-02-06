import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminDataSync } from "@/hooks/useDataSync";

interface SyncResult {
  success: boolean;
  mappings_synced: number;
  orphaned_mappings_removed: number;
  technologies_updated: number;
  duration_ms: number;
}

export function useDataPipelineSync() {
  const { afterPipelineSync } = useAdminDataSync();

  return useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      const { data, error } = await supabase.rpc("sync_keyword_data_pipeline");

      if (error) throw error;
      return data as unknown as SyncResult;
    },
    onSuccess: (result) => {
      toast.success(
        `Pipeline synced! ${result.mappings_synced} mappings, ${result.technologies_updated} technologies updated (${result.duration_ms}ms)`
      );

      // Unified routine: refresh all radars/dashboards/cards consistently
      void afterPipelineSync();
    },
    onError: (error) => {
      console.error("Pipeline sync failed:", error);
      toast.error("Failed to sync data pipeline");
    },
  });
}
