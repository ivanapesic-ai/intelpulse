import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CEIDocument, DocumentMention } from "@/types/database";
import { toast } from "sonner";

// Fetch all documents
export function useDocuments(status?: CEIDocument["parseStatus"]) {
  return useQuery({
    queryKey: ["documents", status],
    queryFn: async () => {
      let query = supabase
        .from("cei_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("parse_status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row): CEIDocument => ({
        id: row.id,
        filename: row.filename,
        fileType: row.file_type as CEIDocument["fileType"],
        storagePath: row.storage_path,
        source: row.source as CEIDocument["source"],
        title: row.title || undefined,
        uploadDate: row.upload_date,
        parseStatus: row.parse_status as CEIDocument["parseStatus"],
        parsedContent: row.parsed_content as CEIDocument["parsedContent"],
        pageCount: row.page_count || undefined,
        fileSizeBytes: row.file_size_bytes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });
}

// Fetch document mentions
export function useDocumentMentions(documentId?: string) {
  return useQuery({
    queryKey: ["document-mentions", documentId],
    queryFn: async () => {
      let query = supabase
        .from("document_technology_mentions")
        .select(`
          *,
          technology_keywords (
            id,
            keyword,
            display_name,
            source
          )
        `)
        .order("confidence_score", { ascending: false });

      if (documentId) {
        query = query.eq("document_id", documentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row): DocumentMention & { keyword?: { displayName: string; source: string } } => ({
        id: row.id,
        documentId: row.document_id,
        keywordId: row.keyword_id,
        mentionContext: row.mention_context || undefined,
        trlMentioned: row.trl_mentioned || undefined,
        policyReference: row.policy_reference || undefined,
        confidenceScore: Number(row.confidence_score) || 0,
        pageNumber: row.page_number || undefined,
        createdAt: row.created_at,
        keyword: row.technology_keywords ? {
          displayName: row.technology_keywords.display_name,
          source: row.technology_keywords.source,
        } : undefined,
      }));
    },
    enabled: documentId !== undefined,
  });
}

// Parse a document
export function useParseDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, content }: { documentId: string; content: string }) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Both headers are required for the functions gateway in browser contexts.
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ documentId, content }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          throw new Error("Rate limit exceeded, please try again later");
        }
        if (response.status === 402) {
          throw new Error("Payment required, please add credits");
        }
        throw new Error(error.error || "Parsing failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Document parsed: ${data.mentionsCreated} mentions found`);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-mentions"] });
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
    },
    onError: (error) => {
      toast.error(`Parsing failed: ${error.message}`);
    },
  });
}

// Create a document record (for upload tracking)
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: {
      filename: string;
      fileType: CEIDocument["fileType"];
      storagePath: string;
      source?: CEIDocument["source"];
      title?: string;
      pageCount?: number;
      fileSizeBytes?: number;
    }) => {
      const { data, error } = await supabase
        .from("cei_documents")
        .insert({
          filename: doc.filename,
          file_type: doc.fileType,
          storage_path: doc.storagePath,
          source: doc.source || "manual",
          title: doc.title,
          page_count: doc.pageCount,
          file_size_bytes: doc.fileSizeBytes,
          parse_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error) => {
      toast.error(`Failed to create document: ${error.message}`);
    },
  });
}

// Delete a document and its storage file
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      // Delete mentions first (foreign key constraint)
      await supabase
        .from("document_technology_mentions")
        .delete()
        .eq("document_id", id);

      // Delete document record
      const { error: docError } = await supabase
        .from("cei_documents")
        .delete()
        .eq("id", id);

      if (docError) throw docError;

      // Delete from storage (ignore errors if file doesn't exist)
      await supabase.storage
        .from("cei-documents")
        .remove([storagePath]);

      return { id };
    },
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-stats"] });
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}

// Get document stats
export function useDocumentStats() {
  return useQuery({
    queryKey: ["document-stats"],
    queryFn: async () => {
      const { data: documents, error: docError } = await supabase
        .from("cei_documents")
        .select("parse_status");

      if (docError) throw docError;

      const { data: mentions, error: mentionError } = await supabase
        .from("document_technology_mentions")
        .select("confidence_score, trl_mentioned");

      if (mentionError) throw mentionError;

      const statusCount = (documents || []).reduce((acc, d) => {
        acc[d.parse_status] = (acc[d.parse_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const avgConfidence = mentions?.length
        ? (mentions || []).reduce((sum, m) => sum + (Number(m.confidence_score) || 0), 0) / mentions.length
        : 0;

      const trlMentions = (mentions || []).filter(m => m.trl_mentioned != null);

      return {
        totalDocuments: documents?.length || 0,
        pendingCount: statusCount.pending || 0,
        parsingCount: statusCount.parsing || 0,
        completedCount: statusCount.completed || 0,
        failedCount: statusCount.failed || 0,
        totalMentions: mentions?.length || 0,
        avgConfidence,
        trlMentionsCount: trlMentions.length,
      };
    },
  });
}
