import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// EU countries to filter by
const EU_COUNTRIES = [
  "DE", "FR", "NL", "FI", "SE", "ES", "IT", "PL", "AT", "BE",
  "DK", "IE", "PT", "CZ", "GR", "HU", "RO", "BG", "SK", "SI",
  "EE", "LV", "LT", "HR", "CY", "LU", "MT"
];

// Score calculation functions (0-2 scale)
function calculateInvestmentScore(totalFunding: number): number {
  if (totalFunding >= 10_000_000) return 2; // No major challenge
  if (totalFunding >= 1_000_000) return 1;  // Manageable challenge
  return 0; // Severe challenge
}

function calculateEmployeesScore(employeesCount: number): number {
  if (employeesCount >= 100) return 2;
  if (employeesCount >= 20) return 1;
  return 0;
}

function calculatePatentsScore(patentsCount: number): number {
  if (patentsCount >= 10) return 2;
  if (patentsCount >= 3) return 1;
  return 0;
}

interface DealroomCompany {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  hq_locations?: Array<{ country?: { code?: string }; city?: string }>;
  founded_year?: number;
  employee_count?: number;
  total_funding?: { amount?: number; currency?: string };
  valuation?: { amount?: number; currency?: string };
  last_funding_date?: string;
  last_funding?: { amount?: number };
  growth_stage?: string;
  investors?: Array<{ name: string }>;
  industries?: Array<{ name: string }>;
  patents_count?: number;
  news?: Array<{ title: string; date: string; url: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DEALROOM_API_KEY = Deno.env.get("DEALROOM_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DEALROOM_API_KEY) {
      throw new Error("DEALROOM_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, keyword, limit = 100 } = await req.json();

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
      .from("dealroom_sync_logs")
      .insert({
        sync_type: action || "full_sync",
        keywords_searched: keyword ? [keyword] : [],
        status: "running",
      })
      .select()
      .single();

    if (logError) {
      console.error("Error creating sync log:", logError);
    }

    const logId = syncLog?.id;

    // Get all active keywords from database
    const { data: keywords, error: keywordsError } = await supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, aliases")
      .eq("is_active", true);

    if (keywordsError) {
      throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
    }

    // Build search query from keywords
    const searchTerms = keyword 
      ? [keyword]
      : keywords?.slice(0, 10).map(k => k.display_name) || [];

    let recordsFetched = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    const errors: string[] = [];

    for (const searchTerm of searchTerms) {
      try {
        // Call Dealroom API
        const dealroomResponse = await fetch(
          `https://api.dealroom.co/api/v2/companies?` + new URLSearchParams({
            query: searchTerm,
            hq_countries: EU_COUNTRIES.join(","),
            limit: String(Math.min(limit, 100)),
            sort: "-total_funding",
          }),
          {
            headers: {
              "Authorization": `Bearer ${DEALROOM_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!dealroomResponse.ok) {
          const errorText = await dealroomResponse.text();
          console.error(`Dealroom API error for "${searchTerm}":`, dealroomResponse.status, errorText);
          errors.push(`${searchTerm}: ${dealroomResponse.status}`);
          continue;
        }

        const dealroomData = await dealroomResponse.json();
        const companies: DealroomCompany[] = dealroomData.items || dealroomData.data || [];

        recordsFetched += companies.length;

        // Find matching keyword
        const matchingKeyword = keywords?.find(
          k => k.display_name.toLowerCase() === searchTerm.toLowerCase() ||
               k.keyword.toLowerCase() === searchTerm.toLowerCase() ||
               k.aliases?.some((a: string) => a.toLowerCase() === searchTerm.toLowerCase())
        );

        for (const company of companies) {
          const hqLocation = company.hq_locations?.[0];
          const hqCountry = hqLocation?.country?.code || null;
          const hqCity = hqLocation?.city || null;

          // Convert funding to EUR (assume already in EUR from Dealroom)
          const totalFundingEur = company.total_funding?.amount || 0;
          const valuationEur = company.valuation?.amount || 0;
          const lastFundingAmount = company.last_funding?.amount || 0;
          const employeesCount = company.employee_count || 0;
          const patentsCount = company.patents_count || 0;

          // Upsert company
          const { data: upsertedCompany, error: upsertError } = await supabase
            .from("dealroom_companies")
            .upsert(
              {
                dealroom_id: company.id,
                name: company.name,
                tagline: company.tagline || null,
                description: company.description || null,
                website: company.website || null,
                hq_country: hqCountry,
                hq_city: hqCity,
                founded_year: company.founded_year || null,
                employees_count: employeesCount,
                total_funding_eur: totalFundingEur,
                valuation_eur: valuationEur,
                last_funding_date: company.last_funding_date || null,
                last_funding_amount_eur: lastFundingAmount,
                growth_stage: company.growth_stage || null,
                investors: company.investors?.map(i => i.name) || [],
                industries: company.industries?.map(i => i.name) || [],
                patents_count: patentsCount,
                news_items: company.news || null,
                raw_data: company,
                synced_at: new Date().toISOString(),
              },
              { onConflict: "dealroom_id" }
            )
            .select()
            .single();

          if (upsertError) {
            console.error(`Error upserting company ${company.name}:`, upsertError);
            continue;
          }

          // Track if created or updated
          if (upsertedCompany) {
            recordsCreated++;

            // Create keyword-company mapping if we have a matching keyword
            if (matchingKeyword && upsertedCompany.id) {
              await supabase
                .from("keyword_company_mapping")
                .upsert(
                  {
                    keyword_id: matchingKeyword.id,
                    company_id: upsertedCompany.id,
                    relevance_score: 1.0,
                  },
                  { onConflict: "keyword_id,company_id" }
                );
            }
          }
        }

        // Small delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (searchError) {
        console.error(`Error searching for "${searchTerm}":`, searchError);
        errors.push(`${searchTerm}: ${searchError instanceof Error ? searchError.message : "Unknown error"}`);
      }
    }

    // Update technology stats based on mapped companies
    if (keywords) {
      for (const kw of keywords) {
        // Get companies mapped to this keyword
        const { data: mappings } = await supabase
          .from("keyword_company_mapping")
          .select("company_id")
          .eq("keyword_id", kw.id);

        if (mappings && mappings.length > 0) {
          const companyIds = mappings.map(m => m.company_id);

          // Get aggregate stats for these companies
          const { data: companies } = await supabase
            .from("dealroom_companies")
            .select("total_funding_eur, employees_count, patents_count")
            .in("id", companyIds);

          if (companies && companies.length > 0) {
            const totalFunding = companies.reduce((sum, c) => sum + (c.total_funding_eur || 0), 0);
            const totalEmployees = companies.reduce((sum, c) => sum + (c.employees_count || 0), 0);
            const totalPatents = companies.reduce((sum, c) => sum + (c.patents_count || 0), 0);

            // Calculate 0-2 scores
            const investmentScore = calculateInvestmentScore(totalFunding / companies.length);
            const employeesScore = calculateEmployeesScore(totalEmployees / companies.length);
            const patentsScore = calculatePatentsScore(totalPatents);

            // Upsert technology record
            await supabase
              .from("technologies")
              .upsert(
                {
                  keyword_id: kw.id,
                  name: kw.display_name,
                  description: `Technology area with ${companies.length} companies`,
                  investment_score: investmentScore,
                  employees_score: employeesScore,
                  patents_score: patentsScore,
                  total_funding_eur: totalFunding,
                  total_employees: totalEmployees,
                  total_patents: totalPatents,
                  dealroom_company_count: companies.length,
                  last_updated: new Date().toISOString(),
                },
                { onConflict: "keyword_id" }
              );
          }
        }
      }
    }

    // Update sync log
    if (logId) {
      await supabase
        .from("dealroom_sync_logs")
        .update({
          records_fetched: recordsFetched,
          records_created: recordsCreated,
          records_updated: recordsUpdated,
          status: errors.length > 0 ? "completed" : "completed",
          error_message: errors.length > 0 ? errors.join("; ") : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        recordsFetched,
        recordsCreated,
        recordsUpdated,
        errors: errors.length > 0 ? errors : undefined,
        syncLogId: logId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Dealroom sync error:", error);
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
