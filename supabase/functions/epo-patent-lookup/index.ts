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
// Uses a 2-year date window for recent-only mode to stay under EPO's 10k result cap
async function searchByIPC(
  token: string,
  ipcCode: string,
  maxResults: number = 50,
  recentOnly: boolean = false
): Promise<{ patents: PatentResult[]; totalCount: number }> {
  let query = `ic="${ipcCode}"`;
  if (recentOnly) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const dateStr = twoYearsAgo.toISOString().slice(0, 10).replace(/-/g, "");
    query += ` AND pd>=${dateStr}`;
  }
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
            const { totalCount } = await searchByIPC(token, code, 1, true);
            perIpc.push({ ipcCode: code, totalCount });
            totalPatents += totalCount || 0;
          } catch (e) {
            console.error(`IPC count failed for ${code}:`, e);
            perIpc.push({ ipcCode: code, totalCount: 0 });
          }

          await new Promise((r) => setTimeout(r, 400));
        }

        const patentsScore = totalPatents >= 500 ? 2 : totalPatents >= 50 ? 1 : 0;

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

      case "enrich_all_technologies": {
        if (!admin) throw new Error("Backend configuration missing");

        // Server-side IPC mapping (mirrors frontend KEYWORD_TO_IPC_MAP)
        // IPC codes at SUBCLASS level for automotive-specific precision
        // Using specific subclass codes (e.g., G01S13/93 for vehicle radar)
        // instead of broad class codes (G01S13 = ALL radar worldwide)
        const IPC_MAP: Record<string, string[]> = {
          "lidar": ["G01S17/93", "G01S17/89"],       // vehicle lidar specifically
          "radar": ["G01S13/93"],                      // vehicle radar
          "av radar": ["G01S13/93", "G01S7/41"],
          "av camera": ["G06V20/56", "G06V20/58"],     // vehicle-mounted cameras
          "camera": ["G06V20/56", "H04N7/18"],
          "sensor fusion": ["G01S13/86", "G05D1/02"],  // multi-sensor fusion for vehicles
          "autonomous driving": ["B60W60/00", "G05D1/02"],
          "adas": ["B60W30/00", "B60W50/00"],
          "path planning": ["G05D1/02", "G01C21/34"],
          "slam": ["G01C21/20", "G06T7/246"],
          "electric vehicle": ["B60L50/60", "B60K1/00"],
          "ev battery": ["H01M10/0525", "H01M50/20"],
          "battery management": ["H01M10/42", "H02J7/00"],
          "battery recycling": ["H01M10/54", "C22B7/00"],
          "solid state battery": ["H01M10/052", "H01M10/056"],
          "ev charging": ["H02J7/00", "B60L53/10"],
          "wireless charging": ["H02J50/10", "B60L53/12"],
          "fast charging": ["B60L53/20", "H02J7/02"],
          "v2x": ["H04W4/46", "H04W4/44"],            // vehicle-specific V2X
          "connected vehicle": ["H04W4/46", "B60W50/14"],
          "vehicle to grid": ["H02J3/38", "B60L55/00"],
          "5g automotive": ["H04W4/46", "H04B7/185"],
          "over the air updates": ["G06F8/65", "B60W50/04"],
          "automotive ethernet": ["H04L12/46", "B60R16/023"],
          "can bus": ["H04L12/40", "B60R16/02"],
          "autosar": ["G06F9/44", "B60W50/04"],
          "vehicle os": ["G06F9/4401", "B60W50/04"],
          "automotive middleware": ["G06F9/46", "B60W50/04"],
          "digital twin": ["G06F30/20", "G06T19/00"],
          "simulation": ["G06F30/20", "G06F30/27"],
          "hd mapping": ["G01C21/32", "G09B29/00"],
          "ai chip": ["G06N3/063", "G06F17/16"],
          "edge computing": ["G06F9/50", "H04L67/10"],
          "automotive cybersecurity": ["H04L63/14", "B60R25/10"],
          "functional safety": ["G05B9/02", "B60W50/02"],
          "fleet management": ["G06Q10/06", "G08G1/123"],
          "ride hailing": ["G06Q50/30", "G06Q30/02"],
          "micro mobility": ["B62K3/00", "B62M6/00"],
          "hydrogen fuel cell": ["H01M8/04", "B60L50/70"],
          "power electronics": ["H02M7/00", "H02P27/00"],
          "motor control": ["H02P27/04", "H02K7/00"],
          "thermal management": ["F01P7/16", "H01M10/613"],
          "lightweight materials": ["B62D29/00", "C22C21/00"],
          "vehicle to everything": ["H04W4/46", "H04W4/44"],
          "smart city": ["G08G1/01", "G06Q50/26"],
          "smart grid": ["H02J13/00", "H02J3/14"],
          "logistics tech": ["G06Q10/08", "G06Q50/28"],
          "supply chain management": ["G06Q10/087", "G06Q30/018"],
          "predictive maintenance": ["G05B23/02", "G06Q10/04"],
          "in vehicle infotainment": ["B60K35/00", "G06F3/01"],
          "hmi automotive": ["B60K35/00", "G06F3/01"],
          "ar hud": ["G02B27/01", "B60K35/00"],
          "telematics": ["G07C5/08", "G08G1/127"],
          "vehicle tracking": ["G01S19/13", "G08G1/123"],
          "parking tech": ["G08G1/14", "E04H6/42"],
          "traffic management": ["G08G1/01", "G06Q50/30"],
          "autonomous trucking": ["B60W60/00", "B62D63/04"],
          "last mile delivery": ["G06Q10/08", "B60L50/60"],
          "robotaxi": ["B60W60/00", "G06Q50/30"],
          "platooning": ["G08G1/16", "B60W30/165"],
          "v2i": ["H04W4/44", "G08G1/09"],
          "energy management systems": ["H02J3/14", "H02J7/35"],
          "ems": ["H02J3/14", "H02J7/35"],
          "micro grid": ["H02J3/38", "H02J13/00"],
          "renewable energy sources": ["H02S40/00", "F03D9/25"],
          "residential energy management": ["H02J3/14", "F24F11/46"],
          "self adaptive energy": ["H02J3/14", "G05B13/02"],
          "solar energy system": ["H02S20/00", "H01L31/042"],
          "ses solar energy system": ["H02S20/00", "H01L31/042"],
          "stationary energy storage": ["H01M10/44", "H02J3/28"],
          "ses stationary energy storage": ["H01M10/44", "H02J3/28"],
          "shared energy storage": ["H01M10/44", "H02J3/28"],
          "storage battery systems": ["H01M10/44", "H02J7/34"],
          "sbs": ["H01M10/44", "H02J7/34"],
          "mobile energy storage units": ["H01M10/44", "B60L50/64"],
          "mesu": ["H01M10/44", "B60L50/64"],
          "uninterrupted power supply": ["H02J9/06", "H02J7/34"],
          "ups": ["H02J9/06", "H02J7/34"],
          "bidirectional charging": ["H02J3/38", "B60L55/00"],
          "ev motor": ["H02K7/006", "B60L50/51"],
          "ev services": ["B60L53/30", "G06Q50/06"],
          "vehicle safety": ["B60R21/01", "B60W50/02"],
          "micromobility": ["B62K3/00", "B62M6/00"],
          "av labeling": ["G06V10/776", "G06N3/084"],
          "logistics robots": ["B25J9/16", "G05D1/02"],
          "sustainability measurement": ["G06Q50/06", "G01N33/00"],
          "smart cities": ["G08G1/01", "G06Q50/26"],
        };

        const normalize = (s: string) => s.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

        // Fetch all active keywords
        const { data: keywords, error: kwErr } = await admin
          .from("technology_keywords")
          .select("id, keyword, display_name")
          .eq("is_active", true);

        if (kwErr) throw kwErr;

        let enriched = 0;
        let totalPatentsFound = 0;
        const enrichResults: Array<{ keyword: string; patents: number; score: number }> = [];

        for (const kw of keywords || []) {
          const normalizedKw = normalize(kw.keyword);
          const normalizedDn = normalize(kw.display_name);

          // Find matching IPC codes — EXACT match only (no substring matching)
          let matchedIpc: string[] = [];
          for (const [mapKey, codes] of Object.entries(IPC_MAP)) {
            const normalizedMapKey = normalize(mapKey);
            if (normalizedKw === normalizedMapKey || normalizedDn === normalizedMapKey) {
              matchedIpc = [...new Set([...matchedIpc, ...codes])];
            }
          }

          if (matchedIpc.length === 0) continue;

          // Count recent patents only (last 5 years) for meaningful signal
          let totalPatents = 0;
          for (const code of matchedIpc.slice(0, 3)) {
            try {
              const { totalCount } = await searchByIPC(token, code, 1, true);
              totalPatents += totalCount || 0;
            } catch (e) {
              console.error(`IPC count failed for ${code}:`, e);
            }
            await new Promise((r) => setTimeout(r, 400));
          }

          // Adjusted thresholds for subclass-level IPC + recent-only counts
          const patentsScore = totalPatents >= 500 ? 2 : totalPatents >= 50 ? 1 : 0;

          await admin
            .from("technologies")
            .update({
              total_patents: totalPatents,
              patents_score: patentsScore,
              last_updated: new Date().toISOString(),
            })
            .eq("keyword_id", kw.id);

          enriched++;
          totalPatentsFound += totalPatents;
          enrichResults.push({ keyword: kw.display_name, patents: totalPatents, score: patentsScore });
        }

        result = { enriched, totalPatentsFound, results: enrichResults };
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
