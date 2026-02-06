import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PatentResult {
  publicationNumber: string;
  title: string;
  applicant: string;
  filingDate: string;
  publicationDate: string;
  ipcCodes: string[];
  abstract?: string;
}

interface CompanyPatentSummary {
  companyName: string;
  patentCount: number;
  patents: PatentResult[];
  ipcDistribution: Record<string, number>;
  recentFilings: number; // last 3 years
}

// Get OAuth token from EPO
async function getEpoToken(): Promise<string> {
  const consumerKey = Deno.env.get("EPO_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("EPO_CONSUMER_SECRET");

  if (!consumerKey || !consumerSecret) {
    throw new Error("EPO credentials not configured");
  }

  const credentials = btoa(`${consumerKey}:${consumerSecret}`);

  const response = await fetch(
    "https://ops.epo.org/3.2/auth/accesstoken",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("EPO auth failed:", response.status, errorText);
    throw new Error(`EPO authentication failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Search patents by applicant name - returns { patents, totalCount }
async function searchByApplicant(
  token: string,
  applicantName: string,
  maxResults: number = 25
): Promise<{ patents: PatentResult[]; totalCount: number }> {
  // Clean company name for EPO search
  const cleanName = applicantName
    .replace(/\s+(Inc|Corp|Ltd|LLC|GmbH|AG|SA|BV|NV|SE|PLC|S\.A\.|Co\.|Company)\.?$/i, "")
    .replace(/[^\w\s]/g, "")
    .trim();

  const query = `pa="${cleanName}"`;
  const url = `https://ops.epo.org/3.2/rest-services/published-data/search?q=${encodeURIComponent(query)}&Range=1-${maxResults}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return { patents: [], totalCount: 0 }; // No results found
    }
    const errorText = await response.text();
    console.error("EPO search failed:", response.status, errorText);
    throw new Error(`EPO search failed: ${response.status}`);
  }

  const data = await response.json();
  const results: PatentResult[] = [];

  try {
    const biblioSearch = data["ops:world-patent-data"]?.["ops:biblio-search"];
    
    // Extract total count from the response
    const totalCount = parseInt(biblioSearch?.["@total-result-count"] || "0", 10);
    
    const searchResults = biblioSearch?.["ops:search-result"]?.["ops:publication-reference"] || [];

    const refs = Array.isArray(searchResults) ? searchResults : [searchResults];

    for (const ref of refs.slice(0, maxResults)) {
      const docId = ref["document-id"];
      if (!docId) continue;

      const countryCode = docId["country"]?.["$"] || "";
      const docNumber = docId["doc-number"]?.["$"] || "";
      const kind = docId["kind"]?.["$"] || "";

      if (docNumber) {
        results.push({
          publicationNumber: `${countryCode}${docNumber}${kind}`,
          title: "", // Will be fetched separately if needed
          applicant: applicantName,
          filingDate: "",
          publicationDate: "",
          ipcCodes: [],
        });
      }
    }
    
    return { patents: results, totalCount };
  } catch (e) {
    console.error("Error parsing EPO results:", e);
    return { patents: [], totalCount: 0 };
  }
}

// Get patent bibliographic data
async function getPatentDetails(
  token: string,
  publicationNumber: string
): Promise<PatentResult | null> {
  // Parse publication number (e.g., EP1234567A1)
  const match = publicationNumber.match(/^([A-Z]{2})(\d+)([A-Z]\d?)?$/);
  if (!match) return null;

  const [, country, number, kind] = match;
  const docRef = `${country}.${number}${kind ? `.${kind}` : ""}`;

  const url = `https://ops.epo.org/3.2/rest-services/published-data/publication/docdb/${docRef}/biblio`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    return null;
  }

  const data = await response.json();

  try {
    const exchangeDoc =
      data["ops:world-patent-data"]?.["exchange-documents"]?.["exchange-document"];
    if (!exchangeDoc) return null;

    const biblio = exchangeDoc["bibliographic-data"];
    if (!biblio) return null;

    // Extract title
    let title = "";
    const titleData = biblio["invention-title"];
    if (Array.isArray(titleData)) {
      const enTitle = titleData.find((t: any) => t["@lang"] === "en");
      title = enTitle?.["$"] || titleData[0]?.["$"] || "";
    } else if (titleData) {
      title = titleData["$"] || "";
    }

    // Extract applicant
    let applicant = "";
    const applicantData = biblio["parties"]?.["applicants"]?.["applicant"];
    if (Array.isArray(applicantData)) {
      applicant = applicantData[0]?.["applicant-name"]?.["name"]?.["$"] || "";
    } else if (applicantData) {
      applicant = applicantData["applicant-name"]?.["name"]?.["$"] || "";
    }

    // Extract dates
    const appRef = biblio["application-reference"]?.["document-id"];
    let filingDate = "";
    if (Array.isArray(appRef)) {
      filingDate = appRef[0]?.["date"]?.["$"] || "";
    } else if (appRef) {
      filingDate = appRef["date"]?.["$"] || "";
    }

    const pubRef = biblio["publication-reference"]?.["document-id"];
    let publicationDate = "";
    if (Array.isArray(pubRef)) {
      publicationDate = pubRef[0]?.["date"]?.["$"] || "";
    } else if (pubRef) {
      publicationDate = pubRef["date"]?.["$"] || "";
    }

    // Extract IPC codes
    const ipcCodes: string[] = [];
    const classifications = biblio["classifications-ipcr"]?.["classification-ipcr"];
    if (classifications) {
      const classArray = Array.isArray(classifications) ? classifications : [classifications];
      for (const c of classArray) {
        const code = c["text"]?.["$"];
        if (code) {
          ipcCodes.push(code.split(" ")[0]); // Take main classification
        }
      }
    }

    // Extract abstract
    let abstract = "";
    const abstractData = exchangeDoc["abstract"];
    if (Array.isArray(abstractData)) {
      const enAbstract = abstractData.find((a: any) => a["@lang"] === "en");
      abstract = enAbstract?.["p"]?.["$"] || abstractData[0]?.["p"]?.["$"] || "";
    } else if (abstractData) {
      abstract = abstractData["p"]?.["$"] || "";
    }

    return {
      publicationNumber,
      title,
      applicant,
      filingDate: filingDate ? `${filingDate.slice(0, 4)}-${filingDate.slice(4, 6)}-${filingDate.slice(6, 8)}` : "",
      publicationDate: publicationDate ? `${publicationDate.slice(0, 4)}-${publicationDate.slice(4, 6)}-${publicationDate.slice(6, 8)}` : "",
      ipcCodes,
      abstract,
    };
  } catch (e) {
    console.error("Error parsing patent details:", e);
    return null;
  }
}

// Search by IPC code (for technology-level lookups)
async function searchByIPC(
  token: string,
  ipcCode: string,
  maxResults: number = 50
): Promise<{ patents: PatentResult[]; totalCount: number }> {
  const query = `ic="${ipcCode}"`;
  const url = `https://ops.epo.org/3.2/rest-services/published-data/search?q=${encodeURIComponent(query)}&Range=1-${maxResults}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) return { patents: [], totalCount: 0 };
    const errorText = await response.text().catch(() => "");
    console.error("EPO IPC search failed:", response.status, errorText);
    throw new Error(`EPO IPC search failed: ${response.status}`);
  }

  const data = await response.json();

  // Extract total count
  const totalCount = parseInt(
    data?.["ops:world-patent-data"]?.["ops:biblio-search"]?.["@total-result-count"] || "0",
    10
  );

  const results: PatentResult[] = [];

  try {
    const searchResults =
      data["ops:world-patent-data"]?.["ops:biblio-search"]?.["ops:search-result"]?.[
        "ops:publication-reference"
      ] || [];

    const refs = Array.isArray(searchResults) ? searchResults : [searchResults];

    for (const ref of refs.slice(0, maxResults)) {
      const docId = ref["document-id"];
      if (!docId) continue;

      const countryCode = docId["country"]?.["$"] || "";
      const docNumber = docId["doc-number"]?.["$"] || "";
      const kind = docId["kind"]?.["$"] || "";

      if (docNumber) {
        results.push({
          publicationNumber: `${countryCode}${docNumber}${kind}`,
          title: "",
          applicant: "",
          filingDate: "",
          publicationDate: "",
          ipcCodes: [ipcCode],
        });
      }
    }
  } catch (e) {
    console.error("Error parsing IPC results:", e);
  }

  return { patents: results, totalCount };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const {
      action,
      companyName,
      companyNames,
      ipcCode,
      publicationNumber,
      maxResults,
      companies,
      keywordId,
      ipcCodes,
    } = body;

    const token = await getEpoToken();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    let result: any;

    switch (action) {
      case "search_company": {
        if (!companyName) {
          throw new Error("companyName required for search_company action");
        }
        const searchResult = await searchByApplicant(token, companyName);

        // Get details for first 10 patents
        const detailedPatents: PatentResult[] = [];
        for (const p of searchResult.patents.slice(0, 10)) {
          const details = await getPatentDetails(token, p.publicationNumber);
          if (details) {
            detailedPatents.push(details);
          }
          // Rate limiting - EPO allows 4 req/sec for free tier
          await new Promise((r) => setTimeout(r, 300));
        }

        // Calculate IPC distribution
        const ipcDistribution: Record<string, number> = {};
        for (const p of detailedPatents) {
          for (const ipc of p.ipcCodes) {
            const mainClass = ipc.slice(0, 4); // e.g., B60W
            ipcDistribution[mainClass] = (ipcDistribution[mainClass] || 0) + 1;
          }
        }

        // Calculate recent filings (last 3 years)
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        const recentFilings = detailedPatents.filter(
          (p) => p.filingDate && new Date(p.filingDate) > threeYearsAgo
        ).length;

        result = {
          companyName,
          patentCount: searchResult.totalCount, // Use actual total from EPO
          totalCount: searchResult.totalCount,
          patents: detailedPatents,
          ipcDistribution,
          recentFilings,
        } as CompanyPatentSummary;
        break;
      }

      case "batch_search": {
        if (!companyNames || !Array.isArray(companyNames)) {
          throw new Error("companyNames array required for batch_search action");
        }

        const summaries: CompanyPatentSummary[] = [];
        for (const name of companyNames.slice(0, 20)) {
          try {
            const searchResult = await searchByApplicant(token, name, 10);
            summaries.push({
              companyName: name,
              patentCount: searchResult.totalCount, // Use actual total from EPO
              patents: [],
              ipcDistribution: {},
              recentFilings: 0,
            });
            // Rate limiting
            await new Promise((r) => setTimeout(r, 500));
          } catch (e) {
            console.error(`Error searching patents for ${name}:`, e);
            summaries.push({
              companyName: name,
              patentCount: 0,
              patents: [],
              ipcDistribution: {},
              recentFilings: 0,
            });
          }
        }
        result = { summaries };
        break;
      }

      case "search_ipc": {
        if (!ipcCode) {
          throw new Error("ipcCode required for search_ipc action");
        }

        const mr = typeof maxResults === "number" ? maxResults : 50;
        const { patents, totalCount } = await searchByIPC(token, ipcCode, mr);

        result = { ipcCode, patentCount: totalCount, totalCount, patents };
        break;
      }

      case "search_ipc_detailed": {
        if (!ipcCode) {
          throw new Error("ipcCode required for search_ipc_detailed action");
        }

        const mr = typeof maxResults === "number" ? maxResults : 30;
        const { patents: basicPatents, totalCount } = await searchByIPC(token, ipcCode, mr);

        // Get details for patents to extract applicant names
        const detailedPatents: PatentResult[] = [];
        for (const p of basicPatents.slice(0, 20)) {
          const details = await getPatentDetails(token, p.publicationNumber);
          if (details) {
            detailedPatents.push(details);
          }
          // Rate limiting
          await new Promise((r) => setTimeout(r, 250));
        }

        result = { ipcCode, patentCount: totalCount, totalCount, patents: detailedPatents };
        break;
      }

      // === Persistence helpers (use service role) ===
      case "enrich_companies": {
        if (!admin) throw new Error("Backend configuration missing");
        if (!companies || !Array.isArray(companies)) {
          throw new Error("companies array required for enrich_companies action");
        }

        const results: Array<{ id: string; name: string; patentCount: number }> = [];
        let enriched = 0;

        for (const c of companies.slice(0, 50)) {
          if (!c?.id || !c?.name) continue;

          try {
            const searchResult = await searchByApplicant(token, c.name, 1);
            const patentCount = searchResult.totalCount || 0;

            const { error: updateError } = await admin
              .from("crunchbase_companies")
              .update({
                patents_count: patentCount,
                updated_at: new Date().toISOString(),
              })
              .eq("id", c.id);

            if (updateError) {
              console.error("Failed to update company patents_count:", c.name, updateError);
            } else {
              enriched++;
            }

            results.push({ id: c.id, name: c.name, patentCount });
          } catch (e) {
            console.error(`Error enriching company ${c.name}:`, e);
            results.push({ id: c.id, name: c.name, patentCount: 0 });
          }

          // Rate limiting
          await new Promise((r) => setTimeout(r, 500));
        }

        result = { enriched, total: companies.length, results };
        break;
      }

      case "enrich_technology": {
        if (!admin) throw new Error("Backend configuration missing");
        if (!keywordId) throw new Error("keywordId required for enrich_technology action");
        if (!ipcCodes || !Array.isArray(ipcCodes) || ipcCodes.length === 0) {
          throw new Error("ipcCodes array required for enrich_technology action");
        }

        let totalPatents = 0;
        const perIpc: Array<{ ipcCode: string; totalCount: number }> = [];

        for (const code of ipcCodes.slice(0, 3)) {
          try {
            const { totalCount } = await searchByIPC(token, code, 1);
            perIpc.push({ ipcCode: code, totalCount });
            totalPatents += totalCount || 0;
          } catch (e) {
            console.error(`IPC count failed for ${code}:`, e);
            perIpc.push({ ipcCode: code, totalCount: 0 });
          }

          await new Promise((r) => setTimeout(r, 400));
        }

        const patentsScore = totalPatents >= 100 ? 2 : totalPatents >= 20 ? 1 : 0;

        const { error: updateError } = await admin
          .from("technologies")
          .update({
            total_patents: totalPatents,
            patents_score: patentsScore,
            last_updated: new Date().toISOString(),
          })
          .eq("keyword_id", keywordId);

        if (updateError) {
          console.error("Failed to update technology patents:", keywordId, updateError);
        }

        result = { keywordId, totalPatents, patentsScore, perIpc };
        break;
      }

      case "get_details": {
        if (!publicationNumber) {
          throw new Error("publicationNumber required for get_details action");
        }
        const details = await getPatentDetails(token, publicationNumber);
        result = details;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("EPO lookup error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
