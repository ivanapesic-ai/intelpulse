import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaxonomyItem {
  id: string;
  name: string;
  slug: string | null;
  taxonomyType: string;
  parentName: string | null;
  companyCount: number | null;
  isActive: boolean;
  lastSyncedAt: string | null;
}

interface TaxonomyCounts {
  industries: number;
  subIndustries: number;
  technology: number;
  total: number;
}

// Fetch taxonomy from database
export function useDealroomTaxonomy() {
  return useQuery({
    queryKey: ["dealroom-taxonomy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealroom_taxonomy")
        .select("*")
        .order("taxonomy_type", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      const items = (data || []).map((row): TaxonomyItem => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        taxonomyType: row.taxonomy_type,
        parentName: row.parent_name,
        companyCount: row.company_count,
        isActive: row.is_active ?? true,
        lastSyncedAt: row.last_synced_at,
      }));

      const grouped = {
        industries: items.filter(d => d.taxonomyType === 'industry'),
        subIndustries: items.filter(d => d.taxonomyType === 'sub_industry'),
        technology: items.filter(d => d.taxonomyType === 'technology'),
      };

      const counts: TaxonomyCounts = {
        industries: grouped.industries.length,
        subIndustries: grouped.subIndustries.length,
        technology: grouped.technology.length,
        total: items.length,
      };

      return { items, grouped, counts };
    },
  });
}

// Sync taxonomy from edge function (hardcoded list)
export function useSyncDealroomTaxonomy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dealroom-taxonomy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: "sync" }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Taxonomy sync failed");
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(`Taxonomy synced: ${data.counts?.total || 0} items (${data.counts?.industries || 0} industries, ${data.counts?.sub_industries || 0} sub-industries, ${data.counts?.technology_tags || 0} tags)`);
      queryClient.invalidateQueries({ queryKey: ["dealroom-taxonomy"] });
    },
    onError: (error) => {
      toast.error(`Taxonomy sync failed: ${error.message}`);
    },
  });
}

// Sync taxonomy from existing company data
export function useSyncTaxonomyFromCompanies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dealroom-taxonomy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: "sync-from-companies" }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Sync from companies failed");
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(`Synced from companies: ${data.counts?.total || 0} items added`);
      queryClient.invalidateQueries({ queryKey: ["dealroom-taxonomy"] });
    },
    onError: (error) => {
      toast.error(`Sync from companies failed: ${error.message}`);
    },
  });
}
