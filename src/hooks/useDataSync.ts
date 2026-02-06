import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Unified Data Sync Hook
 * 
 * Provides a single source of truth for invalidating all related queries
 * after data mutations. This ensures radars, dashboards, explorers, and cards
 * all reflect the latest data consistently.
 */

// All query keys that should be invalidated together
const TECHNOLOGY_QUERY_KEYS = [
  "technologies",
  "technology",
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
  "domain-hierarchy",
  "co-scoring",
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
  /** Which data scope to invalidate */
  scope?: SyncScope | SyncScope[];
  /** Optional callback after sync completes */
  onComplete?: () => void;
}

export function useDataSync() {
  const queryClient = useQueryClient();

  /**
   * Invalidate queries by scope
   */
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
          // Invalidate everything
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

  /**
   * Full sync - invalidates all related queries
   * Use after major data operations (imports, reprocessing, etc.)
   */
  const syncAll = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("all");
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  /**
   * Scoped sync - invalidates specific data domains
   * Use after targeted operations
   */
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

  /**
   * Technology sync - invalidates all technology-related queries
   * Use after keyword updates, score recalculations, etc.
   */
  const syncTechnologies = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("technologies");
      await invalidateByScope("scoring");
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  /**
   * Company sync - invalidates company and market intelligence queries
   * Use after Crunchbase imports, keyword mappings, etc.
   */
  const syncCompanies = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("companies");
      await invalidateByScope("technologies"); // Companies affect tech scores
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  /**
   * Patent sync - invalidates patent and technology queries
   * Use after EPO enrichment
   */
  const syncPatents = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("patents");
      await invalidateByScope("technologies"); // Patents affect tech scores
      await invalidateByScope("companies"); // Patents update company records
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  /**
   * Document sync - invalidates document and technology queries
   * Use after document parsing
   */
  const syncDocuments = useCallback(
    async (options?: { onComplete?: () => void }) => {
      await invalidateByScope("documents");
      await invalidateByScope("technologies"); // Documents affect TRL/visibility scores
      options?.onComplete?.();
    },
    [invalidateByScope]
  );

  /**
   * Refetch active queries (more aggressive than invalidate)
   * Use when you need immediate UI update
   */
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

/**
 * Hook for Admin Panel operations that need comprehensive sync
 */
export function useAdminDataSync() {
  const { syncAll, syncTechnologies, syncCompanies, syncPatents, syncDocuments } = useDataSync();

  return {
    /** After Crunchbase import or reprocessing */
    afterCrunchbaseImport: syncCompanies,
    
    /** After EPO enrichment */
    afterEpoEnrichment: syncPatents,
    
    /** After document parsing */
    afterDocumentParse: syncDocuments,
    
    /** After score recalculation */
    afterScoreRefresh: syncTechnologies,
    
    /** After keyword taxonomy changes */
    afterKeywordChange: syncAll,
    
    /** Full data pipeline sync */
    afterPipelineSync: syncAll,
  };
}
