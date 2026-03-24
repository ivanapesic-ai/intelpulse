import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Unified Data Sync Hook
 * 
 * All technology/scoring data reads from the technology_intelligence materialized view.
 * A single query key prefix "technology-intelligence" covers all consumers.
 */

// All query keys that should be invalidated together
const TECHNOLOGY_QUERY_KEYS = [
  "technology-intelligence",
  "technology-region-stats",
  "keyword-stats",
  "keywords",
] as const;

const COMPANY_QUERY_KEYS = [
  "crunchbase-companies",
  "crunchbase-stats",
  "market-intelligence",
  "companies-for-technology",
  "company-evidence",
] as const;

const DOCUMENT_QUERY_KEYS = [
  "documents",
  "document-mentions",
  "document-stats",
] as const;

const SCORING_QUERY_KEYS = [
  "technology-intelligence",
  "concept-scoring",
] as const;

const PATENT_QUERY_KEYS = [
  "epo-patents",
  "patent-stats",
] as const;

export type SyncScope = 
  | "all" 
  | "technologies" 
  | "companies" 
  | "documents" 
  | "scoring" 
  | "patents";

interface SyncOptions {
  scope?: SyncScope | SyncScope[];
  onComplete?: () => void;
}

export function useDataSync() {
  const queryClient = useQueryClient();

  const invalidateByScope = useCallback(
    async (scope: SyncScope) => {
      const invalidations: Promise<void>[] = [];

      switch (scope) {
        case "technologies":
          for (const key of TECHNOLOGY_QUERY_KEYS) {
            invalidations.push(
              queryClient.invalidateQueries({ queryKey: [key] })
            );
          }
          break;

        case "companies":
          for (const key of COMPANY_QUERY_KEYS) {
            invalidations.push(
              queryClient.invalidateQueries({ queryKey: [key] })
            );
          }
          break;

        case "documents":
          for (const key of DOCUMENT_QUERY_KEYS) {
            invalidations.push(
              queryClient.invalidateQueries({ queryKey: [key] })
            );
          }
          break;

        case "scoring":
          for (const key of SCORING_QUERY_KEYS) {
            invalidations.push(
              queryClient.invalidateQueries({ queryKey: [key] })
            );
          }
          break;

        case "patents":
          for (const key of PATENT_QUERY_KEYS) {
            invalidations.push(
              queryClient.invalidateQueries({ queryKey: [key] })
            );
          }
          break;

        case "all":
          for (const key of [
            ...TECHNOLOGY_QUERY_KEYS,
            ...COMPANY_QUERY_KEYS,
            ...DOCUMENT_QUERY_KEYS,
            ...SCORING_QUERY_KEYS,
            ...PATENT_QUERY_KEYS,
          ]) {
            invalidations.push(
              queryClient.invalidateQueries({ queryKey: [key] })
            );
          }
          break;
      }

      await Promise.all(invalidations);
    },
    [queryClient]
  );

  const syncAll = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("all");
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  const sync = useCallback(
    async (options: SyncOptions) => {
      const scopes = Array.isArray(options.scope)
        ? options.scope
        : [options.scope || "all"];

      for (const scope of scopes) {
        await invalidateByScope(scope);
      }

      options.onComplete?.();
    },
    [invalidateByScope]
  );

  const syncTechnologies = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("technologies");
      await invalidateByScope("scoring");
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  const syncCompanies = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("companies");
      await invalidateByScope("technologies");
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  const syncPatents = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("patents");
      await invalidateByScope("technologies");
      await invalidateByScope("companies");
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  const syncDocuments = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("documents");
      await invalidateByScope("technologies");
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  const refetchActive = useCallback(async () => {
    await queryClient.refetchQueries({ type: "active" });
  }, [queryClient]);

  return {
    sync,
    syncAll,
    syncTechnologies,
    syncCompanies,
    syncPatents,
    syncDocuments,
    refetchActive,
    invalidateByScope,
  };
}

export function useAdminDataSync() {
  const { syncAll, syncTechnologies, syncCompanies, syncPatents, syncDocuments } = useDataSync();

  return {
    afterCrunchbaseImport: syncCompanies,
    afterEpoEnrichment: syncPatents,
    afterDocumentParse: syncDocuments,
    afterScoreRefresh: syncTechnologies,
    afterKeywordChange: syncAll,
    afterPipelineSync: syncAll,
  };
}
