import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NodeGroup = "domain" | "concept" | "keyword";

export interface GraphNode {
  id: string;
  label: string;
  group: NodeGroup;
  domainCode?: string; // EV, AV, SDV for coloring
  value: number; // Size based on funding/companies
  metadata: {
    challengeScore: number | null;
    opportunityScore: number | null;
    maturityStage: string | null;
    quadrant: string | null;
    companyCount: number;
    totalFunding: number;
    patentCount: number;
  };
}

export type EdgeType = "requires" | "enables" | "part_of" | "cooccurs" | "has_keyword";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  value: number; // Raw strength
  normalizedValue: number; // 0-1000 for visualization
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  maxFunding: number;
  maxCompanies: number;
}

// Domain color mapping
export const DOMAIN_COLORS: Record<string, string> = {
  EV: "hsl(142, 76%, 36%)",   // Green
  AV: "hsl(217, 91%, 60%)",   // Blue  
  SDV: "hsl(270, 70%, 55%)",  // Purple
  default: "hsl(220, 13%, 69%)", // Gray
};

export function useKnowledgeGraph() {
  return useQuery({
    queryKey: ["knowledge-graph", "v2"],
    queryFn: async (): Promise<KnowledgeGraphData> => {
      // Fetch domains
      const { data: domains, error: domainError } = await supabase
        .from("ontology_domains")
        .select("id, name, code, description");
      
      if (domainError) throw domainError;

      // Fetch concepts with their domain info
      const { data: concepts, error: conceptError } = await supabase
        .from("ontology_concepts")
        .select(`
          id,
          name,
          description,
          domain_id,
          challenge_score,
          opportunity_score,
          maturity_stage,
          market_size_eur,
          is_core
        `)
        .eq("is_core", true);
      
      if (conceptError) throw conceptError;

      // Fetch keywords with their concept mappings
      const { data: keywords, error: keywordError } = await supabase
        .from("technology_keywords")
        .select(`
          id,
          display_name,
          keyword,
          ontology_concept_id,
          is_active
        `)
        .eq("is_active", true);
      
      if (keywordError) throw keywordError;

      // Fetch technologies for metrics
      const { data: technologies, error: techError } = await supabase
        .from("technologies")
        .select(`
          keyword_id,
          dealroom_company_count,
          total_funding_eur,
          total_patents,
          challenge_score,
          opportunity_score
        `);
      
      if (techError) throw techError;

      // Fetch ontology relationships (requires, enables, etc.)
      const { data: relationships, error: relError } = await supabase
        .from("ontology_relationships")
        .select("id, concept_from_id, concept_to_id, relationship_type, strength");
      
      if (relError) throw relError;

      // Fetch co-occurrences for keyword-level edges
      const { data: cooccurrences, error: coError } = await supabase
        .from("technology_cooccurrences")
        .select("id, keyword_id_a, keyword_id_b, cooccurrence_count")
        .gte("cooccurrence_count", 3)
        .order("cooccurrence_count", { ascending: false })
        .limit(50);
      
      if (coError) throw coError;

      // Build lookup maps
      const domainMap = new Map(domains?.map(d => [d.id, d]) || []);
      const conceptMap = new Map(concepts?.map(c => [c.id, c]) || []);
      const techMap = new Map(technologies?.map(t => [t.keyword_id, t]) || []);

      // Build nodes
      const nodes: GraphNode[] = [];
      let maxFunding = 0;
      let maxCompanies = 0;

      // Add domain nodes
      for (const domain of domains || []) {
        // Aggregate metrics from concepts in this domain
        const domainConcepts = concepts?.filter(c => c.domain_id === domain.id) || [];
        const domainKeywords = keywords?.filter(k => 
          domainConcepts.some(c => c.id === k.ontology_concept_id)
        ) || [];
        
        let totalFunding = 0;
        let totalCompanies = 0;
        let totalPatents = 0;
        
        for (const kw of domainKeywords) {
          const tech = techMap.get(kw.id);
          if (tech) {
            totalFunding += Number(tech.total_funding_eur) || 0;
            totalCompanies += tech.dealroom_company_count || 0;
            totalPatents += tech.total_patents || 0;
          }
        }

        maxFunding = Math.max(maxFunding, totalFunding);
        maxCompanies = Math.max(maxCompanies, totalCompanies);

        nodes.push({
          id: `domain-${domain.id}`,
          label: domain.name,
          group: "domain",
          domainCode: domain.code,
          value: totalFunding / 1e9 || 1, // Billions for sizing
          metadata: {
            challengeScore: null,
            opportunityScore: null,
            maturityStage: null,
            quadrant: null,
            companyCount: totalCompanies,
            totalFunding,
            patentCount: totalPatents,
          },
        });
      }

      // Add concept nodes
      for (const concept of concepts || []) {
        const domain = domainMap.get(concept.domain_id!);
        const conceptKeywords = keywords?.filter(k => k.ontology_concept_id === concept.id) || [];
        
        let totalFunding = 0;
        let totalCompanies = 0;
        let totalPatents = 0;
        
        for (const kw of conceptKeywords) {
          const tech = techMap.get(kw.id);
          if (tech) {
            totalFunding += Number(tech.total_funding_eur) || 0;
            totalCompanies += tech.dealroom_company_count || 0;
            totalPatents += tech.total_patents || 0;
          }
        }

        maxFunding = Math.max(maxFunding, totalFunding);
        maxCompanies = Math.max(maxCompanies, totalCompanies);

        nodes.push({
          id: `concept-${concept.id}`,
          label: concept.name,
          group: "concept",
          domainCode: domain?.code,
          value: totalFunding / 1e8 || 0.5, // Hundreds of millions for sizing
          metadata: {
            challengeScore: concept.challenge_score,
            opportunityScore: concept.opportunity_score,
            maturityStage: concept.maturity_stage,
            quadrant: getQuadrant(concept.challenge_score, concept.opportunity_score),
            companyCount: totalCompanies,
            totalFunding,
            patentCount: totalPatents,
          },
        });
      }

      // Add keyword nodes (only those with data)
      for (const kw of keywords || []) {
        const tech = techMap.get(kw.id);
        if (!tech) continue; // Skip keywords without technology data
        
        const concept = conceptMap.get(kw.ontology_concept_id!);
        const domain = concept ? domainMap.get(concept.domain_id!) : null;
        
        const funding = Number(tech.total_funding_eur) || 0;
        const companies = tech.dealroom_company_count || 0;
        
        maxFunding = Math.max(maxFunding, funding);
        maxCompanies = Math.max(maxCompanies, companies);

        nodes.push({
          id: `keyword-${kw.id}`,
          label: kw.display_name,
          group: "keyword",
          domainCode: domain?.code,
          value: funding / 1e7 || 0.2, // Tens of millions for sizing
          metadata: {
            challengeScore: tech.challenge_score,
            opportunityScore: tech.opportunity_score,
            maturityStage: null,
            quadrant: getQuadrant(tech.challenge_score, tech.opportunity_score),
            companyCount: companies,
            totalFunding: funding,
            patentCount: tech.total_patents || 0,
          },
        });
      }

      // Build a set of all valid node IDs for edge validation
      const nodeIdSet = new Set(nodes.map(n => n.id));

      // Build edges with validation
      const edges: GraphEdge[] = [];
      const maxCooccurrence = cooccurrences?.[0]?.cooccurrence_count || 1;

      // Domain → Concept edges (has_keyword relationship)
      for (const concept of concepts || []) {
        if (concept.domain_id) {
          const sourceId = `domain-${concept.domain_id}`;
          const targetId = `concept-${concept.id}`;
          
          // Only add edge if both nodes exist
          if (nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
            edges.push({
              id: `domain-concept-${concept.domain_id}-${concept.id}`,
              source: sourceId,
              target: targetId,
              type: "has_keyword",
              value: 10,
              normalizedValue: 500,
            });
          }
        }
      }

      // Concept → Keyword edges
      for (const kw of keywords || []) {
        if (kw.ontology_concept_id && techMap.has(kw.id)) {
          const sourceId = `concept-${kw.ontology_concept_id}`;
          const targetId = `keyword-${kw.id}`;
          
          // Only add edge if both nodes exist
          if (nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
            edges.push({
              id: `concept-keyword-${kw.ontology_concept_id}-${kw.id}`,
              source: sourceId,
              target: targetId,
              type: "has_keyword",
              value: 5,
              normalizedValue: 300,
            });
          }
        }
      }

      // Ontology relationships (requires, enables, part_of)
      for (const rel of relationships || []) {
        const sourceId = `concept-${rel.concept_from_id}`;
        const targetId = `concept-${rel.concept_to_id}`;
        
        if (nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
          edges.push({
            id: `rel-${rel.id}`,
            source: sourceId,
            target: targetId,
            type: rel.relationship_type as EdgeType,
            value: rel.strength || 5,
            normalizedValue: ((rel.strength || 5) / 10) * 1000,
          });
        }
      }

      // Co-occurrence edges between keywords
      for (const co of cooccurrences || []) {
        const sourceId = `keyword-${co.keyword_id_a}`;
        const targetId = `keyword-${co.keyword_id_b}`;
        
        if (nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
          edges.push({
            id: `cooccur-${co.id}`,
            source: sourceId,
            target: targetId,
            type: "cooccurs",
            value: co.cooccurrence_count || 1,
            normalizedValue: ((co.cooccurrence_count || 1) / maxCooccurrence) * 1000,
          });
        }
      }

      return { nodes, edges, maxFunding, maxCompanies };
    },
    staleTime: 5 * 60 * 1000,
  });
}

function getQuadrant(challenge: number | null, opportunity: number | null): string {
  if (challenge === null || opportunity === null) return "Monitor";
  
  if (challenge >= 1.5 && opportunity >= 1.5) return "Strategic Investment";
  if (challenge < 0.5 && opportunity >= 1.5) return "High-Risk High-Reward";
  if (challenge >= 1.0 && opportunity >= 1.0) return "Balanced Growth";
  if (challenge >= 1.5 && opportunity < 1.0) return "Mature Low-Growth";
  return "Monitor";
}

// Get ego network (1-hop neighbors) for a node
export function getEgoNetwork(
  nodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): { nodes: Set<string>; edges: Set<string> } {
  const neighborNodeIds = new Set<string>([nodeId]);
  const connectedEdgeIds = new Set<string>();

  for (const edge of edges) {
    if (edge.source === nodeId || edge.target === nodeId) {
      connectedEdgeIds.add(edge.id);
      neighborNodeIds.add(edge.source);
      neighborNodeIds.add(edge.target);
    }
  }

  return { nodes: neighborNodeIds, edges: connectedEdgeIds };
}
