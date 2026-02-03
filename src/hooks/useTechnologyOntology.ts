import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TechnologyNode {
  id: string;
  name: string;
  companyCount: number;
  totalFunding: number;
}

interface TechnologyEdge {
  source: string;
  target: string;
  weight: number;
  sharedCompanies: number;
}

interface OntologyData {
  nodes: TechnologyNode[];
  edges: TechnologyEdge[];
  clusters: Map<string, string[]>;
}

export function useTechnologyOntology() {
  return useQuery({
    queryKey: ["technology-ontology"],
    queryFn: async (): Promise<OntologyData> => {
      // Fetch co-occurrences with keyword names
      const { data: cooccurrences, error: coError } = await supabase
        .from("technology_cooccurrences")
        .select(`
          keyword_id_a,
          keyword_id_b,
          cooccurrence_count,
          source_documents
        `)
        .gte("cooccurrence_count", 2)
        .order("cooccurrence_count", { ascending: false });

      if (coError) throw coError;

      // Fetch all active keywords with their stats
      const { data: keywords, error: kwError } = await supabase
        .from("technology_keywords")
        .select("id, display_name")
        .eq("is_active", true);

      if (kwError) throw kwError;

      // Fetch technology stats for funding data
      const { data: techStats, error: statsError } = await supabase
        .from("technologies")
        .select("keyword_id, dealroom_company_count, total_funding_eur");

      if (statsError) throw statsError;

      // Build keyword lookup
      const keywordMap = new Map(keywords?.map(k => [k.id, k.display_name]) || []);
      const statsMap = new Map(techStats?.map(t => [t.keyword_id, t]) || []);

      // Get unique node IDs from edges
      const nodeIds = new Set<string>();
      (cooccurrences || []).forEach(co => {
        nodeIds.add(co.keyword_id_a);
        nodeIds.add(co.keyword_id_b);
      });

      // Build nodes
      const nodes: TechnologyNode[] = Array.from(nodeIds)
        .map(id => {
          const stats = statsMap.get(id);
          return {
            id,
            name: keywordMap.get(id) || "Unknown",
            companyCount: stats?.dealroom_company_count || 0,
            totalFunding: Number(stats?.total_funding_eur) || 0,
          };
        })
        .filter(n => n.name !== "Unknown");

      // Build edges
      const edges: TechnologyEdge[] = (cooccurrences || [])
        .filter(co => keywordMap.has(co.keyword_id_a) && keywordMap.has(co.keyword_id_b))
        .map(co => ({
          source: co.keyword_id_a,
          target: co.keyword_id_b,
          weight: co.cooccurrence_count || 1,
          sharedCompanies: co.source_documents || 1,
        }));

      // Simple cluster detection based on strongest connections
      const clusters = detectClusters(nodes, edges);

      return { nodes, edges, clusters };
    },
  });
}

// Simple cluster detection - group nodes by their strongest connection
function detectClusters(
  nodes: TechnologyNode[],
  edges: TechnologyEdge[]
): Map<string, string[]> {
  const clusters = new Map<string, string[]>();
  const assigned = new Set<string>();

  // Sort edges by weight (strongest first)
  const sortedEdges = [...edges].sort((a, b) => b.weight - a.weight);

  // Assign nodes to clusters based on strongest connections
  for (const edge of sortedEdges) {
    const sourceAssigned = assigned.has(edge.source);
    const targetAssigned = assigned.has(edge.target);

    if (!sourceAssigned && !targetAssigned) {
      // Create new cluster
      const clusterId = edge.source;
      clusters.set(clusterId, [edge.source, edge.target]);
      assigned.add(edge.source);
      assigned.add(edge.target);
    } else if (!sourceAssigned && targetAssigned) {
      // Add source to target's cluster
      for (const [clusterId, members] of clusters.entries()) {
        if (members.includes(edge.target)) {
          members.push(edge.source);
          assigned.add(edge.source);
          break;
        }
      }
    } else if (sourceAssigned && !targetAssigned) {
      // Add target to source's cluster
      for (const [clusterId, members] of clusters.entries()) {
        if (members.includes(edge.source)) {
          members.push(edge.target);
          assigned.add(edge.target);
          break;
        }
      }
    }
  }

  return clusters;
}

// Helper to get cluster name by representative technology
export function getClusterName(clusterId: string, nodes: TechnologyNode[]): string {
  const node = nodes.find(n => n.id === clusterId);
  return node?.name || "Unknown Cluster";
}
