// supabase/functions/fetch-cordis-projects/index.ts
// Fetches EU-funded R&D projects from CORDIS SPARQL endpoint

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CORDIS_SPARQL_ENDPOINT = "https://cordis.europa.eu/datalab/sparql";

// Search term mappings — some keywords need broader/alternative SPARQL terms
const KEYWORD_SEARCH_TERMS: Record<string, string[]> = {
  "vehicle to grid": ["vehicle to grid", "V2G", "vehicle-to-grid"],
  "bidirectional charging": [
    "bidirectional charging",
    "bi-directional charging",
    "reverse charging",
  ],
  "battery management systems": [
    "battery management system",
    "BMS",
    "battery management",
  ],
  "battery management": [
    "battery management system",
    "BMS",
    "battery management",
  ],
  "digital twin": ["digital twin"],
  "edge computing": ["edge computing", "edge cloud", "fog computing"],
  "sensor fusion": ["LiDAR", "lidar", "sensor fusion", "light detection and ranging"],
  "lidar": ["LiDAR", "lidar", "light detection and ranging"],
  "autonomous driving": [
    "autonomous driving",
    "autonomous vehicle",
    "self-driving",
  ],
  "ev charging": [
    "electric vehicle charging",
    "EV charging",
    "charging infrastructure",
  ],
  "smart grid": ["smart grid", "smart electricity grid"],
  "cybersecurity": ["cybersecurity", "cyber security", "automotive security"],
  "v2x": ["V2X", "vehicle to everything", "vehicle-to-everything"],
  "vehicle to everything": ["V2X", "vehicle to everything", "vehicle-to-everything"],
  "hydrogen fuel cell": ["hydrogen fuel cell", "fuel cell vehicle", "FCEV"],
  "solid state battery": [
    "solid state battery",
    "solid-state battery",
    "all-solid-state",
  ],
  "electric mobility": ["electric mobility", "electromobility", "e-mobility"],
  "electric vehicle": ["electric vehicle", "EV", "battery electric vehicle"],
  "ev battery": ["EV battery", "electric vehicle battery", "lithium battery", "battery cell"],
  "software defined vehicle": ["software defined vehicle", "software-defined vehicle", "vehicle software platform"],
  "av software": ["ADAS", "advanced driver assistance", "AV simulation"],
  "energy management systems": ["energy management system", "EMS", "energy management"],
};

function buildSparqlQuery(searchTerm: string, limit = 200): string {
  const escaped = searchTerm.replace(/"/g, '\\"');

  return `
    PREFIX eurio: <http://data.europa.eu/s66#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT
      ?identifier
      ?title
      ?acronymLabel
      ?totalCostVal
      ?startDate
      ?endDate
      ?status
    WHERE {
      ?project a eurio:Project .
      ?project eurio:title ?title .
      ?project eurio:identifier ?identifier .
      FILTER(REGEX(?title, "${escaped}", "i"))

      OPTIONAL { ?project eurio:hasAcronym ?acr . ?acr rdfs:label ?acronymLabel }
      OPTIONAL { ?project eurio:hasTotalCost ?tc . ?tc eurio:value ?totalCostVal }
      OPTIONAL { ?project eurio:startDate ?startDate }
      OPTIONAL { ?project eurio:endDate ?endDate }
      OPTIONAL { ?project eurio:projectStatus ?status }
    }
    ORDER BY DESC(?totalCostVal)
    LIMIT ${limit}
  `;
}

async function queryCordis(
  sparqlQuery: string
): Promise<Record<string, any>[]> {
  const params = new URLSearchParams({
    query: sparqlQuery,
    format: "application/sparql-results+json",
  });

  const response = await fetch(`${CORDIS_SPARQL_ENDPOINT}?${params}`, {
    headers: {
      Accept: "application/sparql-results+json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CORDIS SPARQL error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.results?.bindings || [];
}

function parseProject(binding: Record<string, any>) {
  const identifier = binding.identifier?.value || "";
  // Extract acronym label — strip prefix if present (e.g. "HEFT: Full title" → "HEFT")
  let acronym = binding.acronymLabel?.value || null;
  if (acronym && acronym.includes(":")) {
    acronym = acronym.split(":")[0].trim();
  }
  return {
    cordis_id: identifier,
    title: binding.title?.value || "",
    acronym,
    total_cost_eur: binding.totalCostVal?.value
      ? parseFloat(binding.totalCostVal.value)
      : null,
    eu_contribution_eur: null, // EU contribution requires deeper graph traversal
    start_date: binding.startDate?.value || null,
    end_date: binding.endDate?.value || null,
    status: binding.status?.value || null,
    framework_programme: null,
    call_identifier: null,
    cordis_url: identifier
      ? `https://cordis.europa.eu/project/id/${identifier}`
      : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();
    const { keyword_id, keyword, dry_run = false } = body;

    // If no specific keyword, fetch all active keywords
    let keywords: { id: string; keyword: string; display_name: string }[] = [];

    if (keyword_id && keyword) {
      keywords = [{ id: keyword_id, keyword, display_name: keyword }];
    } else {
      const { data: allKeywords, error: kwError } = await supabaseClient
        .from("technology_keywords")
        .select("id, keyword, display_name")
        .eq("is_active", true)
        .eq("excluded_from_sdv", false)
        .order("keyword");

      if (kwError) throw kwError;
      keywords = allKeywords || [];
    }

    const results: {
      keyword: string;
      search_terms: string[];
      projects_found: number;
      projects_inserted: number;
      projects_skipped: number;
      total_funding_eur: number;
    }[] = [];

    let totalInserted = 0;
    let totalFound = 0;

    for (const kw of keywords) {
      const displayName = kw.display_name || kw.keyword.replace(/_/g, " ");
      const searchTerms =
        KEYWORD_SEARCH_TERMS[displayName.toLowerCase()] ||
        KEYWORD_SEARCH_TERMS[kw.keyword.toLowerCase()] ||
        [displayName];

      const allProjects = new Map<string, any>();

      for (const term of searchTerms) {
        console.log(`Querying CORDIS for "${term}" (keyword: ${kw.keyword})`);

        try {
          const sparqlQuery = buildSparqlQuery(term, 100);
          const bindings = await queryCordis(sparqlQuery);

          for (const binding of bindings) {
            const project = parseProject(binding);
            if (project.cordis_id && !allProjects.has(project.cordis_id)) {
              allProjects.set(project.cordis_id, project);
            }
          }

          // Small delay to be nice to the CORDIS endpoint
          await new Promise((r) => setTimeout(r, 500));
        } catch (err) {
          console.warn(`SPARQL query failed for term "${term}":`, err.message);
        }
      }

      const projects = Array.from(allProjects.values());
      totalFound += projects.length;

      let inserted = 0;
      let skipped = 0;

      if (!dry_run && projects.length > 0) {
        const rows = projects.map((p) => ({
          ...p,
          keyword_id: kw.id,
          keyword: kw.keyword,
          fetched_at: new Date().toISOString(),
        }));

        // Batch upsert in chunks of 50
        for (let i = 0; i < rows.length; i += 50) {
          const chunk = rows.slice(i, i + 50);
          const { data, error } = await supabaseClient
            .from("cordis_eu_projects")
            .upsert(chunk, {
              onConflict: "cordis_id,keyword_id",
              ignoreDuplicates: false,
            })
            .select("id");

          if (error) {
            console.error(
              `Upsert error for ${kw.keyword} chunk ${i}:`,
              error.message
            );
            skipped += chunk.length;
          } else {
            inserted += data?.length || chunk.length;
          }
        }
      }

      totalInserted += inserted;

      results.push({
        keyword: kw.keyword,
        search_terms: searchTerms,
        projects_found: projects.length,
        projects_inserted: inserted,
        projects_skipped: skipped,
        total_funding_eur: projects.reduce(
          (sum, p) => sum + (p.total_cost_eur || 0),
          0
        ),
      });

      console.log(
        `${kw.keyword}: ${projects.length} projects found, ${inserted} inserted`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          keywords_processed: keywords.length,
          total_projects_found: totalFound,
          total_projects_inserted: totalInserted,
          dry_run,
        },
        details: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("CORDIS fetch error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
