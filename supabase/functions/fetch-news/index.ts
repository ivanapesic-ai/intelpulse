import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HNStory {
  id: number;
  title: string;
  url?: string;
  time: number;
  score: number;
  by: string;
}

interface NewsItem {
  title: string;
  url: string;
  date: string;
  source: string;
  score?: number;
}

// Technology keywords to search for in HN stories
const TECH_KEYWORDS_MAP: Record<string, string[]> = {
  'edge computing': ['edge computing', 'edge ai', 'edge cloud', 'fog computing'],
  'federated learning': ['federated learning', 'federated ml', 'distributed learning'],
  'digital twin': ['digital twin', 'virtual twin', 'digital replica'],
  'swarm intelligence': ['swarm intelligence', 'swarm ai', 'collective intelligence'],
  'neuromorphic computing': ['neuromorphic', 'brain-inspired computing', 'spiking neural'],
  'quantum computing': ['quantum computing', 'quantum machine learning', 'qml'],
  'homomorphic encryption': ['homomorphic encryption', 'fhe', 'fully homomorphic'],
  'zero knowledge': ['zero knowledge', 'zkp', 'zk-snark', 'zk-stark'],
  'confidential computing': ['confidential computing', 'trusted execution', 'tee', 'secure enclave'],
  'mlops': ['mlops', 'machine learning operations', 'ml pipeline'],
  'automl': ['automl', 'automated machine learning', 'neural architecture search'],
  'generative ai': ['generative ai', 'genai', 'llm', 'large language model', 'gpt', 'claude'],
  'computer vision': ['computer vision', 'image recognition', 'object detection'],
  'natural language processing': ['nlp', 'natural language', 'text processing', 'transformers'],
  'reinforcement learning': ['reinforcement learning', 'rl', 'deep rl'],
  'iot': ['iot', 'internet of things', 'smart sensors', 'connected devices'],
  'blockchain': ['blockchain', 'distributed ledger', 'smart contracts', 'web3'],
  '5g': ['5g', '6g', 'mobile edge', 'network slicing'],
  'kubernetes': ['kubernetes', 'k8s', 'container orchestration'],
  'serverless': ['serverless', 'faas', 'function as a service', 'lambda'],
};

// Fetch top stories from HackerNews
async function fetchHNTopStories(limit = 100): Promise<HNStory[]> {
  const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  const topStoryIds: number[] = await topStoriesRes.json();
  
  // Fetch story details in parallel (first N stories)
  const storyPromises = topStoryIds.slice(0, limit).map(async (id) => {
    const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    return storyRes.json() as Promise<HNStory>;
  });
  
  return Promise.all(storyPromises);
}

// Search HN Algolia API for specific keywords
async function searchHNAlgolia(query: string, limit = 10): Promise<NewsItem[]> {
  const encodedQuery = encodeURIComponent(query);
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${encodedQuery}&tags=story&hitsPerPage=${limit}`
  );
  
  if (!res.ok) return [];
  
  const data = await res.json();
  return (data.hits || []).map((hit: any) => ({
    title: hit.title,
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    date: new Date(hit.created_at).toISOString(),
    source: 'HackerNews',
    score: hit.points,
  }));
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
      const searchTerms = TECH_KEYWORDS_MAP[keyword.toLowerCase()] || [keyword];
      const allNews: NewsItem[] = [];
      
      for (const term of searchTerms.slice(0, 2)) { // Limit searches
        const news = await searchHNAlgolia(term, 5);
        allNews.push(...news);
      }
      
      // Deduplicate by URL
      const uniqueNews = Array.from(
        new Map(allNews.map(n => [n.url, n])).values()
      ).slice(0, 5);
      
      // Update the technology with news data
      if (keywordId) {
        await supabase
          .from('technologies')
          .update({
            news_mention_count: uniqueNews.length,
            recent_news: uniqueNews,
          })
          .eq('keyword_id', keywordId);
      }
      
      return new Response(
        JSON.stringify({ success: true, news: uniqueNews }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Otherwise, fetch news for all technologies
    const { data: technologies } = await supabase
      .from('technologies')
      .select('id, keyword_id, name')
      .order('composite_score', { ascending: false })
      .limit(20); // Top 20 technologies

    if (!technologies?.length) {
      return new Response(
        JSON.stringify({ success: true, message: 'No technologies found', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalUpdated = 0;
    const newsResults: Record<string, NewsItem[]> = {};

    for (const tech of technologies) {
      const searchTerms = TECH_KEYWORDS_MAP[tech.name.toLowerCase()] || [tech.name];
      const allNews: NewsItem[] = [];
      
      // Search with rate limiting
      for (const term of searchTerms.slice(0, 2)) {
        const news = await searchHNAlgolia(term, 5);
        allNews.push(...news);
        await new Promise(r => setTimeout(r, 100)); // Small delay to avoid rate limits
      }
      
      // Deduplicate
      const uniqueNews = Array.from(
        new Map(allNews.map(n => [n.url, n])).values()
      ).slice(0, 5);
      
      if (uniqueNews.length > 0) {
        await supabase
          .from('technologies')
          .update({
            news_mention_count: uniqueNews.length,
            recent_news: uniqueNews,
          })
          .eq('keyword_id', tech.keyword_id);
        
        newsResults[tech.name] = uniqueNews;
        totalUpdated++;
      }
    }

    console.log(`Updated news for ${totalUpdated} technologies`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: totalUpdated,
        results: newsResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fetch news error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
