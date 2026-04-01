import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SPARQL_ENDPOINT = "https://cordis.europa.eu/datalab/sparql";

function buildSparqlQuery(searchTerm: string, limit = 50): string {
  // Search for projects matching the keyword in title or objective
  return `
    PREFIX eurio: <http://data.europa.eu/s66#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT DISTINCT ?project ?acronym ?title ?status ?startDate ?endDate ?totalCost ?ecContribution ?cordisId
    WHERE {
      ?project a eurio:Project .
      ?project eurio:title ?title .
      FILTER(LANG(?title) = "en")
      FILTER(CONTAINS(LCASE(?title), LCASE("${searchTerm}")))
      
      OPTIONAL { ?project eurio:acronym ?acronym }
      OPTIONAL { ?project eurio:status ?status }
      OPTIONAL { ?project eurio:startDate ?startDate }
      OPTIONAL { ?project eurio:endDate ?endDate }
      OPTIONAL { ?project eurio:totalCost ?totalCost }
      OPTIONAL { ?project eurio:ecMaxContribution ?ecContribution }
      OPTIONAL { ?project eurio:projectID ?cordisId }
    }
    ORDER BY DESC(?totalCost)
    LIMIT ${limit}
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword_id, search_term, limit } = await req.json();

    if (!keyword_id || !search_term) {
      return new Response(
        JSON.stringify({ error: "keyword_id and search_term are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const query = buildSparqlQuery(search_term, limit || 50);
    console.log(`Querying CORDIS for: "${search_term}"`);

    const sparqlResponse = await fetch(SPARQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
      },
      body: `query=${encodeURIComponent(query)}`,
    });

    if (!sparqlResponse.ok) {
      const errorText = await sparqlResponse.text();
      console.error("SPARQL error:", errorText);
      return new Response(
        JSON.stringify({ error: `SPARQL query failed: ${sparqlResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sparqlData = await sparqlResponse.json();
    const bindings = sparqlData.results?.bindings || [];
    console.log(`Found ${bindings.length} projects for "${search_term}"`);

    // Transform and upsert projects
    let insertedCount = 0;
    let totalFunding = 0;
    let ecTotal = 0;
    let activeCount = 0;
    let completedCount = 0;

    for (const b of bindings) {
      const cordisId = b.cordisId?.value || b.project?.value?.split("/").pop() || null;
      const totalCost = b.totalCost?.value ? parseFloat(b.totalCost.value) : null;
      const ecContribution = b.ecContribution?.value ? parseFloat(b.ecContribution.value) : null;
      const status = b.status?.value || null;

      if (totalCost) totalFunding += totalCost;
      if (ecContribution) ecTotal += ecContribution;
      if (status === "signed" || status === "SIGNED") activeCount++;
      if (status === "closed" || status === "CLOSED") completedCount++;

      const { error } = await supabase.from("cordis_projects").upsert(
        {
          keyword_id,
          project_acronym: b.acronym?.value || null,
          project_title: b.title?.value || "Untitled",
          project_status: status,
          start_date: b.startDate?.value || null,
          end_date: b.endDate?.value || null,
          total_cost_eur: totalCost,
          ec_contribution_eur: ecContribution,
          cordis_url: cordisId ? `https://cordis.europa.eu/project/id/${cordisId}` : null,
          cordis_id: cordisId,
        },
        { onConflict: "keyword_id,cordis_id" }
      );

      if (!error) insertedCount++;
      else console.error("Insert error:", error.message);
    }

    // Update summary
    const { error: summaryError } = await supabase.from("cordis_keyword_summary").upsert(
      {
        keyword_id,
        project_count: bindings.length,
        total_funding_eur: totalFunding,
        ec_contribution_eur: ecTotal,
        active_projects: activeCount,
        completed_projects: completedCount,
        last_fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "keyword_id" }
    );

    if (summaryError) console.error("Summary error:", summaryError.message);

    return new Response(
      JSON.stringify({
        success: true,
        keyword: search_term,
        projects_found: bindings.length,
        projects_stored: insertedCount,
        total_funding_eur: totalFunding,
        ec_contribution_eur: ecTotal,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
