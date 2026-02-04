# AI-CE Heatmap Platform - Complete Technical Capabilities

> **Last Updated:** February 4, 2025  
> **Purpose:** Comprehensive documentation of all algorithms, data pipelines, and processing logic for Claude ontology building

---

## Table of Contents

1. [Technology Taxonomy System](#1-technology-taxonomy-system)
2. [Document Processing & AI Extraction](#2-document-processing--ai-extraction)
3. [H11 Hybrid Scoring Algorithm](#3-h11-hybrid-scoring-algorithm)
4. [Technology Co-occurrence & Ontology](#4-technology-co-occurrence--ontology)
5. [Signal Aggregation Pipeline](#5-signal-aggregation-pipeline)
6. [Web Scraping System](#6-web-scraping-system)
7. [Patent Integration (EPO)](#7-patent-integration-epo)
8. [Crunchbase Integration](#8-crunchbase-integration)
9. [Maturity Scoring Framework](#9-maturity-scoring-framework)
10. [Database Schema Reference](#10-database-schema-reference)

---

## 1. Technology Taxonomy System

### Master Taxonomy Definition

The platform uses a **keyword-based taxonomy** with 56 active technology terms from two sources:

#### CEI-SPHERE Keywords (32 terms)
```
Autonomous Driving, Battery Electric Vehicle (BEV), Vehicle to Grid (V2G),
Software Defined Vehicle (SDV), Electric Vehicle (EV), EV Charging,
Vehicle to Everything (V2X), Advanced Driver Assistance Systems (ADAS),
Mobility as a Service (MaaS), Shared Mobility, Fleet Management,
Logistics, Supply Chain, Maritime, Smart City, Urban Air Mobility,
Drones, Digital Twin, Edge Computing, Cloud Infrastructure,
5G/6G Connectivity, Cybersecurity, Energy Management System (EMS),
Solar Energy System (SES), Stationary Energy Storage, Shared Energy Storage,
Self-driving vehicles, Autonomous Vehicle, E-Vehicle, Telematics,
Teledriving, Sustainability Measurement
```

#### Source Classification
```typescript
type KeywordSource = 'cei_sphere' | 'dealroom' | 'manual';

interface TechnologyKeyword {
  id: string;
  keyword: string;                    // Normalized lowercase key
  display_name: string;               // Human-readable name
  source: KeywordSource;
  description?: string;
  parent_keyword_id?: string;         // Hierarchical relationships
  aliases?: string[];                 // Alternative names for matching
  dealroom_tags?: string[];           // Mapped external taxonomy terms
  dealroom_industries?: string[];
  dealroom_sub_industries?: string[];
  is_active: boolean;
}
```

### Keyword Matching Logic

When processing documents or company data, keywords are matched using:

```typescript
// Priority order for matching:
1. Exact match on `display_name` (case-insensitive)
2. Exact match on `keyword` (normalized)
3. Match on any value in `aliases[]` array
4. Fuzzy/semantic match via AI (confidence threshold: 0.7)
```

---

## 2. Document Processing & AI Extraction

### Document Pipeline Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  PDF/PPTX/DOCX  │────▶│  Edge Function:  │────▶│  Supabase DB    │
│  Upload/Queue   │     │  parse-document  │     │  Storage        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Gemini 2.0 Flash    │
                    │  AI Analysis         │
                    └──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Technology Mentions │
                    │  TRL Assessment      │
                    │  Policy References   │
                    └──────────────────────┘
```

### AI Extraction Prompt (parse-document function)

```typescript
const EXTRACTION_PROMPT = `
Analyze this document and extract:

1. TECHNOLOGY MENTIONS
   - Identify all technology keywords from our taxonomy
   - For each mention, extract:
     * The exact context (surrounding sentence)
     * Page number where found
     * Confidence score (0.0-1.0)
     * Semantic similarity to keyword definition

2. TRL ASSESSMENT (Technology Readiness Level 1-9)
   Look for indicators:
   - TRL 1-3: Basic research, concepts, proof of concept
   - TRL 4-6: Lab validation, prototypes, pilots
   - TRL 7-9: System complete, qualified, operational

3. POLICY REFERENCES
   - EU Horizon references
   - IPCEI mentions
   - National policy citations
   - Regulatory framework references

4. POSITION WEIGHTING
   - Title/heading mentions: weight 3.0
   - Abstract/summary: weight 2.5
   - Body text: weight 1.0
   - Footnotes/references: weight 0.5

Return structured JSON with all extractions.
`;
```

### Document Mention Schema

```sql
CREATE TABLE document_technology_mentions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES cei_documents(id),
  keyword_id UUID REFERENCES technology_keywords(id),
  
  -- Extraction data
  mention_context TEXT,           -- Surrounding sentence
  page_number INTEGER,
  confidence_score DECIMAL(3,2),  -- 0.00-1.00
  
  -- H11 Scoring Components
  semantic_similarity DECIMAL(5,4),  -- KeyBERT cosine similarity
  position_weight DECIMAL(3,2),      -- Title=3.0, Body=1.0
  relevance_score DECIMAL(5,4),      -- Combined score
  
  -- TRL & Policy
  trl_mentioned INTEGER CHECK (trl_mentioned BETWEEN 1 AND 9),
  policy_reference TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Processing Queue System

```sql
CREATE TABLE pdf_processing_queue (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,                  -- Source URL
  filename TEXT,
  source_type TEXT DEFAULT 'zenodo',  -- zenodo, ceisphere, eucloudedgeiot
  zenodo_record_id TEXT,              -- If from Zenodo
  
  -- Processing state
  status TEXT DEFAULT 'pending',      -- pending, processing, completed, failed
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Results
  storage_path TEXT,                  -- Where PDF stored
  file_size_bytes INTEGER,
  mentions_extracted INTEGER,
  processed_at TIMESTAMPTZ
);
```

---

## 3. H11 Hybrid Scoring Algorithm

The H11 scoring system combines four AI/NLP techniques to rank technology relevance:

### Component 1: Semantic Scoring (KeyBERT-style)

```typescript
// Cosine similarity between document context and keyword embedding
async function calculateSemanticScore(
  mentionContext: string, 
  keywordEmbedding: number[]
): Promise<number> {
  // Using gte-small model via Supabase.ai
  const contextEmbedding = await supabase.ai.embed(mentionContext);
  return cosineSimilarity(contextEmbedding, keywordEmbedding);
}

// Score range: 0.0 - 1.0
// Threshold for "relevant": >= 0.6
```

### Component 2: Network Centrality (TextRank-style)

```sql
-- PageRank-style calculation stored in function
CREATE OR REPLACE FUNCTION calculate_network_centrality()
RETURNS VOID AS $$
DECLARE
  damping DECIMAL := 0.85;
  iterations INTEGER := 20;
BEGIN
  -- Initialize all keywords with equal centrality
  UPDATE technologies SET network_centrality = 1.0 / 
    (SELECT COUNT(*) FROM technologies);
  
  -- Iterate PageRank
  FOR i IN 1..iterations LOOP
    UPDATE technologies t SET
      network_centrality = (1 - damping) + damping * (
        SELECT COALESCE(SUM(
          t2.network_centrality * co.cooccurrence_count / 
          (SELECT SUM(cooccurrence_count) 
           FROM technology_cooccurrences 
           WHERE keyword_id_a = co.keyword_id_a)
        ), 0)
        FROM technology_cooccurrences co
        JOIN technologies t2 ON t2.keyword_id = co.keyword_id_a
        WHERE co.keyword_id_b = t.keyword_id
      );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Component 3: Corpus Rarity (TF-IDF-style)

```sql
-- Calculate inverse document frequency
CREATE OR REPLACE FUNCTION calculate_tfidf_scores()
RETURNS VOID AS $$
DECLARE
  total_docs INTEGER;
BEGIN
  SELECT COUNT(DISTINCT document_id) INTO total_docs 
  FROM document_technology_mentions;
  
  UPDATE technologies t SET
    corpus_rarity_score = LOG(
      total_docs::DECIMAL / 
      NULLIF((
        SELECT COUNT(DISTINCT document_id) 
        FROM document_technology_mentions dtm 
        WHERE dtm.keyword_id = t.keyword_id
      ), 0)
    );
END;
$$ LANGUAGE plpgsql;

-- Higher score = rarer keyword = potentially more valuable signal
```

### Component 4: Position-Weighted Frequency

```typescript
// Aggregate weighted mentions per keyword
const weightedFrequency = mentions.reduce((sum, m) => {
  const positionWeight = getPositionWeight(m.page_number, m.mention_context);
  return sum + (positionWeight * m.relevance_score);
}, 0);

function getPositionWeight(pageNumber: number, context: string): number {
  if (isInTitle(context)) return 3.0;
  if (isInAbstract(context)) return 2.5;
  if (pageNumber <= 2) return 1.5;
  return 1.0;
}
```

### Combined H11 Score

```typescript
interface TechnologyScores {
  avg_semantic_score: number;      // KeyBERT component
  network_centrality: number;      // TextRank component  
  corpus_rarity_score: number;     // TF-IDF component
  weighted_frequency_score: number; // Position-weighted
  avg_relevance_score: number;     // Simple average relevance
  document_diversity: number;      // Unique source count
}

// Final composite (stored in technologies.composite_score)
const compositeScore = (
  investmentScore + 
  employeesScore + 
  trlScore
) / 3;  // 0-2 scale
```

---

## 4. Technology Co-occurrence & Ontology

### Co-occurrence Detection

Technologies that appear together in documents or companies form relationships:

```sql
CREATE TABLE technology_cooccurrences (
  id UUID PRIMARY KEY,
  keyword_id_a UUID REFERENCES technology_keywords(id),
  keyword_id_b UUID REFERENCES technology_keywords(id),
  
  -- Relationship strength
  cooccurrence_count INTEGER DEFAULT 1,
  source_documents INTEGER DEFAULT 1,  -- Unique documents
  avg_combined_relevance DECIMAL(5,4),
  
  last_seen_at TIMESTAMPTZ,
  
  UNIQUE(keyword_id_a, keyword_id_b)
);
```

### Populating from Companies

```sql
-- Function to detect co-occurrences from company keyword mappings
CREATE OR REPLACE FUNCTION populate_cooccurrences_from_companies()
RETURNS TABLE(
  pairs_created INTEGER,
  pairs_updated INTEGER,
  quality_companies_used INTEGER
) AS $$
DECLARE
  v_pairs_created INTEGER := 0;
  v_pairs_updated INTEGER := 0;
  v_companies_used INTEGER := 0;
BEGIN
  -- Only use "quality" companies (have funding or employees)
  FOR company IN 
    SELECT id FROM crunchbase_companies 
    WHERE total_funding_usd > 0 OR number_of_employees != 'Unknown'
  LOOP
    v_companies_used := v_companies_used + 1;
    
    -- Get all keywords for this company
    FOR kw_pair IN
      SELECT DISTINCT a.keyword_id as kw_a, b.keyword_id as kw_b
      FROM crunchbase_keyword_mapping a
      JOIN crunchbase_keyword_mapping b ON a.company_id = b.company_id
      WHERE a.company_id = company.id
        AND a.keyword_id < b.keyword_id  -- Avoid duplicates
    LOOP
      -- Upsert co-occurrence
      INSERT INTO technology_cooccurrences (keyword_id_a, keyword_id_b)
      VALUES (kw_pair.kw_a, kw_pair.kw_b)
      ON CONFLICT (keyword_id_a, keyword_id_b) DO UPDATE
      SET cooccurrence_count = technology_cooccurrences.cooccurrence_count + 1,
          source_documents = technology_cooccurrences.source_documents + 1,
          last_seen_at = NOW();
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT v_pairs_created, v_pairs_updated, v_companies_used;
END;
$$ LANGUAGE plpgsql;
```

### Cluster Detection Algorithm

```typescript
// From useTechnologyOntology.ts
function detectClusters(
  nodes: TechnologyNode[],
  edges: TechnologyEdge[]
): Map<string, string[]> {
  const clusters = new Map<string, string[]>();
  const assigned = new Set<string>();

  // Sort edges by weight (strongest connections first)
  const sortedEdges = [...edges].sort((a, b) => b.weight - a.weight);

  for (const edge of sortedEdges) {
    const sourceAssigned = assigned.has(edge.source);
    const targetAssigned = assigned.has(edge.target);

    if (!sourceAssigned && !targetAssigned) {
      // Create new cluster with both nodes
      clusters.set(edge.source, [edge.source, edge.target]);
      assigned.add(edge.source);
      assigned.add(edge.target);
    } else if (!sourceAssigned) {
      // Add source to target's existing cluster
      for (const [clusterId, members] of clusters) {
        if (members.includes(edge.target)) {
          members.push(edge.source);
          assigned.add(edge.source);
          break;
        }
      }
    } else if (!targetAssigned) {
      // Add target to source's existing cluster
      for (const [clusterId, members] of clusters) {
        if (members.includes(edge.source)) {
          members.push(edge.target);
          assigned.add(edge.target);
          break;
        }
      }
    }
    // If both assigned to different clusters, don't merge (simple algorithm)
  }

  return clusters;
}
```

### Expected Cluster Examples

```
EV Cluster:
├── Electric Vehicle
├── Battery Electric Vehicle
├── EV Charging
├── Vehicle to Grid
└── Energy Management System

Autonomous Cluster:
├── Autonomous Driving
├── ADAS
├── Software Defined Vehicle
├── V2X
└── LiDAR

Logistics Cluster:
├── Fleet Management
├── Supply Chain
├── Logistics
├── Telematics
└── Last Mile Delivery
```

---

## 5. Signal Aggregation Pipeline

### Three-Signal Architecture

| Signal | Name | Data Source | Metric |
|--------|------|-------------|--------|
| Signal 1 | Investment Activity | Crunchbase exports | Total funding, rounds |
| Signal 2 | Innovation/Patents | EPO API | Patent counts by applicant |
| Signal 3 | Market Response | CEI Documents + News | TRL mentions, policy refs |

### Aggregation Functions

#### aggregate_crunchbase_signals()

```sql
CREATE OR REPLACE FUNCTION aggregate_crunchbase_signals()
RETURNS TABLE(
  companies_with_data INTEGER,
  keywords_processed INTEGER,
  total_funding_aggregated NUMERIC,
  total_patents_aggregated INTEGER
) AS $$
BEGIN
  -- Aggregate per keyword
  UPDATE technologies t SET
    dealroom_company_count = agg.company_count,
    total_funding_eur = agg.total_funding,
    total_employees = agg.total_employees,
    total_patents = agg.total_patents,
    key_players = agg.top_companies,
    
    -- Calculate 0-2 scores
    investment_score = CASE
      WHEN agg.total_funding >= 1000000000 THEN 2  -- €1B+
      WHEN agg.total_funding >= 100000000 THEN 1   -- €100M+
      ELSE 0
    END,
    employees_score = CASE
      WHEN agg.total_employees >= 10000 THEN 2
      WHEN agg.total_employees >= 1000 THEN 1
      ELSE 0
    END,
    patents_score = CASE
      WHEN agg.total_patents >= 100 THEN 2
      WHEN agg.total_patents >= 10 THEN 1
      ELSE 0
    END
  FROM (
    SELECT 
      ckm.keyword_id,
      COUNT(DISTINCT cc.id) as company_count,
      COALESCE(SUM(cc.total_funding_usd * 0.92), 0) as total_funding,
      COALESCE(SUM(
        CASE cc.number_of_employees
          WHEN '10001+' THEN 15000
          WHEN '5001-10000' THEN 7500
          WHEN '1001-5000' THEN 3000
          WHEN '501-1000' THEN 750
          WHEN '251-500' THEN 375
          WHEN '101-250' THEN 175
          WHEN '51-100' THEN 75
          WHEN '11-50' THEN 30
          WHEN '1-10' THEN 5
          ELSE 0
        END
      ), 0) as total_employees,
      COALESCE(SUM(cc.patents_count), 0) as total_patents,
      ARRAY_AGG(cc.organization_name ORDER BY cc.total_funding_usd DESC NULLS LAST)
        FILTER (WHERE cc.total_funding_usd > 0) 
        [1:5] as top_companies
    FROM crunchbase_keyword_mapping ckm
    JOIN crunchbase_companies cc ON ckm.company_id = cc.id
    GROUP BY ckm.keyword_id
  ) agg
  WHERE t.keyword_id = agg.keyword_id;
  
  -- Recalculate composite scores
  UPDATE technologies SET
    composite_score = (
      COALESCE(investment_score, 0) + 
      COALESCE(employees_score, 0) + 
      COALESCE(trl_score, 0)
    )::DECIMAL / 3;
  
  RETURN QUERY SELECT ...;
END;
$$ LANGUAGE plpgsql;
```

#### aggregate_patent_scores()

```sql
CREATE OR REPLACE FUNCTION aggregate_patent_scores()
RETURNS TABLE(
  keywords_updated INTEGER,
  total_patents_aggregated INTEGER
) AS $$
BEGIN
  UPDATE technologies t SET
    total_patents = (
      SELECT COALESCE(SUM(cc.patents_count), 0)
      FROM crunchbase_keyword_mapping ckm
      JOIN crunchbase_companies cc ON ckm.company_id = cc.id
      WHERE ckm.keyword_id = t.keyword_id
    ),
    patents_score = CASE
      WHEN (SELECT SUM(cc.patents_count) FROM ...) >= 100 THEN 2
      WHEN (SELECT SUM(cc.patents_count) FROM ...) >= 10 THEN 1
      ELSE 0
    END;
    
  RETURN QUERY ...;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Web Scraping System

### Target Websites

| Website | URL Pattern | Content Type |
|---------|-------------|--------------|
| CEI-Sphere | ceisphere.eu/publications/* | PDF publications, news |
| EUCloudEdgeIoT | eucloudedgeiot.eu/* | Project docs, deliverables |
| Zenodo | zenodo.org/records/* | Academic PDFs |

### Firecrawl Integration

```typescript
// From src/lib/api/firecrawl.ts
export const firecrawlApi = {
  // Scrape single URL for content
  async scrape(url: string, options?: {
    formats?: ('markdown' | 'html' | 'links')[];
    onlyMainContent?: boolean;
    waitFor?: number;
  }): Promise<FirecrawlResponse> {
    return await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options }
    });
  },

  // Map entire website to discover URLs
  async map(url: string, options?: {
    search?: string;
    limit?: number;
    includeSubdomains?: boolean;
  }): Promise<FirecrawlResponse> {
    return await supabase.functions.invoke('firecrawl-map', {
      body: { url, options }
    });
  },

  // Specialized scraper for known CEI websites
  async scrapeWebsite(options: {
    website: 'ceisphere' | 'eucloudedgeiot';
    scrapeType: 'publications' | 'news' | 'projects' | 'all';
  }): Promise<FirecrawlResponse> {
    return await supabase.functions.invoke('website-scrape', {
      body: options
    });
  }
};
```

### Scraped Content Storage

```sql
CREATE TABLE scraped_web_content (
  id UUID PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  website TEXT NOT NULL,           -- ceisphere, eucloudedgeiot
  page_type TEXT DEFAULT 'unknown', -- publication, news, project
  
  title TEXT,
  markdown_content TEXT,
  
  -- PDF discovery
  pdf_links JSONB,                 -- [{url, title}]
  pdfs_processed INTEGER DEFAULT 0,
  
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Web Mention Extraction

```sql
CREATE TABLE web_technology_mentions (
  id UUID PRIMARY KEY,
  keyword_id UUID REFERENCES technology_keywords(id),
  source_url TEXT,
  
  -- Same H11 scoring as document mentions
  mention_context TEXT,
  semantic_similarity DECIMAL(5,4),
  position_weight DECIMAL(3,2),
  relevance_score DECIMAL(5,4),
  confidence_score DECIMAL(3,2),
  
  trl_mentioned INTEGER,
  policy_reference TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Patent Integration (EPO)

### EPO Open Patent Services API

```typescript
// Edge function: epo-patent-lookup
const EPO_AUTH_URL = 'https://ops.epo.org/3.2/auth/accesstoken';
const EPO_SEARCH_URL = 'https://ops.epo.org/3.2/rest-services/published-data/search';

interface EpoSearchParams {
  applicantName: string;
  ipcCodes?: string[];  // e.g., ['B60W', 'B60L']
  dateRange?: { from: string; to: string };
}

async function searchPatents(params: EpoSearchParams): Promise<PatentResult[]> {
  // Get OAuth token
  const token = await getEpoToken();
  
  // Build CQL query
  const query = buildCqlQuery(params);
  // Example: "pa=Waymo AND ic=B60W"
  
  const response = await fetch(EPO_SEARCH_URL, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({ q: query })
  });
  
  return parseEpoResponse(response);
}
```

### IPC Code Mapping

```typescript
const IPC_TO_TECHNOLOGY: Record<string, string[]> = {
  'B60W': ['Autonomous Driving', 'ADAS', 'SDV'],  // Vehicle control
  'B60L': ['Electric Vehicle', 'BEV'],            // Electric propulsion
  'B60K': ['Vehicle to Grid', 'Energy Management'],
  'H02J': ['EV Charging', 'Energy Storage'],
  'G05D': ['Autonomous Driving', 'Drones'],       // Control systems
  'G01S': ['LiDAR', 'Radar', 'ADAS'],            // Detection/ranging
  'H04L': ['V2X', '5G Connectivity'],            // Data transmission
  'G06N': ['AI/ML', 'Computer Vision'],          // Machine learning
};
```

### Patent Enrichment Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Company Name   │────▶│  EPO Search API  │────▶│  Patent Count   │
│  (from Crunch)  │     │  by Applicant    │     │  Update         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                               │
        │                                               ▼
        │                                    ┌─────────────────┐
        │                                    │  crunchbase_    │
        │                                    │  companies.     │
        │                                    │  patents_count  │
        │                                    └─────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────┐                          ┌─────────────────┐
│  Keyword Link   │◀─────────────────────────│  Aggregate      │
│  (mapping)      │                          │  to Technology  │
└─────────────────┘                          └─────────────────┘
```

---

## 8. Crunchbase Integration

### CSV Import System

```typescript
// Headers expected from Crunchbase export
const CRUNCHBASE_HEADERS = [
  'Organization Name',
  'Description', 
  'Full Description',
  'Website',
  'Headquarters Location',
  'Country/Region',
  'Founded Date',
  'Number of Employees',
  'Industries',
  'Industry Groups',
  'Total Funding Amount',
  'Last Funding Amount',
  'Last Funding Date',
  'Last Funding Type',
  'Number of Funding Rounds',
  'Top 5 Investors',
  'Lead Investors',
  'Investor Count',
  'Number of Articles',
  'CB Rank (Company)',
  'Crunchbase URL'
];
```

### Context-Aware Keyword Matching Rules

```typescript
// From CrunchbaseImportPanel.tsx
const KEYWORD_MAPPING_RULES: Record<string, MappingRule> = {
  'Electric Vehicle': {
    required: ['electric vehicle', 'ev ', ' ev', 'electric car', 'e-vehicle'],
    context: ['automotive', 'mobility', 'transport', 'charging'],
    exclude: ['mining', 'dealership', 'rental only']
  },
  'Autonomous Driving': {
    required: ['autonomous', 'self-driving', 'driverless', 'autopilot'],
    context: ['vehicle', 'car', 'driving', 'mobility'],
    exclude: ['warehouse robot', 'industrial robot']
  },
  'Software Defined Vehicle': {
    required: ['software defined vehicle', 'sdv', 'vehicle software', 
               'automotive software', 'connected car', 'ota update'],
    context: ['automotive', 'vehicle', 'mobility'],
    exclude: []
  },
  'EV Charging': {
    required: ['ev charging', 'charge point', 'charging station', 
               'charger', 'evse'],
    context: ['electric', 'vehicle', 'infrastructure'],
    exclude: ['phone charger', 'battery charger only']
  },
  'ADAS': {
    required: ['adas', 'driver assistance', 'collision avoidance',
               'lane keeping', 'parking assist'],
    context: ['automotive', 'safety', 'vehicle'],
    exclude: []
  },
  'V2X': {
    required: ['v2x', 'vehicle to everything', 'vehicle-to-',
               'v2i', 'v2v', 'c-v2x'],
    context: ['connectivity', 'communication', 'vehicle'],
    exclude: []
  },
  'Fleet Management': {
    required: ['fleet management', 'fleet tracking', 'fleet software',
               'vehicle fleet', 'fleet optimization'],
    context: ['logistics', 'transport', 'vehicles'],
    exclude: ['airline fleet']
  },
  'LiDAR': {
    required: ['lidar', 'laser radar', 'laser scanning'],
    context: ['sensing', 'autonomous', 'mapping'],
    exclude: ['archaeological lidar']
  },
  'Vehicle to Grid': {
    required: ['vehicle to grid', 'v2g', 'bidirectional charging',
               'grid integration'],
    context: ['energy', 'electric', 'charging'],
    exclude: []
  },
  'Battery Electric Vehicle': {
    required: ['bev', 'battery electric', 'pure electric vehicle'],
    context: ['automotive', 'mobility'],
    exclude: ['hybrid', 'fuel cell']
  },
  // ... 23 total technology rules
};

function matchKeywords(company: CrunchbaseCompany): KeywordMatch[] {
  const matches: KeywordMatch[] = [];
  const searchText = `${company.description} ${company.industries}`.toLowerCase();
  
  for (const [keyword, rule] of Object.entries(KEYWORD_MAPPING_RULES)) {
    // Check exclusions first
    if (rule.exclude.some(ex => searchText.includes(ex))) continue;
    
    // Check required terms
    const hasRequired = rule.required.some(req => searchText.includes(req));
    if (!hasRequired) continue;
    
    // Calculate confidence based on context matches
    const contextMatches = rule.context.filter(ctx => searchText.includes(ctx));
    const confidence = 0.7 + (contextMatches.length * 0.1);  // 0.7 - 1.0
    
    matches.push({
      keyword,
      confidence: Math.min(confidence, 1.0),
      matchSource: 'heuristic'
    });
  }
  
  return matches;
}
```

### Import Summary Metrics

```typescript
interface ImportSummary {
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  error_rows: number;
  companies_with_keywords: number;
  keyword_distribution: Record<string, number>;
  data_quality_summary: {
    with_funding: number;
    with_employees: number;
    with_description: number;
    avg_quality_score: number;
  };
}
```

---

## 9. Maturity Scoring Framework

### 0-2 Scoring Scale

```typescript
type MaturityScore = 0 | 1 | 2;

const SCORE_DEFINITIONS = {
  0: { label: 'Severe Challenge', color: 'red' },
  1: { label: 'Manageable Challenge', color: 'amber' },
  2: { label: 'No Major Challenge', color: 'emerald' }
};
```

### Score Calculation Rules

```typescript
// Investment Score (from total funding)
function calculateInvestmentScore(totalFundingEur: number): MaturityScore {
  if (totalFundingEur >= 1_000_000_000) return 2;  // €1B+
  if (totalFundingEur >= 100_000_000) return 1;    // €100M+
  return 0;
}

// Employees Score (from aggregated employee count)
function calculateEmployeesScore(totalEmployees: number): MaturityScore {
  if (totalEmployees >= 10_000) return 2;
  if (totalEmployees >= 1_000) return 1;
  return 0;
}

// TRL Score (from document mentions)
function calculateTrlScore(avgTrl: number | null): MaturityScore {
  if (!avgTrl) return 0;
  if (avgTrl >= 7) return 2;  // TRL 7-9: Production ready
  if (avgTrl >= 4) return 1;  // TRL 4-6: Prototype/pilot
  return 0;                    // TRL 1-3: Research phase
}

// Patents Score (from EPO data)
function calculatePatentsScore(totalPatents: number): MaturityScore {
  if (totalPatents >= 100) return 2;
  if (totalPatents >= 10) return 1;
  return 0;
}

// Visibility Score (from document/web mentions)
function calculateVisibilityScore(mentionCount: number): MaturityScore {
  if (mentionCount >= 50) return 2;
  if (mentionCount >= 10) return 1;
  return 0;
}

// Composite Score (average of three signals)
function calculateCompositeScore(tech: Technology): number {
  return (
    tech.investmentScore + 
    tech.employeesScore + 
    tech.trlScore
  ) / 3;  // Returns 0.0 - 2.0
}
```

### Score Display Logic

```typescript
function getScoreColor(score: MaturityScore): string {
  switch (score) {
    case 2: return 'bg-emerald-500/20 text-emerald-500';
    case 1: return 'bg-amber-500/20 text-amber-500';
    case 0: return 'bg-red-500/20 text-red-500';
  }
}

function getCompositeLabel(score: number): { label: string; color: string } {
  if (score >= 1.5) return { label: 'Strong', color: 'emerald' };
  if (score >= 0.5) return { label: 'Moderate', color: 'amber' };
  return { label: 'Challenging', color: 'red' };
}
```

---

## 10. Database Schema Reference

### Core Tables

```sql
-- Technology Taxonomy
technology_keywords (
  id, keyword, display_name, source, description,
  parent_keyword_id, aliases[], 
  dealroom_tags[], dealroom_industries[], dealroom_sub_industries[],
  is_active, created_at, updated_at
)

-- Aggregated Technology Metrics
technologies (
  id, keyword_id, name, description,
  
  -- Scores (0-2 scale)
  investment_score, employees_score, trl_score, 
  patents_score, visibility_score, eu_alignment_score,
  composite_score,
  
  -- Raw metrics
  dealroom_company_count, total_funding_eur, total_employees, total_patents,
  document_mention_count, policy_mention_count, news_mention_count,
  avg_trl_mentioned,
  
  -- H11 scores
  avg_semantic_score, network_centrality, corpus_rarity_score,
  weighted_frequency_score, avg_relevance_score, document_diversity,
  
  -- Display
  key_players[], recent_news, trend,
  last_updated, created_at
)

-- Document Processing
cei_documents (id, filename, file_type, storage_path, source, ...)
document_technology_mentions (id, document_id, keyword_id, mention_context, ...)
pdf_processing_queue (id, url, source_type, status, ...)

-- Web Scraping
scraped_web_content (id, url, website, page_type, markdown_content, ...)
web_technology_mentions (id, keyword_id, source_url, ...)

-- Crunchbase
crunchbase_companies (id, organization_name, total_funding_usd, patents_count, ...)
crunchbase_keyword_mapping (id, company_id, keyword_id, match_confidence, ...)
crunchbase_import_logs (id, filename, status, imported_rows, ...)

-- Relationships
technology_cooccurrences (id, keyword_id_a, keyword_id_b, cooccurrence_count, ...)
company_technology_evidence (id, company_id, keyword_id, source_type, ...)
```

### Views

```sql
-- Unified technology intelligence view
CREATE VIEW technology_intelligence AS
SELECT 
  t.*,
  tk.display_name,
  tk.description as keyword_description,
  ARRAY_AGG(DISTINCT dc.name) as company_names,
  jsonb_build_object(
    'low', COUNT(*) FILTER (WHERE dtm.trl_mentioned < 4),
    'mid', COUNT(*) FILTER (WHERE dtm.trl_mentioned BETWEEN 4 AND 6),
    'high', COUNT(*) FILTER (WHERE dtm.trl_mentioned > 6)
  ) as trl_distribution,
  jsonb_build_object(
    'document', COUNT(DISTINCT dtm.id),
    'web', COUNT(DISTINCT wtm.id),
    'company', COUNT(DISTINCT cte.id)
  ) as evidence_by_source
FROM technologies t
JOIN technology_keywords tk ON t.keyword_id = tk.id
LEFT JOIN document_technology_mentions dtm ON dtm.keyword_id = tk.id
LEFT JOIN web_technology_mentions wtm ON wtm.keyword_id = tk.id
LEFT JOIN company_technology_evidence cte ON cte.keyword_id = tk.id
GROUP BY t.id, tk.id;
```

### Key Functions

```sql
-- Refresh all technology scores
refresh_technology_intelligence() -> void

-- Refresh single technology
refresh_technology_scores(tech_keyword_id UUID) -> void

-- Aggregate company signals to keywords
aggregate_crunchbase_signals() -> TABLE(...)

-- Aggregate patent counts
aggregate_patent_scores() -> TABLE(...)

-- Populate co-occurrences from company overlaps
populate_cooccurrences_from_companies() -> TABLE(...)

-- Calculate network centrality (PageRank)
calculate_network_centrality() -> void

-- Calculate corpus rarity (TF-IDF)
calculate_tfidf_scores() -> void
```

---

## Appendix: Edge Functions Reference

| Function | Purpose | Trigger |
|----------|---------|---------|
| `parse-document` | AI extraction from PDF/PPTX | Manual/queue |
| `process-pdf` | Download + parse PDF from URL | Queue processor |
| `firecrawl-scrape` | Scrape single URL | Manual |
| `firecrawl-map` | Map website URLs | Manual |
| `website-scrape` | Scrape CEI/EU websites | Scheduled |
| `epo-patent-lookup` | Search EPO for patents | Manual |
| `ai-tag-mapper` | Map keywords to taxonomy | Manual |
| `export-data` | Generate CSV/PDF exports | User action |

---

*End of Document*
