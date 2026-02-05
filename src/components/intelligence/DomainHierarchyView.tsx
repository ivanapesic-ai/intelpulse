import { useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDomainOverview, useKeywordOverview, KeywordOverview } from "@/hooks/useDomainHierarchy";
import { DomainCard } from "./DomainCard";

interface DomainHierarchyViewProps {
  searchQuery?: string;
  onSelectKeyword?: (keyword: KeywordOverview) => void;
  selectedKeywordId?: string | null;
}

export function DomainHierarchyView({ 
  searchQuery = "", 
  onSelectKeyword,
  selectedKeywordId 
}: DomainHierarchyViewProps) {
  const { data: domains, isLoading: domainsLoading, error: domainsError } = useDomainOverview();
  const { data: keywords, isLoading: keywordsLoading } = useKeywordOverview();

  const isLoading = domainsLoading || keywordsLoading;

  // Group keywords by domain
  const keywordsByDomain = useMemo(() => {
    if (!keywords) return new Map<number, KeywordOverview[]>();
    
    const map = new Map<number, KeywordOverview[]>();
    
    for (const kw of keywords) {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          kw.displayName.toLowerCase().includes(query) ||
          kw.keyword.toLowerCase().includes(query) ||
          kw.domainName.toLowerCase().includes(query);
        if (!matches) continue;
      }
      
      const existing = map.get(kw.domainId) || [];
      existing.push(kw);
      map.set(kw.domainId, existing);
    }
    
    return map;
  }, [keywords, searchQuery]);

  // Filter domains that have matching keywords (or show all if no search)
  const filteredDomains = useMemo(() => {
    if (!domains) return [];
    if (!searchQuery) return domains;
    
    return domains.filter(d => 
      keywordsByDomain.has(d.id) || 
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [domains, searchQuery, keywordsByDomain]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (domainsError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading domains: {domainsError.message}</p>
      </div>
    );
  }

  if (filteredDomains.length === 0) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          {searchQuery ? "No domains match your search" : "No domains configured yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredDomains.map((domain, index) => (
        <motion.div
          key={domain.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <DomainCard
            domain={domain}
            keywords={keywordsByDomain.get(domain.id) || []}
            onSelectKeyword={onSelectKeyword}
            selectedKeywordId={selectedKeywordId}
          />
        </motion.div>
      ))}
    </div>
  );
}
