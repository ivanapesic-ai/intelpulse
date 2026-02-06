import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessingJob {
  id: string;
  jobType: 'parse_document' | 'process_pdf';
  targetId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    mentionsCreated?: number;
    mentionsExtracted?: number;
    summary?: string;
    filename?: string;
    fileSize?: number;
    [key: string]: unknown;
  };
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface JobRow {
  id: string;
  job_type: string;
  target_id: string;
  status: string;
  progress: number | null;
  result: unknown;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Poll a specific job by ID until it completes or fails.
 */
export function useProcessingJob(jobId: string | null) {
  return useQuery({
    queryKey: ['processing-job', jobId],
    queryFn: async (): Promise<ProcessingJob | null> => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from('processing_jobs' as any)
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !data) return null;

      const row = data as unknown as JobRow;
      return {
        id: row.id,
        jobType: row.job_type as ProcessingJob['jobType'],
        targetId: row.target_id,
        status: row.status as ProcessingJob['status'],
        progress: row.progress || 0,
        result: row.result as ProcessingJob['result'],
        errorMessage: row.error_message || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (!job) return 2000;
      // Stop polling once complete or failed
      if (job.status === 'completed' || job.status === 'failed') return false;
      return 2000;
    },
  });
}

/**
 * Get recent jobs (for debugging or status overview)
 */
export function useRecentJobs(limit = 20) {
  return useQuery({
    queryKey: ['processing-jobs-recent', limit],
    queryFn: async (): Promise<ProcessingJob[]> => {
      const { data, error } = await supabase
        .from('processing_jobs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching jobs:', error);
        return [];
      }

      return ((data || []) as unknown as JobRow[]).map(row => ({
        id: row.id,
        jobType: row.job_type as ProcessingJob['jobType'],
        targetId: row.target_id,
        status: row.status as ProcessingJob['status'],
        progress: row.progress || 0,
        result: row.result as ProcessingJob['result'],
        errorMessage: row.error_message || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    refetchInterval: 5000,
  });
}

/**
 * Helper to poll until a job completes. Returns the final job state.
 */
export async function pollJobUntilComplete(
  jobId: string,
  maxWaitMs = 180000,
  pollIntervalMs = 2000
): Promise<ProcessingJob> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const { data, error } = await supabase
      .from('processing_jobs' as any)
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      await new Promise(r => setTimeout(r, pollIntervalMs));
      continue;
    }

    const row = data as unknown as JobRow;
    const job: ProcessingJob = {
      id: row.id,
      jobType: row.job_type as ProcessingJob['jobType'],
      targetId: row.target_id,
      status: row.status as ProcessingJob['status'],
      progress: row.progress || 0,
      result: row.result as ProcessingJob['result'],
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }

    await new Promise(r => setTimeout(r, pollIntervalMs));
  }

  throw new Error('Job polling timed out');
}
