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

// Parse employees from Dealroom's format (string like "2-10", "51-200", or number)
function parseEmployees(employees: string | number | undefined): number {
  if (!employees) return 0;
  if (typeof employees === 'number') return employees;
  const str = String(employees);
  const match = str.match(/(\d+)-(\d+)/);
  if (match) {
    return Math.floor((parseInt(match[1]) + parseInt(match[2])) / 2);
  }
  const single = parseInt(str);
  return isNaN(single) ? 0 : single;
}

interface DealroomCompany {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  // Dealroom returns country.name (not code) and city as string
  hq_locations?: Array<{ country?: { code?: string; name?: string }; city?: string }>;
  founded_year?: number;
  // Dealroom returns employees as string like "2-10" or "51-200"
  employees?: string | number;
  employee_count?: number; // Fallback
  // Dealroom returns funding as direct number in millions
  total_funding?: number;
  valuation?: number;
  last_funding_date?: string;
  last_funding?: { amount?: number };
  last_funding_amount?: number;
  growth_stage?: string;
  investors?: Array<{ name: string }> | string[];
  industries?: Array<{ name: string }> | string[];
  patents_count?: number;
  news?: Array<{ title: string; date: string; url: string }>;
  // New high-priority fields
  status?: string;                    // active, closed, acquired
  employee_growth?: number;           // % growth rate
  jobs_count?: number;                // open positions
  technologies?: Array<{ name: string }> | string[];  // tech stack
  lead_investors?: Array<{ name: string }> | string[];
  funding_rounds?: Array<{
    date?: string;
    amount?: number;
    round_type?: string;
    investors?: Array<{ name: string }> | string[];
  }>;
  // Acquisition tracking fields
  acquired_by?: string | { name?: string; id?: string };
  acquisition_date?: string;
  acquisition_amount?: number;
}

// Calculate trend based on employee growth and hiring activity
function calculateTrend(companies: Array<{ employee_growth: number | null; jobs_count: number | null }>): 'up' | 'down' | 'stable' {
  const companiesWithGrowth = companies.filter(c => c.employee_growth !== null);
  if (companiesWithGrowth.length === 0) return 'stable';
  
  const avgGrowth = companiesWithGrowth.reduce((sum, c) => sum + (c.employee_growth || 0), 0) / companiesWithGrowth.length;
  const totalJobs = companies.reduce((sum, c) => sum + (c.jobs_count || 0), 0);
  
  // Strong growth signals
  if (avgGrowth > 15 || totalJobs > 100) return 'up';
  // Moderate growth
  if (avgGrowth > 5 || totalJobs > 30) return 'up';
  // Decline signals
  if (avgGrowth < -10) return 'down';
  if (avgGrowth < -5 && totalJobs < 10) return 'down';
  
  return 'stable';
}

interface ApiUsage {
  id: string;
  period_start: string;
  period_end: string;
  api_calls_limit: number;
  api_calls_used: number;
  last_sync_date: string | null;
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

    // Create Basic Auth header (API key as username, empty password)
    const encoder = new TextEncoder();
    const credentials = encoder.encode(`${DEALROOM_API_KEY}:`);
    const base64Credentials = btoa(String.fromCharCode(...credentials));
    const authHeader = `Basic ${base64Credentials}`;
    
    console.log(`API key length: ${DEALROOM_API_KEY.length}, Auth header created successfully`);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, keyword, limit = 100, keywordsPerSync = 10 } = await req.json();

    // Check API usage quota before proceeding
    const now = new Date();
    const { data: usageData, error: usageError } = await supabase
      .from("dealroom_api_usage")
      .select("*")
      .gte("period_end", now.toISOString().split("T")[0])
      .order("period_start", { ascending: false })
      .limit(1)
      .single();

    if (usageError && usageError.code !== "PGRST116") {
      console.error("Error fetching API usage:", usageError);
    }

    let currentUsage: ApiUsage | null = usageData;

    // Create new period if none exists or current one expired
    if (!currentUsage) {
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const { data: newUsage, error: createError } = await supabase
        .from("dealroom_api_usage")
        .insert({
          period_start: periodStart.toISOString().split("T")[0],
          period_end: periodEnd.toISOString().split("T")[0],
          api_calls_limit: 50000,
          api_calls_used: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating usage period:", createError);
      } else {
        currentUsage = newUsage;
      }
    }

    // Check if quota exceeded
    if (currentUsage && currentUsage.api_calls_used >= currentUsage.api_calls_limit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "API quota exceeded for current billing period",
          quotaExceeded: true,
          usage: {
            used: currentUsage.api_calls_used,
            limit: currentUsage.api_calls_limit,
            periodEnd: currentUsage.period_end,
          },
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
      .from("dealroom_sync_logs")
      .insert({
        sync_type: action || "full_sync",
        keywords_searched: keyword ? [keyword] : [],
        status: "running",
        api_calls_made: 0,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error creating sync log:", logError);
    }

    const logId = syncLog?.id;

    // Get all active keywords from database (now including dealroom_tags)
    const { data: keywords, error: keywordsError } = await supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, aliases, source, dealroom_tags")
      .eq("is_active", true);

    if (keywordsError) {
      throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
    }

    const activeKeywords = keywords || [];

    // Build search terms from dealroom_tags (Dealroom's actual taxonomy)
    // If a specific keyword is provided, use it directly; otherwise aggregate dealroom_tags
    let searchTerms: string[] = [];
    let keywordTagMapping: Map<string, string[]> = new Map(); // tag -> keyword_ids that use this tag

    if (keyword) {
      // Direct search with provided term
      searchTerms = [keyword];
    } else {
      // Collect all unique dealroom_tags from keywords that have them
      const tagSet = new Set<string>();
      for (const kw of activeKeywords) {
        const tags = kw.dealroom_tags || [];
        for (const tag of tags) {
          tagSet.add(tag.toLowerCase());
          // Track which keywords map to this tag
          const existing = keywordTagMapping.get(tag.toLowerCase()) || [];
          existing.push(kw.id);
          keywordTagMapping.set(tag.toLowerCase(), existing);
        }
      }
      searchTerms = Array.from(tagSet).slice(0, keywordsPerSync);
    }

    console.log(`Will search for ${searchTerms.length} Dealroom tags:`, searchTerms);

    // Update sync log with the actual tags we are about to query
    if (logId) {
      await supabase
        .from("dealroom_sync_logs")
        .update({ keywords_searched: searchTerms })
        .eq("id", logId);
    }

    let recordsFetched = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let apiCallsMade = 0;
    const errors: string[] = [];

    // Calculate remaining quota
    const remainingCalls = currentUsage 
      ? currentUsage.api_calls_limit - currentUsage.api_calls_used 
      : 50000;

    for (const searchTag of searchTerms) {
      // Check if we'd exceed quota
      if (apiCallsMade >= remainingCalls) {
        errors.push(`Stopped early: API quota would be exceeded`);
        break;
      }

      try {
        // Count this API call
        apiCallsMade++;

        console.log(`Searching Dealroom for tag "${searchTag}"...`);

        // Call Dealroom API v1 with POST and form_data filters
        // Using tags filter with Dealroom's actual taxonomy terms
        const dealroomResponse = await fetch(
          `https://api.dealroom.co/api/v1/companies?limit=${Math.min(limit, 100)}&sort=-total_funding`,
          {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              form_data: {
                must: {
                  hq_locations: ["Europe"],
                },
                should: {
                  tags: [searchTag],
                  sub_industries: [searchTag],
                },
              },
            }),
          }
        );

        if (!dealroomResponse.ok) {
          const errorText = await dealroomResponse.text();
          console.error(`Dealroom API error for tag "${searchTag}":`, dealroomResponse.status, errorText);
          errors.push(`${searchTag}: ${dealroomResponse.status} - ${errorText.substring(0, 100)}`);
          continue;
        }

        const dealroomData = await dealroomResponse.json();
        const companies: DealroomCompany[] = dealroomData.items || dealroomData.companies || [];
        
        console.log(`Tag "${searchTag}": found ${dealroomData.total || companies.length} companies`);

        recordsFetched += companies.length;

        // Find all keywords that have this tag in their dealroom_tags
        const matchingKeywordIds = keywordTagMapping.get(searchTag) || [];
        const matchingKeywords = keywords?.filter(k => matchingKeywordIds.includes(k.id)) || [];

        for (const company of companies) {
          // Get company status - we now keep acquired companies to track acquisitions!
          const companyStatus = company.status?.toLowerCase() || 'active';
          
          // Skip only truly closed/dead companies, but KEEP acquired companies
          if (companyStatus === 'closed' || companyStatus === 'dead') {
            console.log(`Skipping closed company: ${company.name} (status: ${companyStatus})`);
            continue;
          }
          
          // Parse acquisition data if company was acquired
          const acquiredBy = company.acquired_by
            ? (typeof company.acquired_by === 'string' 
                ? company.acquired_by 
                : company.acquired_by.name || null)
            : null;
          const acquiredDate = company.acquisition_date || null;
          // Acquisition amount in millions, convert to full EUR
          const acquisitionAmountEur = typeof company.acquisition_amount === 'number'
            ? company.acquisition_amount * 1_000_000
            : null;
          
          if (companyStatus === 'acquired' && acquiredBy) {
            console.log(`Acquired company: ${company.name} → acquired by ${acquiredBy}`);
          }

          const hqLocation = company.hq_locations?.[0];
          // Dealroom returns country.name (e.g., "Italy"), not code
          const hqCountry = hqLocation?.country?.name || hqLocation?.country?.code || null;
          
          // Parse hq_city - Dealroom may return city as string or as object with name property
          let hqCity: string | null = null;
          if (hqLocation?.city) {
            if (typeof hqLocation.city === 'string') {
              hqCity = hqLocation.city;
            } else if (typeof hqLocation.city === 'object' && hqLocation.city !== null) {
              // Handle JSON object: { id: 123, name: "CityName", ... }
              const cityObj = hqLocation.city as { name?: string };
              hqCity = cityObj.name || null;
            }
          }

          // Dealroom returns funding as direct number in millions EUR
          const totalFundingEur = typeof company.total_funding === 'number' 
            ? company.total_funding * 1_000_000 
            : 0;
          const valuationEur = typeof company.valuation === 'number' 
            ? company.valuation * 1_000_000 
            : 0;
          const lastFundingAmount = company.last_funding_amount 
            ? company.last_funding_amount * 1_000_000 
            : (company.last_funding?.amount || 0);
          
          // Parse employees from string range like "2-10" or "51-200"
          const employeesCount = parseEmployees(company.employees) || company.employee_count || 0;
          const patentsCount = company.patents_count || 0;
          
          // Parse industries/investors which can be string[] or {name: string}[]
          const industries = Array.isArray(company.industries)
            ? company.industries.map(i => typeof i === 'string' ? i : i.name)
            : [];
          const investors = Array.isArray(company.investors)
            ? company.investors.map(i => typeof i === 'string' ? i : i.name)
            : [];

          // Parse new high-priority fields
          const techStack = Array.isArray(company.technologies)
            ? company.technologies.map(t => typeof t === 'string' ? t : t.name)
            : [];
          const leadInvestors = Array.isArray(company.lead_investors)
            ? company.lead_investors.map(i => typeof i === 'string' ? i : i.name)
            : [];
          const fundingRounds = Array.isArray(company.funding_rounds)
            ? company.funding_rounds.map(r => ({
                date: r.date || null,
                amount: r.amount ? r.amount * 1_000_000 : null,
                round_type: r.round_type || null,
                investors: Array.isArray(r.investors)
                  ? r.investors.map(i => typeof i === 'string' ? i : i.name)
                  : [],
              }))
            : [];

          // Upsert company with all new fields
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
                investors: investors,
                industries: industries,
                patents_count: patentsCount,
                news_items: company.news || null,
                // New high-priority fields
                status: companyStatus,
                employee_growth: company.employee_growth ?? null,
                jobs_count: company.jobs_count ?? 0,
                tech_stack: techStack,
                lead_investors: leadInvestors,
                funding_rounds: fundingRounds,
                // Acquisition tracking
                acquired_by: acquiredBy,
                acquired_date: acquiredDate,
                acquisition_amount_eur: acquisitionAmountEur,
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

            // Create keyword-company mappings for ALL keywords that have this tag
            for (const matchingKeyword of matchingKeywords) {
              if (upsertedCompany.id) {
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
        }

        // Small delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (searchError) {
        console.error(`Error searching for tag "${searchTag}":`, searchError);
        errors.push(`${searchTag}: ${searchError instanceof Error ? searchError.message : "Unknown error"}`);
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

          // Get aggregate stats for these companies (include all fields for scoring)
          const { data: companies } = await supabase
            .from("dealroom_companies")
            .select("name, total_funding_eur, employees_count, patents_count, employee_growth, jobs_count")
            .in("id", companyIds)
            .order("total_funding_eur", { ascending: false });

          if (companies && companies.length > 0) {
            const totalFunding = companies.reduce((sum, c) => sum + (Number(c.total_funding_eur) || 0), 0);
            const totalEmployees = companies.reduce((sum, c) => sum + (c.employees_count || 0), 0);
            const totalPatents = companies.reduce((sum, c) => sum + (c.patents_count || 0), 0);

            // Calculate 0-2 scores
            const investmentScore = calculateInvestmentScore(totalFunding / companies.length);
            const employeesScore = calculateEmployeesScore(totalEmployees / companies.length);
            const patentsScore = calculatePatentsScore(totalPatents);

            // Calculate trend based on employee growth and hiring activity
            const trend = calculateTrend(companies);

            // Extract top 5 companies by funding as key players
            const keyPlayers = companies
              .slice(0, 5)
              .map(c => c.name)
              .filter((name): name is string => !!name);

            // Upsert technology record with key_players and trend
            await supabase
              .from("technologies")
              .upsert(
                {
                  keyword_id: kw.id,
                  name: kw.display_name,
                  description: `Technology area with ${companies.length} active companies`,
                  investment_score: investmentScore,
                  employees_score: employeesScore,
                  patents_score: patentsScore,
                  total_funding_eur: totalFunding,
                  total_employees: totalEmployees,
                  total_patents: totalPatents,
                  dealroom_company_count: companies.length,
                  key_players: keyPlayers,
                  trend: trend,
                  last_updated: new Date().toISOString(),
                },
                { onConflict: "keyword_id" }
              );
          }
        }
      }
    }

    // Update API usage tracking
    if (currentUsage && apiCallsMade > 0) {
      await supabase
        .from("dealroom_api_usage")
        .update({
          api_calls_used: currentUsage.api_calls_used + apiCallsMade,
          last_sync_date: new Date().toISOString(),
        })
        .eq("id", currentUsage.id);
    }

    // Update sync log with API calls made
    if (logId) {
      await supabase
        .from("dealroom_sync_logs")
        .update({
          records_fetched: recordsFetched,
          records_created: recordsCreated,
          records_updated: recordsUpdated,
          api_calls_made: apiCallsMade,
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
        apiCallsMade,
        errors: errors.length > 0 ? errors : undefined,
        syncLogId: logId,
        usage: currentUsage ? {
          used: currentUsage.api_calls_used + apiCallsMade,
          limit: currentUsage.api_calls_limit,
          remaining: currentUsage.api_calls_limit - currentUsage.api_calls_used - apiCallsMade,
        } : undefined,
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
