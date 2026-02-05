import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// H11 Algorithm: Position weight scoring based on document structure
const POSITION_WEIGHTS = {
  title: 3.0,
  executive_summary: 2.5,
  abstract: 2.5,
  introduction: 2.0,
  conclusion: 2.0,
  heading: 1.8,
  body: 1.0,
  footnote: 0.5,
  reference: 0.3,
};

// CEI Sector classification keywords
const SECTOR_PATTERNS = {
  mobility: [
    "mobility", "transport", "vehicle", "automotive", "logistics", "fleet",
    "MaaS", "traffic", "autonomous", "SDV", "software-defined vehicle",
    "EV", "electric vehicle", "charging", "rail", "maritime", "aviation"
  ],
  energy: [
    "energy", "grid", "power", "renewable", "solar", "wind", "battery",
    "smart grid", "electricity", "decarbonization", "green deal",
    "sustainability", "carbon", "emissions", "hydrogen"
  ],
  manufacturing: [
    "manufacturing", "factory", "industrial", "production", "automation",
    "Industry 4.0", "OT", "operational technology", "supply chain",
    "predictive maintenance", "digital twin", "MES", "robotics"
  ],
};

// Expanded EU Policy references for CEI domain
const EU_POLICIES = [
  "Horizon Europe", "Horizon 2020", "EU AI Act", "Data Act", "GDPR",
  "Digital Services Act", "Digital Markets Act", "IPCEI", "EU Chips Act",
  "Cyber Resilience Act", "European Data Strategy", "Digital Decade",
  "CEI-Sphere", "EUCloudEdgeIoT", "O-CEI", "COP-PILOT",
  "Competitiveness Compass", "Draghi report", "AI Factories Initiative",
  "Data Union Strategy", "Digital Networks Act", "Green Deal",
  "Sustainable and Smart Mobility Strategy", "EuroHPC", "ENISA",
  "NIS2", "eIDAS", "Gaia-X", "SIMPL", "European Cloud Federation"
];

// CEI Domain Knowledge - Empowering the AI with context
const CEI_DOMAIN_KNOWLEDGE = `
## CEI-Sphere Project Context
CEI-Sphere is a CEI CSA (Coordination and Support Action) focused on Cloud-Edge-IoT technologies for the European market.
The project aims to provide market intelligence on technology readiness and investment opportunities.

## Key Technology Domains
1. CLOUD: Hyperscale cloud, sovereign cloud, multi-cloud, cloud-native, serverless, containers, Kubernetes
2. EDGE: Edge computing, MEC (Multi-access Edge Computing), fog computing, near-edge, far-edge
3. IoT: Industrial IoT, consumer IoT, smart sensors, connected devices, LPWAN, 5G IoT

## Vertical Sectors
- MOBILITY: Autonomous vehicles, MaaS, logistics, fleet management, traffic systems, V2X
- ENERGY: Smart grid, renewable integration, energy management, EV charging, demand response
- MANUFACTURING: Industry 4.0, predictive maintenance, digital twins, OT/IT convergence, robotics

## Market Maturity Indicators
- EMERGING (TRL 1-4): R&D phase, academic papers, early prototypes, no commercial products
- EARLY ADOPTION (TRL 5-7): Pilots underway, initial commercial deployments, growing startup ecosystem
- MAINSTREAM (TRL 8-9): Wide market adoption, established vendors, mature supply chain

## Challenge Assessment Criteria (TENDER SPECIFIC)
- 2 = NO MAJOR CHALLENGE: Technology is proven, regulations exist, supply chains established
- 1 = MANAGEABLE CHALLENGE: Some barriers but clear path forward (e.g., skills gap, interoperability)
- 0 = SEVERE CHALLENGE: Major blockers like missing regulations, high CAPEX, fragmented standards

## Opportunity Assessment Criteria (TENDER SPECIFIC)  
- 2 = HIGH OPPORTUNITY: Large TAM, EU policy alignment, strong investor interest, clear use cases
- 1 = PROMISING OPPORTUNITY: Growing market, some strategic fit, moderate investment activity
- 0 = LIMITED OPPORTUNITY: Niche market, weak EU relevance, limited commercial interest
`;

// Few-shot examples for better extraction quality
const FEW_SHOT_EXAMPLES = `
## Example Technology Assessments

### Example 1: Edge Computing for Manufacturing
- Challenge Score: 1 (Manageable)
- Challenge Reasoning: "OT/IT integration requires brownfield retrofitting, but standards like OPC-UA provide clear path"
- Opportunity Score: 2 (High)
- Opportunity Reasoning: "€45B European market by 2027, 67% of manufacturers planning edge deployments, strong Horizon Europe funding"
- Maturity: early_adoption
- Market Signals: { adoption_rate: "67% planning", market_size: "EUR 45B by 2027", growth_rate: "23% CAGR" }

### Example 2: Federated Learning for Healthcare
- Challenge Score: 0 (Severe)
- Challenge Reasoning: "GDPR compliance for cross-border health data unresolved, lack of interoperability standards"
- Opportunity Score: 1 (Promising)
- Opportunity Reasoning: "Growing interest from hospitals but regulatory uncertainty limits investment"
- Maturity: emerging
- Market Signals: { adoption_rate: "12% piloting", market_size: "EUR 2.1B", growth_rate: "35% CAGR" }

### Example 3: Real-time Logistics Visibility
- Challenge Score: 2 (No Major Challenge)
- Challenge Reasoning: "Mature API standards, established vendors, proven ROI cases"
- Opportunity Score: 2 (High)  
- Opportunity Reasoning: "€12B market, 53% already deployed, regulatory push for supply chain transparency"
- Maturity: mainstream
- Market Signals: { adoption_rate: "53% deployed, 16% extending", market_size: "EUR 12B", competitors: ["Project44", "FourKites", "Transporeon"] }
`;

// H11: Detect document section for position weighting
function detectSection(context: string, pageNumber: number | null): string {
  const lowerContext = context.toLowerCase();
  
  if (pageNumber === 1 || lowerContext.includes("executive summary")) {
    return "executive_summary";
  }
  if (lowerContext.includes("abstract") || lowerContext.includes("overview")) {
    return "abstract";
  }
  if (lowerContext.includes("introduction") || lowerContext.includes("background")) {
    return "introduction";
  }
  if (lowerContext.includes("conclusion") || lowerContext.includes("summary") || 
      lowerContext.includes("key takeaway")) {
    return "conclusion";
  }
  if (context.match(/^#+\s/) || context.match(/^[A-Z][A-Z\s]+:/)) {
    return "heading";
  }
  if (lowerContext.includes("reference") || lowerContext.includes("bibliography")) {
    return "reference";
  }
  
  return "body";
}

// H11: Calculate position weight score
function getPositionWeight(section: string): number {
  return POSITION_WEIGHTS[section as keyof typeof POSITION_WEIGHTS] || 1.0;
}

// Detect sectors from content
function detectSectors(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const sectors: string[] = [];
  
  for (const [sector, patterns] of Object.entries(SECTOR_PATTERNS)) {
    const matchCount = patterns.filter(p => lowerContent.includes(p.toLowerCase())).length;
    if (matchCount >= 2) {
      sectors.push(sector);
    }
  }
  
  return sectors.length > 0 ? sectors : ["general"];
}

// Extract market signals (funding, adoption rates, etc.)
function extractMarketSignals(content: string): {
  fundingMentions: string[];
  adoptionRates: string[];
  marketSize: string[];
} {
  const fundingPattern = /(?:EUR|€|\$|USD)\s*[\d,.]+\s*(?:billion|million|B|M)/gi;
  const adoptionPattern = /(\d+(?:\.\d+)?%)\s*(?:of|adoption|usage|have adopted|intend)/gi;
  const marketSizePattern = /market\s+(?:size|value|worth|estimated at)\s*(?:of\s*)?(?:EUR|€|\$|USD)?\s*[\d,.]+\s*(?:billion|million)?/gi;
  
  return {
    fundingMentions: content.match(fundingPattern) || [],
    adoptionRates: content.match(adoptionPattern) || [],
    marketSize: content.match(marketSizePattern) || [],
  };
}

// Robust JSON extraction from LLM responses
function extractJsonFromResponse(response: string): any {
  // Step 1: Remove markdown code blocks
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Step 2: Find JSON boundaries
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  // Step 3: Attempt parse with error handling
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Step 4: Try to fix common issues
    let repaired = cleaned
      .replace(/,\s*}/g, "}") // Remove trailing commas before }
      .replace(/,\s*]/g, "]") // Remove trailing commas before ]
      .replace(/[\x00-\x1F\x7F]/g, " "); // Replace control characters with space

    try {
      return JSON.parse(repaired);
    } catch (e2) {
      // Step 5: Try to repair truncated JSON by balancing braces
      let braces = 0, brackets = 0;
      for (const char of repaired) {
        if (char === '{') braces++;
        if (char === '}') braces--;
        if (char === '[') brackets++;
        if (char === ']') brackets--;
      }
      
      // Add missing closing brackets/braces
      while (brackets > 0) { repaired += ']'; brackets--; }
      while (braces > 0) { repaired += '}'; braces--; }
      
      return JSON.parse(repaired);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse request body FIRST to capture documentId for error handling
  let documentId: string | undefined;
  let content: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: any = null;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body early so we have documentId for error handling
    const body = await req.json();
    documentId = body.documentId;
    content = body.content;

    if (!documentId) {
      throw new Error("documentId is required");
    }

    // Fetch document record to get storage path
    const { data: document, error: docError } = await supabase
      .from("cei_documents")
      .select("storage_path, file_type, filename")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || "Unknown error"}`);
    }

    // Update document status to parsing
    await supabase
      .from("cei_documents")
      .update({ parse_status: "parsing" })
      .eq("id", documentId);

    // If content wasn't provided, extract it from storage using AI
    let documentContent = content;
    
    if (!documentContent || documentContent.trim().length < 100) {
      console.log(`Extracting content from storage: ${document.storage_path}`);
      
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("cei-documents")
        .download(document.storage_path);
      
      if (downloadError || !fileData) {
        throw new Error(`Failed to download document: ${downloadError?.message || "No data"}`);
      }
      
      // Convert to base64 for Gemini
      const arrayBuffer = await fileData.arrayBuffer();
      const base64Content = encodeBase64(arrayBuffer);
      
      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      };
      const mimeType = mimeTypes[document.file_type] || "application/pdf";
      const fileSizeKB = arrayBuffer.byteLength / 1024;
      
      console.log(`Extracting text from ${document.file_type} (${fileSizeKB.toFixed(1)} KB)...`);
      
      // Check file size limits (Edge function memory is ~150MB, leave room for processing)
      const MAX_FILE_SIZE_KB = 5000; // 5MB limit for direct processing
      if (fileSizeKB > MAX_FILE_SIZE_KB) {
        console.warn(`File too large (${fileSizeKB.toFixed(0)} KB), may hit memory limits`);
        // For very large files, we'll process what we can
      }
      
      // Use Gemini to extract text from the document - optimized for memory
      const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extract ALL readable text content from this ${document.file_type.toUpperCase()} document titled "${document.filename}".

Focus on capturing:
1. All headings and section titles
2. Body text paragraphs (summarize very long sections)
3. Table contents (format as compact text)
4. Figure captions and labels
5. Key statistics, percentages, and numbers
6. Technology names, TRL levels, or policy references

Return the extracted text CONCISELY - prioritize key information. Max 25000 characters.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Content}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 12000,
        }),
      });
      
      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error("Text extraction error:", extractResponse.status, errorText);
        throw new Error(`Failed to extract document text: ${extractResponse.status}`);
      }
      
      const extractData = await extractResponse.json();
      documentContent = extractData.choices?.[0]?.message?.content || "";
      
      console.log(`Extracted ${(documentContent as string).length} characters from document`);
      
      if (!documentContent || (documentContent as string).length < 100) {
        throw new Error("Failed to extract meaningful content from document");
      }
    }

    // Pre-analyze document for H11 enrichment (now using actual content)
    const detectedSectors = detectSectors(documentContent);
    const marketSignals = extractMarketSignals(documentContent);
    
    console.log("H11 Pre-analysis:", { 
      sectors: detectedSectors, 
      fundingMentions: marketSignals.fundingMentions.length,
      adoptionRates: marketSignals.adoptionRates.length 
    });

    // Get all active keywords for matching
    const { data: keywords, error: keywordsError } = await supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, aliases")
      .eq("is_active", true);

    if (keywordsError) {
      throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
    }

    const keywordList = keywords?.map((k: any) => ({
      id: k.id,
      terms: [k.keyword, k.display_name, ...(k.aliases || [])],
    })) || [];

    // Build H11-enhanced prompt for AI extraction
     const systemPrompt = `You are an expert at extracting technology intelligence from CEI-Sphere (Cloud-Edge-IoT) documents for the European Commission.

${CEI_DOMAIN_KNOWLEDGE}

## YOUR TASK: CHALLENGE-OPPORTUNITY MATRIX EXTRACTION

For each technology in the document, assess it according to the OFFICIAL TENDER CRITERIA:

### CHALLENGE SCORE (0-2) - Barriers to Market Entry
2 = No Major Challenge: No significant barriers. All foreseeable problems are solved or negligible, standard processes apply.
1 = Manageable Challenge: Some challenges exist but are understood with clear actionable steps to overcome. Moderate effort required, doesn't threaten success.
0 = Severe Challenge: Major obstacles that could seriously impede or block market success. Requires new regulations, substantial investment, or industry-wide shifts.

### OPPORTUNITY SCORE (0-2) - Value and Achievability
2 = High Opportunity: Significant value, readily achievable, closely aligned with EU strategic goals. Strong market position and readiness.
1 = Promising Opportunity: Reasonable value, achievable with moderate effort. Practical path forward with adequate strategic fit.
0 = Limited Opportunity: Low potential value, difficult to realize, weak strategic fit. Little benefit or readiness.

### MATURITY LEVEL - Market Adoption Stage
- "emerging": New technology, early R&D, limited pilots (TRL 1-4)
- "early_adoption": Pilots underway, some commercial deployments (TRL 5-7)
- "mainstream": Widely adopted, proven market presence (TRL 8-9)

### MARKET SIGNALS TO EXTRACT
- Market size and growth rate (enterprise value)
- Customer adoption rates (% deployed, % planning to adopt)
- Presence of competitors or substitutes
- Key players and investors
- Funding/investment amounts

### EU POLICY ALIGNMENT
Detect references to: ${EU_POLICIES.join(', ')}

${FEW_SHOT_EXAMPLES}

## TECHNOLOGY KEYWORDS TO MATCH
Match technologies from the provided keyword list. Also identify NEW technologies not in the list that are relevant to CEI domains.

## CRITICAL INSTRUCTIONS
1. Extract EVERY technology mentioned, even if briefly discussed
2. Look for technologies in tables, charts, diagrams, and figure captions
3. Pay special attention to market statistics, adoption percentages, and funding amounts
4. If a technology's challenge/opportunity is not explicitly stated, INFER it from context clues
5. Always provide reasoning for your scores

## RESPONSE FORMAT
Return JSON with technology assessments and overall document analysis:
{
  "mentions": [
    {
      "keyword_id": "uuid-from-list-or-null-for-new-tech",
      "keyword_name": "Technology name if new",
      "mention_context": "Quote from document showing technology relevance (max 300 chars)",
      "trl_mentioned": 7,
      "policy_reference": "Specific EU policy if mentioned",
      "confidence_score": 0.95,
      "challenge_score": 1,
      "challenge_reasoning": "Brief explanation of challenge assessment",
      "opportunity_score": 2,
      "opportunity_reasoning": "Brief explanation of opportunity assessment",
      "maturity_level": "early_adoption",
      "market_signals": {
        "adoption_rate": "53% deployed",
        "market_size": "EUR 46B by 2030",
        "competitors": ["Company A", "Company B"],
        "growth_rate": "15% CAGR"
      },
      "sector_tags": ["mobility", "energy"],
      "page_number": null
    }
  ],
  "document_analysis": {
    "title": "Document title if identifiable",
    "summary": "2-3 sentence summary of document focus",
    "primary_sectors": ["mobility"],
    "key_policies": ["Green Deal", "Digital Decade"],
    "overall_market_signals": {
      "total_market_value": "EUR X billion",
      "adoption_trends": ["trend 1", "trend 2"],
      "key_players": ["Company A", "Company B"],
      "investment_activity": "Description of funding trends"
    },
    "maturity_distribution": {
      "emerging_count": 3,
      "early_adoption_count": 5,
      "mainstream_count": 2
    }
  },
  "new_technologies": [
    {
      "name": "Technology not in keyword list",
      "description": "What it does",
      "suggested_sector": "mobility|energy|manufacturing",
      "challenge_score": 1,
      "opportunity_score": 2,
      "maturity_level": "emerging"
    }
  ]
}`;

    const userPrompt = `## DOCUMENT PRE-ANALYSIS (H11 Algorithm)

Detected sectors: ${detectedSectors.join(", ")}
Funding mentions found: ${marketSignals.fundingMentions.slice(0, 5).join(", ") || "none"}
Adoption rates found: ${marketSignals.adoptionRates.slice(0, 5).join(", ") || "none"}

## TECHNOLOGY KEYWORDS TO MATCH
${JSON.stringify(keywordList, null, 2)}

## DOCUMENT CONTENT
Analyze this document and extract technology mentions with H11 precision scoring:

${documentContent}`;

    // Truncate content if too long to avoid response truncation
    const MAX_CONTENT_LENGTH = 50000;
    let processedContent = documentContent;
    if (documentContent.length > MAX_CONTENT_LENGTH) {
      console.log(`Truncating content from ${documentContent.length} to ${MAX_CONTENT_LENGTH} chars`);
      processedContent = documentContent.slice(0, MAX_CONTENT_LENGTH) + "\n\n[CONTENT TRUNCATED FOR PROCESSING]";
    }
    
    // Rebuild user prompt with potentially truncated content
    const finalUserPrompt = `## DOCUMENT PRE-ANALYSIS (H11 Algorithm)

Detected sectors: ${detectedSectors.join(", ")}
Funding mentions found: ${marketSignals.fundingMentions.slice(0, 5).join(", ") || "none"}
Adoption rates found: ${marketSignals.adoptionRates.slice(0, 5).join(", ") || "none"}

## TECHNOLOGY KEYWORDS TO MATCH
${JSON.stringify(keywordList.slice(0, 100), null, 2)}

## DOCUMENT CONTENT
Analyze this document and extract technology mentions with H11 precision scoring:

${processedContent}`;

    // Call Lovable AI for extraction with increased token limit
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: finalUserPrompt },
        ],
        max_tokens: 8000,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded, please try again later");
      }
      if (aiResponse.status === 402) {
        throw new Error("Payment required, please add credits to Lovable AI");
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from AI");
    }

     // Parse AI response - C-O Matrix aligned type
     let extractedData: { 
       mentions: Array<{
         keyword_id: string | null;
         keyword_name?: string;
         mention_context: string;
         trl_mentioned: number | null;
         policy_reference: string | null;
         confidence_score: number;
         challenge_score?: number;
         challenge_reasoning?: string;
         opportunity_score?: number;
         opportunity_reasoning?: string;
         maturity_level?: string;
         market_signals?: {
           adoption_rate?: string;
           market_size?: string;
           competitors?: string[];
           growth_rate?: string;
         };
         sector_tags?: string[];
         page_number: number | null;
       }>; 
       document_analysis?: {
         title?: string;
         summary: string;
         primary_sectors?: string[];
         key_policies?: string[];
         overall_market_signals?: {
           total_market_value?: string;
           adoption_trends?: string[];
           key_players?: string[];
           investment_activity?: string;
         };
         maturity_distribution?: {
           emerging_count?: number;
           early_adoption_count?: number;
           mainstream_count?: number;
         };
       }; 
       summary?: string 
     };

    try {
      extractedData = extractJsonFromResponse(responseContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseContent.slice(0, 2000) + "...[truncated]");
      throw new Error("Failed to parse AI extraction results");
    }

     // Insert technology mentions with C-O assessments
     const mentions = extractedData.mentions || [];
     let mentionsCreated = 0;
     let mentionsSkipped = 0;
     
     // Track C-O scores per keyword for aggregation
     const keywordCOScores: Record<string, { 
       challenges: number[]; 
       opportunities: number[];
       maturity: string[];
       marketSignals: any[];
     }> = {};
 
     for (const mention of mentions) {
       // Try to find keyword - first by ID, then by name fuzzy match
       let validKeyword = keywords?.find((k: any) => k.id === mention.keyword_id);
       
       // If no ID match, try fuzzy matching by name
       if (!validKeyword && mention.keyword_name) {
         const mentionName = mention.keyword_name.toLowerCase().trim();
         validKeyword = keywords?.find((k: any) => {
           const kw = k.keyword.toLowerCase();
           const display = k.display_name.toLowerCase();
           const aliases = (k.aliases || []).map((a: string) => a.toLowerCase());
           
           // Exact match
           if (kw === mentionName || display === mentionName) return true;
           // Alias match
           if (aliases.some((a: string) => a === mentionName)) return true;
           // Partial match (one contains the other)
           if (kw.includes(mentionName) || mentionName.includes(kw)) return true;
           if (display.includes(mentionName) || mentionName.includes(display)) return true;
           
           return false;
         });
         
         if (validKeyword) {
           console.log(`Fuzzy matched "${mention.keyword_name}" -> ${validKeyword.display_name}`);
         }
       }
       
       if (!validKeyword) {
         console.warn(`No keyword match for: ${mention.keyword_name || mention.keyword_id}`);
         mentionsSkipped++;
         continue;
       }
       
       // Use the matched keyword's ID
       const keywordId = validKeyword.id;
 
       const baseConfidence = Math.min(1, Math.max(0, mention.confidence_score || 0.5));
       
       // Build context with C-O reasoning
       const enrichedContext = [
         mention.mention_context,
         mention.challenge_reasoning ? `[Challenge: ${mention.challenge_reasoning}]` : null,
         mention.opportunity_reasoning ? `[Opportunity: ${mention.opportunity_reasoning}]` : null,
       ].filter(Boolean).join(" ");
 
       const { error: mentionError } = await supabase
         .from("document_technology_mentions")
         .insert({
           document_id: documentId,
           keyword_id: keywordId,
           mention_context: enrichedContext?.slice(0, 500) || null,
           trl_mentioned: mention.trl_mentioned || null,
           policy_reference: mention.policy_reference || null,
           confidence_score: baseConfidence,
           position_weight: 1.0,
           relevance_score: baseConfidence,
           page_number: mention.page_number || null,
         });
 
       if (mentionError) {
         console.error("Error inserting mention:", mentionError);
       } else {
         mentionsCreated++;
         
         // Track C-O scores per keyword for aggregation
         if (!keywordCOScores[keywordId]) {
           keywordCOScores[keywordId] = { 
             challenges: [], 
             opportunities: [], 
             maturity: [],
             marketSignals: []
           };
         }
         if (mention.challenge_score !== undefined) {
           keywordCOScores[keywordId].challenges.push(mention.challenge_score);
         }
         if (mention.opportunity_score !== undefined) {
           keywordCOScores[keywordId].opportunities.push(mention.opportunity_score);
         }
         if (mention.maturity_level) {
           keywordCOScores[keywordId].maturity.push(mention.maturity_level);
         }
         if (mention.market_signals) {
           keywordCOScores[keywordId].marketSignals.push(mention.market_signals);
         }
       }
     }
     
     console.log(`Mentions: ${mentionsCreated} created, ${mentionsSkipped} skipped (no keyword match)`);

     // Build enriched parsed content with C-O Matrix analysis
     const docAnalysis = extractedData.document_analysis || { summary: extractedData.summary || "" };
     
     // Update document with parsed content and C-O insights
     await supabase
       .from("cei_documents")
       .update({
         parse_status: "completed",
         parsed_content: {
           title: docAnalysis.title || document.filename,
           summary: docAnalysis.summary || extractedData.summary,
           mentions_count: mentionsCreated,
           extracted_at: new Date().toISOString(),
           co_analysis: {
             sectors: docAnalysis.primary_sectors || detectedSectors,
             key_policies: docAnalysis.key_policies || [],
             market_signals: docAnalysis.overall_market_signals || marketSignals,
             maturity_distribution: docAnalysis.maturity_distribution || null,
             // Aggregate C-O scores from mentions
             keyword_assessments: Object.entries(keywordCOScores).map(([kwId, scores]) => ({
               keyword_id: kwId,
               avg_challenge: scores.challenges.length > 0 
                 ? Math.round(scores.challenges.reduce((a, b) => a + b, 0) / scores.challenges.length) 
                 : null,
               avg_opportunity: scores.opportunities.length > 0 
                 ? Math.round(scores.opportunities.reduce((a, b) => a + b, 0) / scores.opportunities.length) 
                 : null,
               maturity_mode: scores.maturity.length > 0 
                 ? scores.maturity.sort((a, b) => 
                     scores.maturity.filter(v => v === a).length - scores.maturity.filter(v => v === b).length
                   ).pop() 
                 : null,
               market_signals: scores.marketSignals,
             })),
           },
         },
       })
       .eq("id", documentId);

    // Update technology document_mention_count for affected keywords
    const affectedKeywordIds = [...new Set(mentions.map(m => m.keyword_id).filter(Boolean))];
    
    for (const keywordId of affectedKeywordIds) {
      const { count } = await supabase
        .from("document_technology_mentions")
        .select("*", { count: "exact", head: true })
        .eq("keyword_id", keywordId);

      await supabase
        .from("technologies")
        .update({ document_mention_count: count || 0 })
        .eq("keyword_id", keywordId);
      
      // Trigger C-O score aggregation for this keyword
      try {
        await supabase.rpc("aggregate_document_insights", { 
          tech_keyword_id: keywordId 
        });
      } catch (aggError) {
        console.warn(`Failed to aggregate insights for ${keywordId}:`, aggError);
      }
    }

     return new Response(
       JSON.stringify({
         success: true,
         mentionsCreated,
         summary: docAnalysis.summary || extractedData.summary,
         co_analysis: {
           sectors: docAnalysis.primary_sectors || detectedSectors,
           policies_detected: docAnalysis.key_policies?.length || 0,
           keywords_assessed: Object.keys(keywordCOScores).length,
           market_signals: docAnalysis.overall_market_signals || null,
         },
       }),
       {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
  } catch (error) {
    console.error("Document parsing error:", error);

    // Update document status to failed using the documentId captured at the start
    if (documentId && supabase) {
      try {
        await supabase
          .from("cei_documents")
          .update({ parse_status: "failed" })
          .eq("id", documentId);
        console.log(`Updated document ${documentId} status to failed`);
      } catch (updateError) {
        console.error("Failed to update document status:", updateError);
      }
    }

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
