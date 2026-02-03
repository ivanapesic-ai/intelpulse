import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string | null;
  taxonomy_type: string;
  parent_name: string | null;
  company_count: number | null;
  is_active: boolean;
  last_synced_at: string | null;
}

export interface TaxonomyCounts {
  industries: number;
  subIndustries: number;
  technology: number;
  total: number;
}

export interface TaxonomyData {
  industries: TaxonomyItem[];
  sub_industries: TaxonomyItem[];
  technology: TaxonomyItem[];
  counts: TaxonomyCounts;
}

// Fetch taxonomy from database
// Returns same shape as useTechnologies.ts version for compatibility
export function useDealroomTaxonomy() {
  return useQuery({
    queryKey: ["dealroom-taxonomy"],
    queryFn: async (): Promise<TaxonomyData> => {
      const { data, error } = await supabase
        .from("dealroom_taxonomy")
        .select("*")
        .order("taxonomy_type", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      const items = (data || []) as TaxonomyItem[];

      const industries = items.filter(d => d.taxonomy_type === 'industry');
      const sub_industries = items.filter(d => d.taxonomy_type === 'sub_industry');
      const technology = items.filter(d => d.taxonomy_type === 'technology');

      const counts: TaxonomyCounts = {
        industries: industries.length,
        subIndustries: sub_industries.length,
        technology: technology.length,
        total: items.length,
      };

      return { industries, sub_industries, technology, counts };
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
