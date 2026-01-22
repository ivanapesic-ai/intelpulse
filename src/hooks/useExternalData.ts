import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewsItem {
  title: string;
  url: string;
  date: string;
  source: string;
  score?: number;
}

interface PatentResult {
  title: string;
  applicationNumber: string;
  publicationDate: string;
  applicant?: string;
}

// Fetch news from HackerNews for all technologies
export function useFetchNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { keywordId?: string; keyword?: string }) => {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: options || {},
      });

      if (error) throw error;
      return data as { success: boolean; updated?: number; news?: NewsItem[]; error?: string };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Updated news for ${data.updated || 0} technologies`);
        queryClient.invalidateQueries({ queryKey: ['technologies'] });
      } else {
        toast.error(data.error || 'Failed to fetch news');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch news');
    },
  });
}

// Fetch patents from EPO OPS for all technologies
export function useFetchPatents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { keywordId?: string; keyword?: string }) => {
      const { data, error } = await supabase.functions.invoke('fetch-patents', {
        body: options || {},
      });

      if (error) throw error;
      return data as { success: boolean; updated?: number; patents?: PatentResult[]; needsSetup?: boolean; error?: string };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Updated patents for ${data.updated || 0} technologies`);
        queryClient.invalidateQueries({ queryKey: ['technologies'] });
      } else if (data.needsSetup) {
        toast.error('EPO OPS API not configured. Add EPO_CONSUMER_KEY and EPO_CONSUMER_SECRET in secrets.');
      } else {
        toast.error(data.error || 'Failed to fetch patents');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch patents');
    },
  });
}
