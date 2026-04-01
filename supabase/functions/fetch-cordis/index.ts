import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CORDIS_API = "https://cordis.europa.eu/search/en";

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

    const maxResults = Math.min(limit || 50, 100);
    const url = `${CORDIS_API}?q=${encodeURIComponent(search_term)}&type=project&format=json&p=1&num=${maxResults}`;
    console.log(`Querying CORDIS for: "${search_term}"`);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("CORDIS API error:", response.status);
      return new Response(
        JSON.stringify({ error: `CORDIS API failed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const totalHits = parseInt(data?.result?.header?.numHits || "0", 10);
    const hits = data?.result?.hits?.hit || [];
    console.log(`Found ${totalHits} total hits, processing ${hits.length} for "${search_term}"`);

    let insertedCount = 0;
    let totalFunding = 0;
    let ecTotal = 0;
    let activeCount = 0;
    let completedCount = 0;

    for (const hit of hits) {
      const proj = hit.project;
      if (!proj) continue;

      const cordisId = proj.id || null;
      const totalCost = proj.totalCost ? parseFloat(proj.totalCost) : null;
      const ecContribution = proj.ecMaxContribution ? parseFloat(proj.ecMaxContribution) : null;
      const status = proj.status || null;

      if (totalCost) totalFunding += totalCost;
      if (ecContribution) ecTotal += ecContribution;
      if (status === "SIGNED") activeCount++;
      if (status === "CLOSED") completedCount++;

      const { error } = await supabase.from("cordis_projects").upsert(
        {
          keyword_id,
          project_acronym: proj.acronym || null,
          project_title: proj.title || "Untitled",
          project_status: status,
          start_date: proj.startDate || null,
          end_date: proj.endDate || null,
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
        project_count: totalHits,
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
        total_hits: totalHits,
        projects_found: hits.length,
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
