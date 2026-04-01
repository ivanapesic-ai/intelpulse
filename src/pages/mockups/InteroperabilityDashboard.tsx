import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { PlatformFooter } from "@/components/mockups/PlatformFooter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { GapAnalysisSection } from "@/components/interoperability/GapAnalysisSection";
import { StandardsCoverageSection } from "@/components/interoperability/StandardsCoverageSection";
import { CharinTestResultsSection } from "@/components/interoperability/CharinTestResultsSection";
import { InteropOSSSection } from "@/components/interoperability/InteropOSSSection";
import { InteropNewsSection } from "@/components/interoperability/InteropNewsSection";
import { ProtocolReferenceGrid } from "@/components/interoperability/ProtocolReferenceGrid";
import { CommStackExplainer } from "@/components/interoperability/CommStackExplainer";

function useInteropData() {
  return useQuery({
    queryKey: ["interop-dashboard-data"],
    queryFn: async () => {
      const [{ data: standards, error: sErr }, { data: keywords, error: kErr }] = await Promise.all([
        supabase
          .from("keyword_standards")
          .select("id, keyword_id, standard_code, standard_title, issuing_body, body_type, status, url, description")
          .order("issuing_body"),
        supabase
          .from("technology_keywords")
          .select("id, display_name, keyword, excluded_from_sdv")
          .eq("excluded_from_sdv", false)
          .order("display_name"),
      ]);
      if (sErr) throw sErr;
      if (kErr) throw kErr;
      return { standards: standards || [], keywords: keywords || [] };
    },
  });
}

export default function InteroperabilityDashboard() {
  const { data, isLoading } = useInteropData();

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
            Standards coverage, protocol compatibility, and interoperability testing across the SDV technology landscape.
            Identifying gaps where technologies lack regulatory backing or conformance testing.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : data ? (
          <div className="space-y-10">
            {/* Section 1: Gap Analysis — the "so what" */}
            <GapAnalysisSection standards={data.standards} keywords={data.keywords} />

            <Separator />

            {/* Section 2: Standards Coverage Matrix — the evidence */}
            <StandardsCoverageSection standards={data.standards} keywords={data.keywords} />

            <Separator />

            {/* Section 3: CharIN Test Results — the proof */}
            <CharinTestResultsSection />

            <Separator />

            {/* Section 4: Open-Source Interop Ecosystem — fresh signals */}
            <InteropOSSSection />

            <Separator />

            {/* Section 5: Interop News — what's happening now */}
            <InteropNewsSection />

            <Separator />

            {/* Section 6: Protocol Reference Grid */}
            <ProtocolReferenceGrid />

            {/* Communication Stack Explainer — collapsible */}
            <CommStackExplainer />
          </div>
        ) : null}
      </main>
      <PlatformFooter />
    </div>
  );
}
