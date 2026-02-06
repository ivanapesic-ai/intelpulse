import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ===================== CONTEXT-AWARE KEYWORD MATCHING =====================
interface KeywordMatchConfig {
  required: string[];
  context: string[];
  exclude: string[];
}

const KEYWORD_MATCHING_RULES: Record<string, KeywordMatchConfig> = {
  'Software Defined Vehicle': {
    required: ['software defined vehicle', 'vehicle software platform', 'vehicle operating system', 'automotive software platform', 'vehicle os', 'sdv', 'automotive software', 'in-vehicle software', 'vehicle software'],
    context: [],
    exclude: ['music', 'streaming', 'marketplace', 'travel']
  },
  'Autonomous Driving': {
    required: ['autonomous driving', 'autonomous vehicle', 'self-driving', 'autopilot', 'automated driving', 'driverless', 'self driving', 'av software', 'autonomous mobility'],
    context: [],
    exclude: ['pedestrian', 'glasses', 'blind', 'medical', 'robot', 'drone', 'uav', 'warehouse']
  },
  'ADAS': {
    required: ['adas', 'advanced driver assistance', 'driver assistance system', 'lane keeping', 'adaptive cruise', 'collision avoidance'],
    context: [],
    exclude: []
  },
  'LiDAR': {
    required: ['lidar', 'laser radar', '3d sensor', 'laser scanning'],
    context: ['automotive', 'vehicle', 'autonomous', 'adas', 'car', 'driving'],
    exclude: ['drone only', 'industrial only', 'agriculture', 'forestry', 'survey only']
  },
  'V2X': {
    required: ['v2x', 'vehicle to everything', 'v2v', 'v2i', 'vehicle-to-'],
    context: [],
    exclude: []
  },
  'Connected Car': {
    required: ['connected car', 'vehicle connectivity', 'automotive connectivity', 'connected vehicle', 'vehicle telematics platform', 'car connectivity'],
    context: [],
    exclude: ['music', 'streaming', 'entertainment only']
  },
  'OTA Updates': {
    required: ['ota', 'over-the-air', 'software update'],
    context: ['vehicle', 'automotive', 'ecu', 'firmware', 'car'],
    exclude: ['smartphone only', 'iot only', 'mobile app']
  },
  'Vehicle Cybersecurity': {
    required: ['vehicle cybersecurity', 'automotive cybersecurity', 'automotive security', 'car security', 'vehicle security'],
    context: [],
    exclude: []
  },
  'Electric Vehicle': {
    required: ['electric vehicle', ' ev ', 'battery electric', 'bev', 'e-vehicle', 'electric car', 'electric truck', 'electric bus'],
    context: [],
    exclude: ['marketplace', 'dealership', 'mining', 'tourism', 'chauffeur', 'e-scooter', 'scooter', 'bicycle', 'e-bike', 'aircraft', 'aerospace', 'aviation', 'boat', 'marine', 'yacht', 'motorcycle', 'motorbike']
  },
  'Sensor Fusion': {
    required: ['sensor fusion', 'multi-sensor fusion'],
    context: ['automotive', 'vehicle', 'autonomous', 'adas'],
    exclude: []
  },
  'Fleet Management': {
    required: ['fleet management', 'fleet software', 'fleet optimization', 'fleet platform'],
    context: ['vehicle', 'automotive', 'logistics', 'truck', 'commercial'],
    exclude: []
  },
  'Telematics': {
    required: ['telematics', 'vehicle telematics'],
    context: ['vehicle', 'automotive', 'car', 'fleet'],
    exclude: []
  },
  'Charging Infrastructure': {
    required: ['ev charging', 'charging infrastructure', 'charging station', 'charge point', 'charger network', 'charging network'],
    context: [],
    exclude: ['phone', 'mobile', 'battery pack only']
  },
  'Battery Management': {
    required: ['battery management', 'bms', 'battery system'],
    context: ['vehicle', 'automotive', 'electric', 'ev'],
    exclude: ['phone', 'laptop', 'consumer electronics']
  },
  'Mobility as a Service': {
    required: ['mobility as a service', 'maas', 'shared mobility', 'mobility platform'],
    context: [],
    exclude: []
  },
  'Smart City': {
    required: ['smart city', 'smart cities', 'urban mobility'],
    context: [],
    exclude: []
  },
  'Edge Computing': {
    required: ['edge computing', 'edge ai', 'edge processing'],
    context: ['automotive', 'vehicle', 'iot'],
    exclude: []
  },
  'Cloud Computing': {
    required: ['cloud platform', 'cloud infrastructure'],
    context: ['automotive', 'vehicle', 'mobility'],
    exclude: ['general cloud']
  },
  'AI/ML for Automotive': {
    required: ['automotive ai', 'vehicle ai', 'driving ai', 'perception ai'],
    context: ['vehicle', 'automotive', 'driving'],
    exclude: []
  },
  'HD Mapping': {
    required: ['hd map', 'high definition map', 'hd mapping', 'precision mapping'],
    context: ['autonomous', 'vehicle'],
    exclude: []
  },
  'Vehicle to Grid': {
    required: ['v2g', 'vehicle to grid', 'vehicle-to-grid', 'bidirectional charging'],
    context: [],
    exclude: []
  },
  'Digital Twin': {
    required: ['digital twin', 'vehicle simulation', 'vehicle digital twin'],
    context: ['automotive', 'vehicle'],
    exclude: []
  },
  'Semiconductor': {
    required: ['automotive chip', 'automotive semiconductor', 'vehicle processor'],
    context: ['automotive', 'vehicle'],
    exclude: []
  }
};

function matchKeywordWithContext(text: string, config: KeywordMatchConfig): boolean {
  const lowerText = text.toLowerCase();
  
  const hasRequired = config.required.some(term => lowerText.includes(term.toLowerCase()));
  if (!hasRequired) return false;
  
  const hasExclude = config.exclude.some(term => lowerText.includes(term.toLowerCase()));
  if (hasExclude) return false;
  
  if (config.context.length > 0) {
    const hasContext = config.context.some(term => lowerText.includes(term.toLowerCase()));
    if (!hasContext) return false;
  }
  
  return true;
}

function matchKeywords(description: string, fullDescription: string, industries: string[]): string[] {
  const combinedText = [description, fullDescription, ...industries].join(' ');
  const matchedKeywords: string[] = [];
  
  for (const [keyword, config] of Object.entries(KEYWORD_MATCHING_RULES)) {
    if (matchKeywordWithContext(combinedText, config)) {
      matchedKeywords.push(keyword);
    }
  }
  
  return matchedKeywords;
}

function calculateDataQualityScore(
  description: string | null,
  fullDescription: string | null,
  totalFunding: number,
  investors: string[],
  foundedDate: string | null,
  keywords: string[]
): number {
  let score = 0;
  if (description || fullDescription) score += 20;
  if (totalFunding > 0) score += 20;
  if (investors.length > 0) score += 20;
  if (foundedDate) score += 10;
  if (keywords.length > 0) score += 30;
  return score;
}

export interface ReprocessProgress {
  current: number;
  total: number;
  currentCompany: string;
  updated: number;
  unchanged: number;
}

export interface ReprocessSummary {
  totalProcessed: number;
  updated: number;
  unchanged: number;
  keywordChanges: Record<string, { before: number; after: number }>;
}

export function useCrunchbaseReprocess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      onProgress,
    }: {
      onProgress?: (progress: ReprocessProgress) => void;
    }): Promise<ReprocessSummary> => {
      // Fetch all companies
      const { data: companies, error } = await supabase
        .from('crunchbase_companies')
        .select('id, organization_name, description, full_description, industries, industry_groups, technology_keywords, total_funding_usd, top_5_investors, lead_investors, founded_date');
      
      if (error) throw error;
      if (!companies) throw new Error('No companies found');
      
      let updated = 0;
      let unchanged = 0;
      const keywordCountsBefore: Record<string, number> = {};
      const keywordCountsAfter: Record<string, number> = {};
      
      // Count keywords before
      for (const company of companies) {
        for (const kw of company.technology_keywords || []) {
          keywordCountsBefore[kw] = (keywordCountsBefore[kw] || 0) + 1;
        }
      }
      
      // Process each company
      const BATCH_SIZE = 50;
      for (let i = 0; i < companies.length; i += BATCH_SIZE) {
        const batch = companies.slice(i, i + BATCH_SIZE);
        
        const updates: Array<{ id: string; technology_keywords: string[]; data_quality_score: number }> = [];
        
        for (const company of batch) {
          onProgress?.({
            current: i + batch.indexOf(company) + 1,
            total: companies.length,
            currentCompany: company.organization_name,
            updated,
            unchanged,
          });
          
          const newKeywords = matchKeywords(
            company.description || '',
            company.full_description || '',
            [...(company.industries || []), ...(company.industry_groups || [])]
          );
          
          const oldKeywords = company.technology_keywords || [];
          const keywordsChanged = 
            newKeywords.length !== oldKeywords.length ||
            !newKeywords.every(k => oldKeywords.includes(k));
          
          if (keywordsChanged) {
            const newScore = calculateDataQualityScore(
              company.description,
              company.full_description,
              company.total_funding_usd || 0,
              [...(company.top_5_investors || []), ...(company.lead_investors || [])],
              company.founded_date,
              newKeywords
            );
            
            updates.push({
              id: company.id,
              technology_keywords: newKeywords,
              data_quality_score: newScore,
            });
            updated++;
          } else {
            unchanged++;
          }
          
          // Count new keywords
          for (const kw of newKeywords) {
            keywordCountsAfter[kw] = (keywordCountsAfter[kw] || 0) + 1;
          }
        }
        
        // Batch update
        if (updates.length > 0) {
          for (const update of updates) {
            await supabase
              .from('crunchbase_companies')
              .update({
                technology_keywords: update.technology_keywords,
                data_quality_score: update.data_quality_score,
              })
              .eq('id', update.id);
          }
        }
      }
      
      // Build keyword changes summary
      const allKeywords = new Set([...Object.keys(keywordCountsBefore), ...Object.keys(keywordCountsAfter)]);
      const keywordChanges: Record<string, { before: number; after: number }> = {};
      
      for (const kw of allKeywords) {
        const before = keywordCountsBefore[kw] || 0;
        const after = keywordCountsAfter[kw] || 0;
        if (before !== after) {
          keywordChanges[kw] = { before, after };
        }
      }
      
      return {
        totalProcessed: companies.length,
        updated,
        unchanged,
        keywordChanges,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crunchbase-companies'] });
      queryClient.invalidateQueries({ queryKey: ['crunchbase-stats'] });
      queryClient.invalidateQueries({ queryKey: ['technology-region-stats'] });
    },
  });
}
