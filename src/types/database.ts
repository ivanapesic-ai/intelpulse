// New data types based on January 22, 2025 meeting notes
// Replaces the old Cloud/Edge/IoT/AI-ML quadrant system with keyword-based taxonomy

export type KeywordSource = 'cei_sphere' | 'dealroom' | 'manual';

export interface TechnologyKeyword {
  id: string;
  keyword: string;
  source: KeywordSource;
  displayName: string;
  description?: string;
  parentKeywordId?: string;
  aliases?: string[];
  dealroomTags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// New 0-2 scoring system from meeting notes
// 0 = Severe Challenge
// 1 = Manageable Challenge  
// 2 = No Major Challenge
export type MaturityScore = 0 | 1 | 2;

export type TrendDirection = 'up' | 'down' | 'stable';

export interface Technology {
  id: string;
  keywordId: string;
  name: string;
  description: string;
  
  // 4-Dimension Scoring System (per proposal)
  investmentScore: MaturityScore;   // Market: Dealroom funding signals
  employeesScore: MaturityScore;    // Market: Dealroom employee signals
  trlScore: MaturityScore;          // TRL: Average TRL from document mentions
  euAlignmentScore: MaturityScore;  // EU Alignment: Policy reference count
  visibilityScore: MaturityScore;   // Visibility: Document/web mention count
  compositeScore: number;           // Average of (Investment + Employees + TRL + EU Alignment) / 4
  
  // Supporting metrics
  avgTrlMentioned?: number;         // Raw average TRL from mentions
  policyMentionCount: number;       // Raw count of policy references
  
  // H11 Hybrid Scoring (KeyBERT semantic + TextRank network + TF-IDF rarity + Position structural)
  avgSemanticScore?: number;          // KeyBERT: Avg cosine similarity between tech and doc context
  networkCentrality?: number;         // TextRank: PageRank-style centrality from co-occurrences
  corpusRarityScore?: number;         // TF-IDF: Inverse document frequency (rarer = higher)
  weightedFrequencyScore?: number;    // SUM(position_weight * relevance_score)
  avgRelevanceScore?: number;         // Average relevance across all mentions
  documentDiversity?: number;         // Count of unique source documents
  
  trend: TrendDirection;
  keyPlayers: string[];
  totalPatents: number;
  totalFundingEur: number;
  totalEmployees: number;
  
  // Source attribution
  dealroomCompanyCount: number;
  documentMentionCount: number;
  
  lastUpdated: string;
  createdAt: string;
}

export interface DealroomCompany {
  id: string;
  dealroomId: string;
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  hqCountry?: string;
  hqCity?: string;
  foundedYear?: number;
  employeesCount: number;
  totalFundingEur: number;
  valuationEur?: number;
  lastFundingDate?: string;
  lastFundingAmountEur?: number;
  growthStage?: string;
  investors: string[];
  industries: string[];
  patentsCount: number;
  newsItems?: Array<{ title: string; date: string; url: string }>;
  syncedAt: string;
}

export interface CEIDocument {
  id: string;
  filename: string;
  fileType: 'pdf' | 'pptx' | 'docx';
  storagePath: string;
  source: 'teams' | 'cei_sphere_website' | 'eucloudedgeiot' | 'manual';
  title?: string;
  uploadDate: string;
  parseStatus: 'pending' | 'parsing' | 'completed' | 'failed';
  parsedContent?: {
    summary?: string;
    mentionsCount?: number;
    extractedAt?: string;
  };
  pageCount?: number;
  fileSizeBytes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMention {
  id: string;
  documentId: string;
  keywordId: string;
  mentionContext?: string;
  trlMentioned?: number;
  policyReference?: string;
  confidenceScore: number;
  pageNumber?: number;
  createdAt: string;
}

export interface DealroomSyncLog {
  id: string;
  syncType: string;
  keywordsSearched: string[];
  recordsFetched: number;
  recordsCreated: number;
  recordsUpdated: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

// Evidence linking document mentions to companies
export interface CompanyTechnologyEvidence {
  id: string;
  companyId: string;
  keywordId: string;
  sourceType: 'document' | 'web' | 'dealroom';
  sourceReference: string;
  trlMentioned?: number;
  policyReference?: string;
  context?: string;
  confidenceScore: number;
  createdAt: string;
}

// Materialized view for integrated technology intelligence
export interface TechnologyIntelligence {
  id: string;
  keywordId: string;
  name: string;
  displayName: string;
  keywordDescription?: string;
  // Dealroom signals
  dealroomCompanyCount: number;
  totalFundingEur: number;
  totalEmployees: number;
  totalPatents: number;
  keyPlayers: string[];
  // Document signals
  documentMentionCount: number;
  avgTrlMentioned?: number;
  policyMentionCount: number;
  documentDiversity: number;
  // H11 scores
  compositeScore: number;
  avgSemanticScore?: number;
  networkCentrality?: number;
  corpusRarityScore?: number;
  avgRelevanceScore?: number;
  weightedFrequencyScore?: number;
  // Component scores
  visibilityScore: number;
  trlScore: number;
  euAlignmentScore: number;
  investmentScore?: number;
  employeesScore?: number;
  // Aggregated data
  companyNames: string[];
  trlDistribution: { low: number; mid: number; high: number; unknown: number };
  evidenceBySource: { document: number; web: number; dealroom: number };
  lastUpdated: string;
  trend: TrendDirection;
}

// Score color/label helpers
export const MATURITY_SCORE_CONFIG: Record<MaturityScore, { label: string; color: string; bgColor: string; description: string }> = {
  0: { 
    label: 'Severe Challenge', 
    color: 'text-red-500', 
    bgColor: 'bg-red-500/20',
    description: 'Significant barriers to adoption or maturity'
  },
  1: { 
    label: 'Manageable Challenge', 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/20',
    description: 'Some challenges but progressing'
  },
  2: { 
    label: 'No Major Challenge', 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500/20',
    description: 'Well-established with strong fundamentals'
  },
};

export const KEYWORD_SOURCE_CONFIG: Record<KeywordSource, { label: string; color: string }> = {
  cei_sphere: { label: 'CEI-SPHERE', color: 'text-blue-400' },
  dealroom: { label: 'Dealroom', color: 'text-purple-400' },
  manual: { label: 'Manual', color: 'text-gray-400' },
};

// Utility functions
export function formatFundingEur(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `€${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `€${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `€${(amount / 1_000).toFixed(0)}K`;
  }
  return `€${amount}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return String(num);
}

export function getCompositeScoreLabel(score: number): { label: string; color: string } {
  if (score >= 1.5) return { label: 'Strong', color: 'text-emerald-500' };
  if (score >= 0.5) return { label: 'Moderate', color: 'text-amber-500' };
  return { label: 'Challenging', color: 'text-red-500' };
}
