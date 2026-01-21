import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PdfQueueItem {
  id: string;
  url: string;
  sourcePageId?: string;
  sourceType: 'direct' | 'zenodo';
  zenodoRecordId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  fileSizeBytes?: number;
  filename?: string;
  storagePath?: string;
  errorMessage?: string;
  retryCount: number;
  mentionsExtracted: number;
  createdAt: string;
  processedAt?: string;
}

interface PdfQueueRow {
  id: string;
  url: string;
  source_page_id: string | null;
  source_type: string;
  zenodo_record_id: string | null;
  status: string;
  file_size_bytes: number | null;
  filename: string | null;
  storage_path: string | null;
  error_message: string | null;
  retry_count: number | null;
  mentions_extracted: number | null;
  created_at: string;
  processed_at: string | null;
}

export function usePdfQueue(status?: string) {
  return useQuery({
    queryKey: ['pdf-queue', status],
    queryFn: async (): Promise<PdfQueueItem[]> => {
      let query = supabase
        .from('pdf_processing_queue' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching PDF queue:', error);
        return [];
      }

      const rows = (data || []) as unknown as PdfQueueRow[];
      return rows.map(row => ({
        id: row.id,
        url: row.url,
        sourcePageId: row.source_page_id || undefined,
        sourceType: row.source_type as 'direct' | 'zenodo',
        zenodoRecordId: row.zenodo_record_id || undefined,
        status: row.status as PdfQueueItem['status'],
        fileSizeBytes: row.file_size_bytes || undefined,
        filename: row.filename || undefined,
        storagePath: row.storage_path || undefined,
        errorMessage: row.error_message || undefined,
        retryCount: row.retry_count || 0,
        mentionsExtracted: row.mentions_extracted || 0,
        createdAt: row.created_at,
        processedAt: row.processed_at || undefined,
      }));
    },
    refetchInterval: 5000,
  });
}

export function usePdfQueueStats() {
  return useQuery({
    queryKey: ['pdf-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_processing_queue' as any)
        .select('status, mentions_extracted');

      if (error) {
        console.error('Error fetching PDF queue stats:', error);
        return { pending: 0, processing: 0, completed: 0, failed: 0, skipped: 0, totalMentions: 0 };
      }

      const rows = (data || []) as unknown as { status: string; mentions_extracted: number | null }[];
      const stats = {
        pending: rows.filter(r => r.status === 'pending').length,
        processing: rows.filter(r => r.status === 'processing').length,
        completed: rows.filter(r => r.status === 'completed').length,
        failed: rows.filter(r => r.status === 'failed').length,
        skipped: rows.filter(r => r.status === 'skipped').length,
        totalMentions: rows.reduce((sum, r) => sum + (r.mentions_extracted || 0), 0),
      };

      return stats;
    },
  });
}

export function useProcessPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pdfId: string) => {
      const response = await supabase.functions.invoke('process-pdf', {
        body: { pdfId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Processed PDF: ${data.mentionsExtracted || 0} mentions extracted`);
      } else {
        toast.error(data.error || 'Processing failed');
      }
      queryClient.invalidateQueries({ queryKey: ['pdf-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pdf-queue-stats'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Processing failed');
    },
  });
}

export function useSkipPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pdfId: string) => {
      const { error } = await supabase
        .from('pdf_processing_queue' as any)
        .update({ status: 'skipped' })
        .eq('id', pdfId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('PDF marked as skipped');
      queryClient.invalidateQueries({ queryKey: ['pdf-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pdf-queue-stats'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to skip PDF');
    },
  });
}

export function useRetryPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pdfId: string) => {
      const { error } = await supabase
        .from('pdf_processing_queue' as any)
        .update({ status: 'pending', error_message: null })
        .eq('id', pdfId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('PDF queued for retry');
      queryClient.invalidateQueries({ queryKey: ['pdf-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pdf-queue-stats'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to queue retry');
    },
  });
}
