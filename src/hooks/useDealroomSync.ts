import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DealroomCompany {
  id: string;
  dealroomId: string;
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  hqCountry?: string;
  hqCity?: string;
  foundedYear?: number;
  employeesCount: number;
  totalFundingEur: number;
  valuationEur?: number;
  lastFundingDate?: string;
  lastFundingAmountEur?: number;
  growthStage?: string;
  investors: string[];
  industries: string[];
  patentsCount: number;
  newsItems?: Array<{ title: string; date: string; url: string }>;
  syncedAt: string;
}

interface DealroomSyncLog {
  id: string;
  syncType: string;
  keywordsSearched: string[];
  recordsFetched: number;
  recordsCreated: number;
  recordsUpdated: number;
  apiCallsMade: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}
// Get total company count
export function useDealroomCompanyCount() {
  return useQuery({
    queryKey: ["dealroom-company-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("dealroom_companies")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    },
  });
}

// Fetch Dealroom companies
export function useDealroomCompanies(options?: {
  country?: string;
  minFunding?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["dealroom-companies", options],
    queryFn: async () => {
      let query = supabase
        .from("dealroom_companies")
        .select("*")
        .order("total_funding_eur", { ascending: false });

      if (options?.country) {
        query = query.eq("hq_country", options.country);
      }

      if (options?.minFunding) {
        query = query.gte("total_funding_eur", options.minFunding);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row): DealroomCompany => ({
        id: row.id,
        dealroomId: row.dealroom_id,
        name: row.name,
        tagline: row.tagline || undefined,
        description: row.description || undefined,
        website: row.website || undefined,
        hqCountry: row.hq_country || undefined,
        hqCity: row.hq_city || undefined,
        foundedYear: row.founded_year || undefined,
        employeesCount: row.employees_count || 0,
        totalFundingEur: Number(row.total_funding_eur) || 0,
        valuationEur: row.valuation_eur ? Number(row.valuation_eur) : undefined,
        lastFundingDate: row.last_funding_date || undefined,
        lastFundingAmountEur: row.last_funding_amount_eur ? Number(row.last_funding_amount_eur) : undefined,
        growthStage: row.growth_stage || undefined,
        investors: row.investors || [],
        industries: row.industries || [],
        patentsCount: row.patents_count || 0,
        newsItems: row.news_items as DealroomCompany["newsItems"],
        syncedAt: row.synced_at,
      }));
    },
  });
}

// Fetch sync logs
export function useDealroomSyncLogs(limit = 10) {
  return useQuery({
    queryKey: ["dealroom-sync-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealroom_sync_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((row): DealroomSyncLog => ({
        id: row.id,
        syncType: row.sync_type,
        keywordsSearched: row.keywords_searched || [],
        recordsFetched: row.records_fetched || 0,
        recordsCreated: row.records_created || 0,
        recordsUpdated: row.records_updated || 0,
        apiCallsMade: row.api_calls_made || 0,
        status: row.status as DealroomSyncLog["status"],
        errorMessage: row.error_message || undefined,
        startedAt: row.started_at,
        completedAt: row.completed_at || undefined,
      }));
    },
  });
}

// Fetch API usage for current period
export function useDealroomApiUsage() {
  return useQuery({
    queryKey: ["dealroom-api-usage"],
    queryFn: async () => {
      const now = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("dealroom_api_usage")
        .select("*")
        .gte("period_end", now)
        .order("period_start", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (!data) return null;

      return {
        id: data.id,
        periodStart: data.period_start,
        periodEnd: data.period_end,
        apiCallsLimit: data.api_calls_limit,
        apiCallsUsed: data.api_calls_used,
        lastSyncDate: data.last_sync_date,
      };
    },
  });
}

// Trigger Dealroom sync
export function useDealroomSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { keyword?: string; limit?: number; keywordsPerSync?: number }) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dealroom-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "sync",
            keyword: options?.keyword,
            limit: options?.limit || 100,
            keywordsPerSync: options?.keywordsPerSync || 10,
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        if (result.quotaExceeded) {
          throw new Error(`API quota exceeded. Used ${result.usage?.used}/${result.usage?.limit} calls. Resets on ${result.usage?.periodEnd}`);
        }
        throw new Error(result.error || "Sync failed");
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(`Sync completed: ${data.recordsFetched} records fetched (${data.apiCallsMade} API calls)`);
      queryClient.invalidateQueries({ queryKey: ["dealroom-companies"] });
      queryClient.invalidateQueries({ queryKey: ["dealroom-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dealroom-api-usage"] });
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}

// Discover valid Dealroom tags
export function useDealroomTagDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dealroom-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: "discover-tags" }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Tag discovery failed");
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(`Tag discovery complete: ${data.validTagsFound}/${data.totalTested} valid tags found`);
      queryClient.invalidateQueries({ queryKey: ["dealroom-taxonomy"] });
      queryClient.invalidateQueries({ queryKey: ["dealroom-api-usage"] });
    },
    onError: (error) => {
      toast.error(`Tag discovery failed: ${error.message}`);
    },
  });
}

// Test a single tag
export function useDealroomTagTest() {
  return useMutation({
    mutationFn: async (tag: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dealroom-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: "test-tag", keyword: tag }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Tag test failed");
      }

      return result;
    },
    onSuccess: (data) => {
      if (data.exists) {
        toast.success(`Tag "${data.tag}" is valid: ${data.companyCount} companies found`);
      } else {
        toast.warning(`Tag "${data.tag}" returned ${data.companyCount} companies (likely unfiltered)`);
      }
    },
    onError: (error) => {
      toast.error(`Tag test failed: ${error.message}`);
    },
  });
}

// Test tags-only (no industries) - verifies if tags work with must wrapper
export function useDealroomTestTagsOnly() {
  return useMutation({
    mutationFn: async (tag?: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dealroom-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: "test-tags-only", keyword: tag }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Tags-only test failed");
      }

      return result;
    },
    onSuccess: (data) => {
      if (data.tagsWork) {
        toast.success(data.verdict);
      } else {
        toast.warning(data.verdict);
      }
    },
    onError: (error) => {
      toast.error(`Tags-only test failed: ${error.message}`);
    },
  });
}

// Get company stats by country
export function useDealroomCountryStats() {
  return useQuery({
    queryKey: ["dealroom-country-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealroom_companies")
        .select("hq_country, total_funding_eur, employees_count");

      if (error) throw error;

      const stats = (data || []).reduce((acc, company) => {
        const country = company.hq_country || "Unknown";
        if (!acc[country]) {
          acc[country] = { companyCount: 0, totalFunding: 0, totalEmployees: 0 };
        }
        acc[country].companyCount++;
        acc[country].totalFunding += Number(company.total_funding_eur) || 0;
        acc[country].totalEmployees += company.employees_count || 0;
        return acc;
      }, {} as Record<string, { companyCount: number; totalFunding: number; totalEmployees: number }>);

      return Object.entries(stats)
        .map(([country, data]) => ({
          country,
          ...data,
        }))
        .sort((a, b) => b.totalFunding - a.totalFunding);
    },
  });
}
