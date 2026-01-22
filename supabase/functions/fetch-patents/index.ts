import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatentResult {
  patent_title: string;
  patent_number: string;
  patent_date: string;
  assignee?: string;
}

// USPTO PatentsView API - Free, no auth required
const USPTO_API_URL = 'https://api.patentsview.org/patents/query';

// Search USPTO for patents by keyword
async function searchUSPTOPatents(
  keyword: string,
  limit = 25
): Promise<{ patents: PatentResult[]; count: number }> {
  try {
    // Build query for patent title or abstract containing keyword
    const query = {
      _or: [
        { _text_any: { patent_title: keyword } },
        { _text_any: { patent_abstract: keyword } }
      ]
    };

    const response = await fetch(USPTO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        f: ['patent_title', 'patent_number', 'patent_date', 'assignee_organization'],
        o: { per_page: limit },
        s: [{ patent_date: 'desc' }]
      }),
    });

    if (!response.ok) {
      console.error('USPTO search failed:', response.status, await response.text());
      return { patents: [], count: 0 };
    }

    const data = await response.json();
    const totalCount = data.total_patent_count || 0;
    const patents: PatentResult[] = (data.patents || []).map((p: any) => ({
      patent_title: p.patent_title,
      patent_number: p.patent_number,
      patent_date: p.patent_date,
      assignee: p.assignees?.[0]?.assignee_organization,
    }));

    return { patents, count: totalCount };
  } catch (error) {
    console.error('USPTO search error:', error);
    return { patents: [], count: 0 };
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
      const { patents, count } = await searchUSPTOPatents(keyword, 10);
      
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
        JSON.stringify({ success: true, patents, count }),
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
      // Rate limit - be nice to USPTO API
      await new Promise(r => setTimeout(r, 300));
      
      const { count } = await searchUSPTOPatents(tech.name, 1);
      
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
        source: 'USPTO PatentsView'
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
