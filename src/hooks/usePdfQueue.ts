import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function getQueueDisplayFilename(input: {
  url: string;
  filename: string | null;
  source_type?: string | null;
  zenodo_record_id?: string | null;
}): string {
  const raw = (input.filename || '').trim();
  const isBad = !raw || raw.toLowerCase() === 'content';
  if (!isBad) return raw;

  const recordId =
    input.zenodo_record_id || input.url.match(/zenodo\.org\/records?\/(\d+)/)?.[1] || null;

  if ((input.source_type === 'zenodo' || input.url.includes('zenodo.org')) && recordId) {
    return `zenodo-${recordId}.pdf`;
  }

  try {
    const urlObj = new URL(input.url);
    const last = urlObj.pathname.split('/').filter(Boolean).pop() || 'unknown.pdf';
    const decoded = decodeURIComponent(last);
    return decoded.toLowerCase().endsWith('.pdf') ? decoded : `${decoded}.pdf`;
  } catch {
    return 'unknown.pdf';
  }
}

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
        filename: getQueueDisplayFilename(row),
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

export interface BatchProcessState {
  isRunning: boolean;
  current: number;
  total: number;
  successCount: number;
  failCount: number;
  currentPdfName: string;
}

export function useProcessAllPending() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BatchProcessState>({
    isRunning: false,
    current: 0,
    total: 0,
    successCount: 0,
    failCount: 0,
    currentPdfName: '',
  });
  const stopRef = useRef(false);
  const consecutiveFailures = useRef(0);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const start = async () => {
    stopRef.current = false;
    consecutiveFailures.current = 0;

    // Fetch all pending PDFs
    const { data, error } = await supabase
      .from('pdf_processing_queue' as any)
      .select('id, url, filename, source_type, zenodo_record_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      toast.info('No pending PDFs to process');
      return;
    }

    const pendingPdfs = data as unknown as { id: string; url: string; filename: string | null; source_type: string | null; zenodo_record_id: string | null }[];
    
    setState({
      isRunning: true,
      current: 0,
      total: pendingPdfs.length,
      successCount: 0,
      failCount: 0,
      currentPdfName: '',
    });

    for (let i = 0; i < pendingPdfs.length; i++) {
      if (stopRef.current) {
        toast.info('Batch processing stopped');
        break;
      }

      const pdf = pendingPdfs[i];
      const filename = getQueueDisplayFilename(pdf);
      
      setState(prev => ({
        ...prev,
        current: i + 1,
        currentPdfName: filename.length > 50 ? filename.slice(0, 47) + '...' : filename,
      }));

      try {
        const response = await supabase.functions.invoke('process-pdf', {
          body: { pdfId: pdf.id },
        });

        if (response.error || !response.data?.success) {
          consecutiveFailures.current++;
          setState(prev => ({ ...prev, failCount: prev.failCount + 1 }));
          
          if (consecutiveFailures.current >= 3) {
            toast.error('3 consecutive failures - pausing batch (Zenodo may be down)');
            break;
          }
        } else {
          consecutiveFailures.current = 0;
          setState(prev => ({ ...prev, successCount: prev.successCount + 1 }));
        }

        // Refresh data after each PDF
        queryClient.invalidateQueries({ queryKey: ['pdf-queue'] });
        queryClient.invalidateQueries({ queryKey: ['pdf-queue-stats'] });

        // Wait 10 seconds before next PDF (unless it's the last one)
        if (i < pendingPdfs.length - 1 && !stopRef.current) {
          await delay(10000);
        }
      } catch (err) {
        consecutiveFailures.current++;
        setState(prev => ({ ...prev, failCount: prev.failCount + 1 }));
        
        if (consecutiveFailures.current >= 3) {
          toast.error('3 consecutive failures - pausing batch');
          break;
        }
      }
    }

    setState(prev => ({ ...prev, isRunning: false, currentPdfName: '' }));
    toast.success(`Batch complete: ${state.successCount} succeeded, ${state.failCount} failed`);
  };

  const stop = () => {
    stopRef.current = true;
    toast.info('Stopping after current PDF...');
  };

  return { ...state, start, stop };
}
