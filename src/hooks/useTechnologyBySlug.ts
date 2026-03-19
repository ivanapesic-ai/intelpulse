import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TechnologyBySlug {
  keywordId: string;
  keyword: string;
  displayName: string;
  description: string | null;
  ontologyConceptId: number | null;
  domainName: string | null;
  // Technology scores
  investmentScore: number;
  employeesScore: number;
  patentsScore: number;
  trlScore: number;
  visibilityScore: number;
  compositeScore: number;
  researchScore: number;
  // C-O scores
  challengeScore: number | null;
  opportunityScore: number | null;
  // Raw metrics
  totalFundingEur: number;
  totalEmployees: number;
  totalPatents: number;
  avgTrlMentioned: number | null;
  newsMentionCount: number;
  documentMentionCount: number;
  dealroomCompanyCount: number;
  trend: string;
}

export function useTechnologyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["technology-by-slug", slug],
    queryFn: async (): Promise<TechnologyBySlug | null> => {
      if (!slug) return null;

      // Get keyword by slug
      const { data: keyword, error: kwError } = await supabase
        .from("technology_keywords")
        .select("id, keyword, display_name, description, ontology_concept_id")
        .eq("keyword", slug)
        .maybeSingle();

      if (kwError) throw kwError;
      if (!keyword) return null;

      // Get technology scores
      const { data: tech, error: techError } = await supabase
        .from("technologies")
        .select("*")
        .eq("keyword_id", keyword.id)
        .maybeSingle();

      if (techError) throw techError;

      // Get domain name from ontology_concepts
      let domainName: string | null = null;
      if (keyword.ontology_concept_id) {
        const { data: concept } = await supabase
          .from("ontology_concepts")
          .select("name, ontology_domains(name)")
          .eq("id", keyword.ontology_concept_id)
          .maybeSingle();

        if (concept) {
          domainName = (concept as any).ontology_domains?.name || concept.name;
        }
      }

      return {
        keywordId: keyword.id,
        keyword: keyword.keyword,
        displayName: keyword.display_name,
        description: keyword.description,
        ontologyConceptId: keyword.ontology_concept_id,
        domainName,
        investmentScore: tech?.investment_score || 0,
        employeesScore: tech?.employees_score || 0,
        patentsScore: tech?.patents_score || 0,
        trlScore: (tech as any)?.trl_score || 0,
        visibilityScore: (tech as any)?.visibility_score || 0,
        compositeScore: Number((tech as any)?.log_composite_score) || Number(tech?.composite_score) || 0,
        totalFundingEur: Number(tech?.total_funding_eur) || 0,
        totalEmployees: tech?.total_employees || 0,
        totalPatents: tech?.total_patents || 0,
        avgTrlMentioned: (tech as any)?.avg_trl_mentioned || null,
        newsMentionCount: (tech as any)?.news_mention_count || 0,
        documentMentionCount: tech?.document_mention_count || 0,
        dealroomCompanyCount: tech?.dealroom_company_count || 0,
        trend: tech?.trend || "stable",
      };
    },
    enabled: !!slug,
  });
}
