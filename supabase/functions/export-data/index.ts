import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action = "cache" } = await req.json();

    if (action === "cache") {
      // Get all keywords
      const { data: keywords, error: keywordsError } = await supabase
        .from("technology_keywords")
        .select("id, keyword, display_name")
        .eq("is_active", true);

      if (keywordsError) {
        throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
      }

      let cachedCount = 0;

      for (const kw of keywords || []) {
        // Get companies mapped to this keyword
        const { data: mappings } = await supabase
          .from("keyword_company_mapping")
          .select("company_id")
          .eq("keyword_id", kw.id);

        if (!mappings || mappings.length === 0) continue;

        const companyIds = mappings.map(m => m.company_id);

        // Get all company data
        const { data: companies } = await supabase
          .from("dealroom_companies")
          .select("*")
          .in("id", companyIds);

        if (!companies || companies.length === 0) continue;

        // Calculate aggregates
        const totalFunding = companies.reduce((sum, c) => sum + (c.total_funding_eur || 0), 0);
        const totalEmployees = companies.reduce((sum, c) => sum + (c.employees_count || 0), 0);
        const totalPatents = companies.reduce((sum, c) => sum + (c.patents_count || 0), 0);

        // Cache the data
        const { error: cacheError } = await supabase
          .from("dealroom_cache")
          .upsert(
            {
              cache_date: new Date().toISOString().split("T")[0],
              keyword: kw.keyword,
              company_count: companies.length,
              total_funding_eur: totalFunding,
              total_employees: totalEmployees,
              total_patents: totalPatents,
              companies_data: companies,
            },
            { onConflict: "cache_date,keyword" }
          );

        if (cacheError) {
          console.error(`Error caching ${kw.keyword}:`, cacheError);
        } else {
          cachedCount++;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          cachedKeywords: cachedCount,
          cacheDate: new Date().toISOString().split("T")[0],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "export") {
      // Get all data for export
      const { data: keywords } = await supabase
        .from("technology_keywords")
        .select("*")
        .eq("is_active", true);

      const { data: technologies } = await supabase
        .from("technologies")
        .select("*");

      const { data: companies } = await supabase
        .from("dealroom_companies")
        .select("*");

      const { data: mappings } = await supabase
        .from("keyword_company_mapping")
        .select("*");

      const { data: documents } = await supabase
        .from("cei_documents")
        .select("*");

      const { data: mentions } = await supabase
        .from("document_technology_mentions")
        .select("*");

      const exportData = {
        exportedAt: new Date().toISOString(),
        keywords: keywords || [],
        technologies: technologies || [],
        companies: companies || [],
        mappings: mappings || [],
        documents: documents || [],
        mentions: mentions || [],
        stats: {
          totalKeywords: keywords?.length || 0,
          totalTechnologies: technologies?.length || 0,
          totalCompanies: companies?.length || 0,
          totalDocuments: documents?.length || 0,
          totalMentions: mentions?.length || 0,
        },
      };

      return new Response(
        JSON.stringify(exportData),
        {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="ai-ce-heatmap-export-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'cache' or 'export'" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
