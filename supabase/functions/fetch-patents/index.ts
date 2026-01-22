import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Patents via SerpApi alternative - use Lens.org scholarly/patent API (free tier)
// Or fallback: use OpenAlex for academic papers as proxy for patent activity

const OPENALEX_API_URL = 'https://api.openalex.org/works';

// Search OpenAlex for scholarly works (papers, patents) by keyword
// OpenAlex is completely free, no API key, high rate limits
async function searchOpenAlexPatents(
  keyword: string,
  limit = 25
): Promise<{ count: number; recentWorks: any[] }> {
  try {
    // Search for patent-related works
    const searchQuery = encodeURIComponent(keyword);
    const response = await fetch(
      `${OPENALEX_API_URL}?search=${searchQuery}&filter=type:patent&per_page=${limit}&sort=publication_date:desc`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CEI-Heatmap/1.0 (mailto:contact@example.com)',
        },
      }
    );

    if (!response.ok) {
      // Fallback: try searching all works if patent filter fails
      const fallbackResponse = await fetch(
        `${OPENALEX_API_URL}?search=${searchQuery}&per_page=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CEI-Heatmap/1.0',
          },
        }
      );
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        // Use total count as a proxy for research/patent activity
        return { count: Math.floor((data.meta?.count || 0) / 100), recentWorks: [] };
      }
      
      console.error('OpenAlex search failed:', response.status);
      return { count: 0, recentWorks: [] };
    }

    const data = await response.json();
    const totalCount = data.meta?.count || 0;
    const works = (data.results || []).slice(0, 5).map((w: any) => ({
      title: w.title,
      doi: w.doi,
      year: w.publication_year,
    }));

    return { count: totalCount, recentWorks: works };
  } catch (error) {
    console.error('OpenAlex search error:', error);
    return { count: 0, recentWorks: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { keywordId, keyword } = await req.json();

    // If specific keyword provided, search for it
    if (keyword) {
      const { count, recentWorks } = await searchOpenAlexPatents(keyword, 10);
      
      // Update the technology with patent count
      if (keywordId && count > 0) {
        await supabase
          .from('technologies')
          .update({
            total_patents: count,
          })
          .eq('keyword_id', keywordId);
      }
      
      return new Response(
        JSON.stringify({ success: true, patents: recentWorks, count }),
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
      // Rate limit - be nice to OpenAlex
      await new Promise(r => setTimeout(r, 200));
      
      const { count } = await searchOpenAlexPatents(tech.name, 1);
      
      if (count > 0) {
        await supabase
          .from('technologies')
          .update({ total_patents: count })
          .eq('keyword_id', tech.keyword_id);
        
        patentCounts[tech.name] = count;
        totalUpdated++;
      }
    }

    console.log(`Updated patents for ${totalUpdated} technologies`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: totalUpdated,
        counts: patentCounts,
        source: 'OpenAlex'
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
