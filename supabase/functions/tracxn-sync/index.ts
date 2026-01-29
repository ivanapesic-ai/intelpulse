import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tracxn API v2.2 endpoints
// Playground for testing, production for real data
const TRACXN_PLAYGROUND_URL = "https://platform.tracxn.com/api/2.2/playground";
const TRACXN_PROD_URL = "https://platform.tracxn.com/api/2.2";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TRACXN_ACCESS_TOKEN");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "TRACXN_ACCESS_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tracxn API key length: ${apiKey.length}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "test";
    const usePlayground = body.playground !== false; // Default to playground for testing
    const baseUrl = usePlayground ? TRACXN_PLAYGROUND_URL : TRACXN_PROD_URL;

    // Try different auth header formats
    const authConfigs = [
      { name: "Bearer Token", headers: { "Authorization": `Bearer ${apiKey}` } },
      { name: "Simple Token", headers: { "Authorization": apiKey } },
    ];

    // Test connection action - use POST /companies/search with minimal payload
    if (action === "test") {
      console.log(`Testing Tracxn API connection (${usePlayground ? 'playground' : 'production'})...`);

      // Test payload - minimal search
      const testPayload = { limit: 1 };

      for (const authConfig of authConfigs) {
        console.log(`Trying ${authConfig.name} with POST /companies/search...`);
        
        const response = await fetch(`${baseUrl}/companies/search`, {
          method: "POST",
          headers: {
            ...authConfig.headers,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(testPayload),
        });

        const responseText = await response.text();
        console.log(`${authConfig.name} response status: ${response.status}`);
        console.log(`Response preview: ${responseText.substring(0, 500)}`);

        if (response.ok) {
          let data;
          try {
            data = JSON.parse(responseText);
          } catch {
            data = responseText;
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              message: `Tracxn API connected successfully using ${authConfig.name}`,
              environment: usePlayground ? "playground" : "production",
              data: typeof data === "object" ? data : { raw: responseText.substring(0, 500) },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Log error details
        console.error(`${authConfig.name} failed: ${responseText.substring(0, 300)}`);
      }

      // If all auth configs failed
      return new Response(
        JSON.stringify({
          error: "All authentication methods failed",
          triedFormats: authConfigs.map(c => c.name),
          endpoint: `${baseUrl}/companies/search`,
          hint: "Please verify your Tracxn API key is valid and has proper permissions",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company by domain
    if (action === "company") {
      const domain = body.domain;
      if (!domain) {
        return new Response(
          JSON.stringify({ error: "domain parameter required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Looking up company: ${domain}`);

      const response = await fetch(`${baseUrl}/companies/${encodeURIComponent(domain)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Tracxn company lookup error: ${response.status} ${errorText}`);
        return new Response(
          JSON.stringify({ error: "Company lookup failed", status: response.status, details: errorText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, company: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search companies (POST /companies/search)
    if (action === "search") {
      const sector = body.sector;
      const limit = body.limit || 10;

      console.log(`Searching Tracxn for sector: ${sector || "any"}`);

      const searchPayload: Record<string, unknown> = {
        limit,
      };

      if (sector) {
        searchPayload.filter = { sector: { name: sector } };
      }

      const response = await fetch(`${baseUrl}/companies/search`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(searchPayload),
      });

      const responseText = await response.text();
      console.log(`Search response status: ${response.status}`);

      if (!response.ok) {
        console.error(`Tracxn search error: ${responseText}`);
        return new Response(
          JSON.stringify({ error: "Search failed", status: response.status, details: responseText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = JSON.parse(responseText);
      return new Response(
        JSON.stringify({
          success: true,
          count: data.result?.length || 0,
          companies: data.result || data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List available sectors
    if (action === "sectors") {
      console.log("Fetching Tracxn sectors...");

      const response = await fetch(`${baseUrl}/sectors`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Tracxn sectors error: ${response.status} ${errorText}`);
        return new Response(
          JSON.stringify({ error: "Sectors fetch failed", details: errorText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, sectors: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: "Unknown action", 
        availableActions: ["test", "company", "search", "sectors"],
        example: { action: "test" }
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Tracxn sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
