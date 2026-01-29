import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tracxn API v2.2 - Use Playground for free testing
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

    console.log(`Tracxn API key configured (length: ${apiKey.length})`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "test";
    const usePlayground = body.playground !== false; // Default to playground
    const baseUrl = usePlayground ? TRACXN_PLAYGROUND_URL : TRACXN_PROD_URL;

    // Common headers for Tracxn API - uses accessToken header, not Authorization!
    const tracxnHeaders = {
      "accessToken": apiKey,
      "Content-Type": "application/json",
    };

    // Test connection - simple company search
    if (action === "test") {
      console.log("Testing Tracxn API connection...");

      const testPayload = {
        filter: {},
        limit: 1,
      };

      const response = await fetch(`${baseUrl}/companies`, {
        method: "POST",
        headers: tracxnHeaders,
        body: JSON.stringify(testPayload),
      });

      const responseText = await response.text();
      console.log(`Tracxn response status: ${response.status}`);
      console.log(`Response preview: ${responseText.substring(0, 500)}`);

      if (response.ok) {
        const data = JSON.parse(responseText);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Tracxn API connected successfully!",
            totalCount: data.totalCount,
            companiesReturned: data.result?.length || 0,
            sampleCompany: data.result?.[0]?.name || null,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Tracxn API call failed",
          status: response.status,
          details: responseText.substring(0, 500),
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search companies by sector/feed
    if (action === "search") {
      const feedName = body.feedName || body.sector;
      const country = body.country;
      const foundedYear = body.foundedYear;
      const limit = body.limit || 20;

      console.log(`Searching Tracxn - Feed: ${feedName}, Country: ${country}`);

      const filter: Record<string, unknown> = {};
      if (feedName) filter.feedName = Array.isArray(feedName) ? feedName : [feedName];
      if (foundedYear) filter.foundedYear = Array.isArray(foundedYear) ? foundedYear : [foundedYear];

      const searchPayload: Record<string, unknown> = {
        filter,
        limit,
      };

      // Only add sort if explicitly requested
      if (body.sortField) {
        searchPayload.sort = [{ field: body.sortField, order: body.sortOrder || "DESC" }];
      }

      console.log("Search payload:", JSON.stringify(searchPayload));

      const response = await fetch(`${baseUrl}/companies`, {
        method: "POST",
        headers: tracxnHeaders,
        body: JSON.stringify(searchPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Tracxn search error: ${errorText}`);
        return new Response(
          JSON.stringify({ error: "Search failed", status: response.status, details: errorText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({
          success: true,
          totalCount: data.totalCount,
          count: data.result?.length || 0,
          companies: data.result || [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

      console.log(`Looking up company by domain: ${domain}`);

      const response = await fetch(`${baseUrl}/companies/${encodeURIComponent(domain)}`, {
        method: "GET",
        headers: tracxnHeaders,
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

    // List feeds (sectors)
    if (action === "feeds") {
      console.log("Fetching Tracxn feeds...");

      const response = await fetch(`${baseUrl}/feeds`, {
        method: "GET",
        headers: tracxnHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Tracxn feeds error: ${response.status} ${errorText}`);
        return new Response(
          JSON.stringify({ error: "Feeds fetch failed", details: errorText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, feeds: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: "Unknown action", 
        availableActions: ["test", "company", "search", "feeds"],
        example: { action: "search", feedName: "Cybersecurity", country: "Germany", limit: 10 }
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
