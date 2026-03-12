import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active technologies with their current metrics
    const { data: technologies, error: techError } = await supabase
      .from("technologies")
      .select("keyword_id, dealroom_company_count, total_funding_eur, total_patents, total_employees, news_mention_count, composite_score, investment_score, patents_score, visibility_score")
      .not("keyword_id", "is", null);

    if (techError) throw techError;

    const today = new Date().toISOString().split("T")[0];
    const snapshots = (technologies || []).map((t) => ({
      keyword_id: t.keyword_id,
      snapshot_date: today,
      company_count: t.dealroom_company_count || 0,
      total_funding_usd: Math.round(t.total_funding_eur || 0),
      total_patents: t.total_patents || 0,
      total_employees: t.total_employees || 0,
      news_mention_count: t.news_mention_count || 0,
      composite_score: t.composite_score || 0,
      investment_score: t.investment_score || 0,
      patents_score: t.patents_score || 0,
      visibility_score: t.visibility_score || 0,
    }));

    if (snapshots.length === 0) {
      return new Response(
        JSON.stringify({ message: "No technologies to snapshot" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert to handle re-runs on same day
    const { error: insertError } = await supabase
      .from("keyword_signal_snapshots")
      .upsert(snapshots, { onConflict: "keyword_id,snapshot_date" });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        message: `Snapshot captured for ${snapshots.length} technologies`,
        date: today,
        count: snapshots.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
