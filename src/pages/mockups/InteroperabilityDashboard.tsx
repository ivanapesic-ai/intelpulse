import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { PlatformFooter } from "@/components/mockups/PlatformFooter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { InteropHealthHeader } from "@/components/interoperability/InteropHealthHeader";
import { InteropGapMatrix } from "@/components/interoperability/InteropGapMatrix";
import { StandardsCoverageSection } from "@/components/interoperability/StandardsCoverageSection";
import { TestIntelligenceSection } from "@/components/interoperability/TestIntelligenceSection";
import { InnovationPipelineSection } from "@/components/interoperability/InnovationPipelineSection";
import { ProtocolReferenceGrid } from "@/components/interoperability/ProtocolReferenceGrid";
import { CommStackExplainer } from "@/components/interoperability/CommStackExplainer";
import { ManufacturerCompatibilityMatrix } from "@/components/interoperability/ManufacturerCompatibilityMatrix";

function useInteropData() {
  return useQuery({
    queryKey: ["interop-dashboard-data-v2"],
    queryFn: async () => {
      const [
        { data: standards, error: sErr },
        { data: keywords, error: kErr },
        { data: events },
        { data: cordisRaw },
        { data: newsRaw },
      ] = await Promise.all([
        supabase
          .from("keyword_standards")
          .select("id, keyword_id, standard_code, standard_title, issuing_body, body_type, status, url, description")
          .order("issuing_body"),
        supabase
          .from("technology_keywords")
          .select("id, display_name, keyword, excluded_from_sdv")
          .eq("excluded_from_sdv", false)
          .eq("is_active", true)
          .order("display_name"),
        supabase
          .from("charin_test_events")
          .select("id, total_individual_tests"),
        supabase
          .from("cordis_eu_projects")
          .select("keyword_id"),
        supabase
          .from("news_keyword_matches")
          .select("keyword_id, news_id"),
      ]);
      if (sErr) throw sErr;
      if (kErr) throw kErr;

      // Build per-keyword counts
      const standardsByKeyword = new Map<string, number>();
      for (const s of standards || []) {
        standardsByKeyword.set(s.keyword_id, (standardsByKeyword.get(s.keyword_id) || 0) + 1);
      }

      // CharIN: count test results by keyword_id from charin_test_results
      const charinByKeyword = new Map<string, number>();
      // For now, no per-keyword charin data since results aren't linked yet
      // But we have total event-level tests
      const totalCharinTests = (events || []).reduce((s, e) => s + (e.total_individual_tests || 0), 0);

      const githubByKeyword = new Map<string, number>();
      for (const g of githubRaw || []) {
        if (g.keyword_id) githubByKeyword.set(g.keyword_id, (githubByKeyword.get(g.keyword_id) || 0) + 1);
      }

      const cordisByKeyword = new Map<string, number>();
      for (const c of cordisRaw || []) {
        if (c.keyword_id) cordisByKeyword.set(c.keyword_id, (cordisByKeyword.get(c.keyword_id) || 0) + 1);
      }

      const newsByKeyword = new Map<string, number>();
      const newsSeenPairs = new Set<string>();
      for (const n of newsRaw || []) {
        const key = `${n.keyword_id}:${n.news_id}`;
        if (n.keyword_id && !newsSeenPairs.has(key)) {
          newsSeenPairs.add(key);
          newsByKeyword.set(n.keyword_id, (newsByKeyword.get(n.keyword_id) || 0) + 1);
        }
      }

      const activeKeywords = keywords || [];

      // Count keywords with 3+ signals
      const fullCoverageCount = activeKeywords.filter((kw) => {
        const signals = [
          standardsByKeyword.get(kw.id) || 0,
          charinByKeyword.get(kw.id) || 0,
          cordisByKeyword.get(kw.id) || 0,
          newsByKeyword.get(kw.id) || 0,
        ].filter(s => s > 0).length;
        return signals >= 3;
      }).length;

      return {
        standards: standards || [],
        keywords: activeKeywords,
        standardsByKeyword,
        charinByKeyword,
        cordisByKeyword,
        newsByKeyword,
        totalStandards: (standards || []).length,
        totalCharinTests,
        cordisProjects: (cordisRaw || []).filter(c => c.keyword_id).length,
        fullCoverageCount,
      };
    },
  });
}

export default function InteroperabilityDashboard() {
  const { data, isLoading } = useInteropData();
  const [refOpen, setRefOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PlatformHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Live Data</Badge>
            <Badge variant="outline" className="text-xs">Interoperability</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-2">
            Interoperability Intelligence
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            From health overview to evidence: standards coverage, conformance testing, open-source implementations,
            and EU research funding across the SDV technology landscape.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : data ? (
          <div className="space-y-10">
            {/* Top: Health Score + Stat Cards */}
            <InteropHealthHeader
              totalStandards={data.totalStandards}
              totalCharinTests={data.totalCharinTests}
              activeGithubRepos={0}
              cordisProjects={data.cordisProjects}
              keywordCount={data.keywords.length}
              fullCoverageCount={data.fullCoverageCount}
            />

            <Separator />

            {/* Section 1: Gap Analysis Matrix */}
            <InteropGapMatrix
              keywords={data.keywords}
              standardsByKeyword={data.standardsByKeyword}
              charinByKeyword={data.charinByKeyword}
              githubByKeyword={new Map()}
              cordisByKeyword={data.cordisByKeyword}
              newsByKeyword={data.newsByKeyword}
            />

            <Separator />

            {/* Section 2: Standards Coverage Matrix */}
            <StandardsCoverageSection standards={data.standards} keywords={data.keywords} />

            <Separator />

            {/* Section 2.5: Manufacturer Compatibility */}
            <ManufacturerCompatibilityMatrix />

            <Separator />

            {/* Section 3: Test Intelligence */}
            <TestIntelligenceSection />

            <Separator />

            {/* Section 4: Innovation Pipeline */}
            <InnovationPipelineSection />

            <Separator />

            {/* Section 5: Collapsible Reference */}
            <Collapsible open={refOpen} onOpenChange={setRefOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                  <span className="font-semibold text-foreground">Protocol Reference & Communication Stack</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${refOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-6">
                  <ProtocolReferenceGrid />
                  <CommStackExplainer />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : null}
      </main>
      <PlatformFooter />
    </div>
  );
}
