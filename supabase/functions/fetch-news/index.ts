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

// Technology keywords to search for in HN stories - ML-SDV focused
const TECH_KEYWORDS_MAP: Record<string, string[]> = {
  // Core AI/ML technologies
  'edge computing': ['edge computing', 'edge ai', 'edge cloud', 'fog computing'],
  'federated learning': ['federated learning', 'federated ml', 'distributed learning'],
  'digital twin': ['digital twin', 'virtual twin', 'digital replica', 'simulation twin'],
  'swarm intelligence': ['swarm intelligence', 'swarm ai', 'collective intelligence', 'swarm robotics'],
  'neuromorphic computing': ['neuromorphic', 'brain-inspired computing', 'spiking neural'],
  'quantum computing': ['quantum computing', 'quantum machine learning', 'qml', 'quantum algorithm'],
  'homomorphic encryption': ['homomorphic encryption', 'fhe', 'fully homomorphic'],
  'zero knowledge': ['zero knowledge', 'zkp', 'zk-snark', 'zk-stark', 'zero-knowledge proof'],
  'confidential computing': ['confidential computing', 'trusted execution', 'tee', 'secure enclave'],
  'mlops': ['mlops', 'machine learning operations', 'ml pipeline', 'model deployment'],
  'automl': ['automl', 'automated machine learning', 'neural architecture search'],
  'generative ai': ['generative ai', 'genai', 'llm', 'large language model'],
  'computer vision': ['computer vision', 'image recognition', 'object detection', 'visual ai'],
  'natural language processing': ['nlp', 'natural language', 'text processing', 'transformers'],
  'reinforcement learning': ['reinforcement learning', 'rl', 'deep rl', 'policy gradient'],
  
  // ML-SDV / Automotive technologies
  'autonomous driving': ['autonomous driving', 'self-driving', 'waymo', 'autonomous vehicle', 'robotaxi', 'adas'],
  'ev charging': ['ev charging', 'charging station', 'evse', 'charge point', 'ev infrastructure', 'chargepoint'],
  'fleet management': ['fleet management', 'fleet tracking', 'vehicle telematics', 'fleet optimization'],
  'supply chain management': ['supply chain ai', 'logistics automation', 'warehouse robotics', 'inventory ai', 'supply chain optimization'],
  'predictive maintenance': ['predictive maintenance', 'condition monitoring', 'equipment monitoring', 'failure prediction'],
  'vehicle-to-everything': ['v2x', 'vehicle-to-everything', 'v2v', 'vehicle communication', 'connected car'],
  'lidar': ['lidar', 'laser sensing', 'point cloud', '3d sensing', 'velodyne', 'luminar'],
  'battery technology': ['battery technology', 'solid state battery', 'battery management', 'ev battery', 'lithium'],
  'software-defined vehicle': ['software-defined vehicle', 'sdv', 'vehicle software', 'automotive software'],
  'hd mapping': ['hd mapping', 'high-definition map', 'automotive mapping', 'lidar mapping'],
  'sensor fusion': ['sensor fusion', 'multi-sensor', 'perception stack', 'sensor integration'],
  'electric mobility': ['electric mobility', 'emobility', 'electric vehicle', 'ev startup'],
  
  // Infrastructure technologies
  'iot': ['iot', 'internet of things', 'smart sensors', 'connected devices', 'industrial iot'],
  'blockchain': ['blockchain', 'distributed ledger', 'smart contracts', 'web3'],
  '5g': ['5g', '6g', 'mobile edge', 'network slicing', '5g network'],
  'kubernetes': ['kubernetes', 'k8s', 'container orchestration', 'cloud native'],
  'serverless': ['serverless', 'faas', 'function as a service', 'edge function'],
};

// Check if news article is relevant based on title matching
function isRelevantNews(title: string, keywords: string[]): boolean {
  const titleLower = title.toLowerCase();
  // Title must contain at least one of the search keywords
  return keywords.some(kw => titleLower.includes(kw.toLowerCase()));
}

// Minimum HN score threshold for quality filtering
const MIN_SCORE_THRESHOLD = 10;

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

// Search HN Algolia API for specific keywords - only 2025 onwards
async function searchHNAlgolia(query: string, limit = 10): Promise<NewsItem[]> {
  const encodedQuery = encodeURIComponent(query);
  
  // Filter to only get stories from 2025 onwards (Unix timestamp for Jan 1, 2025)
  const jan2025Timestamp = 1735689600; // 2025-01-01 00:00:00 UTC
  
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${encodedQuery}&tags=story&hitsPerPage=${limit}&numericFilters=created_at_i>${jan2025Timestamp}`
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
      
      for (const term of searchTerms.slice(0, 3)) { // Search up to 3 terms
        const news = await searchHNAlgolia(term, 10); // Fetch more to filter
        allNews.push(...news);
      }
      
      // Filter for relevance and quality
      const relevantNews = allNews.filter(n => 
        (n.score || 0) >= MIN_SCORE_THRESHOLD && 
        isRelevantNews(n.title, searchTerms)
      );
      
      // Deduplicate by URL and take top 5
      const uniqueNews = Array.from(
        new Map(relevantNews.map(n => [n.url, n])).values()
      ).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
      
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
      
      // Search with rate limiting - fetch more to allow filtering
      for (const term of searchTerms.slice(0, 3)) {
        const news = await searchHNAlgolia(term, 10);
        allNews.push(...news);
        await new Promise(r => setTimeout(r, 100)); // Small delay to avoid rate limits
      }
      
      // Filter for relevance and quality
      const relevantNews = allNews.filter(n => 
        (n.score || 0) >= MIN_SCORE_THRESHOLD && 
        isRelevantNews(n.title, searchTerms)
      );
      
      // Deduplicate and sort by score
      const uniqueNews = Array.from(
        new Map(relevantNews.map(n => [n.url, n])).values()
      ).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
      
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
