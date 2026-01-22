import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatentResult {
  title: string;
  applicationNumber: string;
  publicationDate: string;
  applicant?: string;
  abstract?: string;
}

// EPO OPS API endpoints
const EPO_AUTH_URL = 'https://ops.epo.org/3.2/auth/accesstoken';
const EPO_SEARCH_URL = 'https://ops.epo.org/3.2/rest-services/published-data/search';

// Get OAuth token from EPO
async function getEPOAccessToken(consumerKey: string, consumerSecret: string): Promise<string | null> {
  try {
    const credentials = btoa(`${consumerKey}:${consumerSecret}`);
    
    const response = await fetch(EPO_AUTH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!response.ok) {
      console.error('EPO auth failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('EPO auth error:', error);
    return null;
  }
}

// Search EPO for patents by keyword
async function searchEPOPatents(
  accessToken: string,
  keyword: string,
  limit = 10
): Promise<PatentResult[]> {
  try {
    // CQL query for patent search
    const query = encodeURIComponent(`ta="${keyword}" OR ti="${keyword}"`);
    
    const response = await fetch(
      `${EPO_SEARCH_URL}?q=${query}&Range=1-${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error('EPO search failed:', response.status, await response.text());
      return [];
    }
    
    const data = await response.json();
    const results = data['ops:world-patent-data']?.['ops:biblio-search']?.['ops:search-result']?.['ops:publication-reference'] || [];
    
    // Parse results (EPO response structure is complex)
    const patents: PatentResult[] = [];
    const resultArray = Array.isArray(results) ? results : [results];
    
    for (const result of resultArray) {
      const docId = result?.['document-id'];
      if (docId) {
        patents.push({
          title: keyword, // EPO search doesn't return title directly
          applicationNumber: `${docId?.country?.$}${docId?.['doc-number']?.$}`,
          publicationDate: docId?.date?.$ || '',
          applicant: undefined,
        });
      }
    }
    
    return patents;
  } catch (error) {
    console.error('EPO search error:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const epoConsumerKey = Deno.env.get('EPO_CONSUMER_KEY');
  const epoConsumerSecret = Deno.env.get('EPO_CONSUMER_SECRET');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check if EPO credentials are configured
  if (!epoConsumerKey || !epoConsumerSecret) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'EPO OPS credentials not configured. Please add EPO_CONSUMER_KEY and EPO_CONSUMER_SECRET.',
        needsSetup: true,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { keywordId, keyword } = await req.json();
    
    // Get EPO access token
    const accessToken = await getEPOAccessToken(epoConsumerKey, epoConsumerSecret);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to authenticate with EPO OPS' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If specific keyword provided, search for it
    if (keyword) {
      const patents = await searchEPOPatents(accessToken, keyword, 10);
      
      // Update the technology with patent count
      if (keywordId && patents.length > 0) {
        await supabase
          .from('technologies')
          .update({
            total_patents: patents.length,
          })
          .eq('keyword_id', keywordId);
      }
      
      return new Response(
        JSON.stringify({ success: true, patents, count: patents.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Otherwise, fetch patents for all technologies
    const { data: technologies } = await supabase
      .from('technologies')
      .select('id, keyword_id, name')
      .order('composite_score', { ascending: false })
      .limit(20);

    if (!technologies?.length) {
      return new Response(
        JSON.stringify({ success: true, message: 'No technologies found', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalUpdated = 0;
    const patentCounts: Record<string, number> = {};

    for (const tech of technologies) {
      // Rate limit - EPO has strict limits
      await new Promise(r => setTimeout(r, 500));
      
      const patents = await searchEPOPatents(accessToken, tech.name, 25);
      
      if (patents.length > 0) {
        await supabase
          .from('technologies')
          .update({ total_patents: patents.length })
          .eq('keyword_id', tech.keyword_id);
        
        patentCounts[tech.name] = patents.length;
        totalUpdated++;
      }
    }

    console.log(`Updated patents for ${totalUpdated} technologies`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: totalUpdated,
        counts: patentCounts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fetch patents error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
