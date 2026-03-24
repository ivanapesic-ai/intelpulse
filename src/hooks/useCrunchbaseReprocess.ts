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
    required: ['sensor fusion', 'multi-sensor fusion', 'multi-sensor', 'sensor integration', 'perception system'],
    context: ['automotive', 'vehicle', 'autonomous', 'adas'],
    exclude: ['industrial', 'manufacturing']
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
    required: ['hd map', 'high definition map', 'hd mapping', 'precision mapping', 'mapping services', 'navigation map'],
    context: ['autonomous', 'vehicle', 'navigation'],
    exclude: []
  },
  'Vehicle to Grid': {
    required: ['v2g', 'vehicle to grid', 'vehicle-to-grid', 'bidirectional charging', 'bi-directional'],
    context: [],
    exclude: []
  },
  'Digital Twin': {
    required: ['digital twin', 'vehicle simulation', 'vehicle digital twin', 'simulation platform'],
    context: ['automotive', 'vehicle'],
    exclude: []
  },
  'Semiconductor': {
    required: ['automotive chip', 'automotive semiconductor', 'vehicle processor'],
    context: ['automotive', 'vehicle'],
    exclude: []
  },
  // NEW: Zero-funding keywords with expanded matching
  'AV Camera': {
    required: ['camera', 'computer vision', 'vision system', 'imaging sensor'],
    context: ['automotive', 'vehicle', 'autonomous', 'adas', 'driving', 'perception'],
    exclude: ['phone', 'smartphone', 'consumer', 'security camera', 'cctv']
  },
  'AV Simulation': {
    required: ['simulation', '3d technology', 'virtual testing', 'driving simulation', 'av simulation'],
    context: ['autonomous', 'vehicle', 'automotive', 'driving'],
    exclude: ['game', 'entertainment', 'flight']
  },
  'AV Labeling': {
    required: ['labeling', 'annotation', 'training data', 'data labeling', 'machine learning data'],
    context: ['autonomous', 'driving', 'vehicle', 'ai', 'perception'],
    exclude: ['food', 'retail', 'medical']
  },
  'Automotive Ethernet': {
    required: ['automotive ethernet', 'in-vehicle network', 'vehicle networking', 'automotive network'],
    context: ['automotive', 'vehicle'],
    exclude: []
  },
  'AUTOSAR': {
    required: ['autosar', 'automotive software', 'ecu software', 'embedded automotive', 'vehicle software platform'],
    context: ['automotive', 'vehicle', 'ecu'],
    exclude: []
  },
  'EV Motor': {
    required: ['electric motor', 'e-motor', 'electric drive', 'electric powertrain', 'traction motor'],
    context: ['vehicle', 'automotive', 'ev', 'electric'],
    exclude: ['appliance', 'fan', 'pump', 'industrial motor']
  },
  'Bidirectional Charging': {
    required: ['bidirectional', 'bi-directional', 'v2g', 'v2h', 'v2l', 'vehicle-to-grid', 'two-way charging'],
    context: ['charging', 'ev', 'vehicle', 'grid'],
    exclude: []
  },
  // Additional active keywords
  'Vehicle as Software': {
    required: ['vehicle as software', 'software-defined vehicle', 'vehicle software', 'automotive software platform', 'vehicle os'],
    context: [],
    exclude: []
  },
  'Smart Logistics': {
    required: ['smart logistics', 'logistics automation', 'intelligent logistics', 'automated logistics'],
    context: ['vehicle', 'automotive', 'fleet', 'delivery', 'transport'],
    exclude: []
  },
  'Battery Management Systems': {
    required: ['battery management', 'bms', 'battery system', 'battery monitoring', 'battery analytics'],
    context: ['vehicle', 'automotive', 'electric', 'ev'],
    exclude: ['phone', 'laptop', 'consumer electronics']
  },
  'Smart Recharging': {
    required: ['smart charging', 'intelligent charging', 'smart recharging', 'managed charging', 'optimized charging'],
    context: ['ev', 'vehicle', 'electric'],
    exclude: []
  },
  'Energy Management Systems': {
    required: ['energy management', 'ems', 'energy optimization', 'power management'],
    context: ['vehicle', 'ev', 'grid', 'charging', 'automotive', 'battery'],
    exclude: ['building only', 'hvac only']
  },
  'Autonomous Mobile Robots': {
    required: ['autonomous mobile robot', 'amr', 'mobile robot', 'delivery robot', 'autonomous robot'],
    context: ['logistics', 'warehouse', 'delivery', 'transport'],
    exclude: ['surgical', 'medical']
  },
  'Supply Chain Management': {
    required: ['supply chain management', 'supply chain platform', 'supply chain software'],
    context: ['automotive', 'vehicle', 'manufacturing', 'logistics'],
    exclude: []
  },
  'EV Battery': {
    required: ['ev battery', 'electric vehicle battery', 'battery cell', 'battery pack', 'solid state battery', 'lithium', 'li-ion'],
    context: ['vehicle', 'automotive', 'ev', 'electric', 'mobility'],
    exclude: ['phone', 'laptop', 'consumer']
  },
  'EV Services': {
    required: ['ev service', 'electric vehicle service', 'ev maintenance', 'ev fleet service'],
    context: ['vehicle', 'ev', 'electric'],
    exclude: []
  },
  'AV Radar': {
    required: ['radar', 'automotive radar', 'millimeter wave', 'mmwave'],
    context: ['automotive', 'vehicle', 'autonomous', 'adas', 'driving'],
    exclude: ['weather', 'aviation', 'marine']
  },
  'AV Software': {
    required: ['autonomous software', 'av software', 'self-driving software', 'autonomous driving platform', 'adas software', 'perception software'],
    context: ['vehicle', 'automotive', 'driving'],
    exclude: []
  },
  'Self-driving vehicles': {
    required: ['self-driving', 'self driving', 'driverless', 'robo-taxi', 'robotaxi', 'unmanned vehicle'],
    context: [],
    exclude: ['drone', 'uav', 'marine']
  },
  'Micro Grid': {
    required: ['microgrid', 'micro grid', 'micro-grid', 'distributed energy'],
    context: ['ev', 'vehicle', 'charging', 'renewable'],
    exclude: []
  },
  'Teledriving': {
    required: ['teledriving', 'tele-driving', 'remote driving', 'teleoperation', 'tele-operation'],
    context: ['vehicle', 'automotive'],
    exclude: []
  },
  'Logistics Tech': {
    required: ['logistics tech', 'logistics technology', 'freight tech', 'transportation management'],
    context: ['vehicle', 'fleet', 'delivery', 'truck'],
    exclude: []
  },
  'Supply Chain': {
    required: ['supply chain', 'procurement platform'],
    context: ['automotive', 'vehicle', 'manufacturing'],
    exclude: ['food', 'retail', 'fashion']
  },
  'Sustainable Mobility': {
    required: ['sustainable mobility', 'green mobility', 'clean transport', 'sustainable transport', 'green transport'],
    context: [],
    exclude: []
  },
  'Vehicle to Everything': {
    required: ['v2x', 'vehicle to everything', 'vehicle-to-everything', 'v2v', 'v2i', 'c-v2x'],
    context: [],
    exclude: []
  },
  'Electric Mobility': {
    required: ['electric mobility', 'e-mobility', 'emobility', 'electromobility'],
    context: [],
    exclude: []
  },
  'EV Charging': {
    required: ['ev charging', 'electric vehicle charging', 'charge point', 'charging station', 'charging network'],
    context: [],
    exclude: ['phone', 'mobile']
  },
  'Smart Grid': {
    required: ['smart grid', 'grid intelligence', 'grid management', 'intelligent grid'],
    context: ['energy', 'ev', 'vehicle', 'charging', 'power'],
    exclude: []
  },
  'Storage Battery Systems': {
    required: ['battery storage', 'energy storage', 'stationary storage', 'battery energy storage'],
    context: ['ev', 'vehicle', 'grid', 'renewable'],
    exclude: []
  },
  'Smart Cities': {
    required: ['smart city', 'smart cities', 'urban mobility', 'intelligent transport'],
    context: [],
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
      // Fetch ALL companies using pagination to bypass 1000-row limit
      const companies: any[] = [];
      const PAGE_SIZE = 1000;
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('crunchbase_companies')
          .select('id, organization_name, description, full_description, industries, industry_groups, technology_keywords, total_funding_usd, top_5_investors, lead_investors, founded_date')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          companies.push(...data);
          if (data.length < PAGE_SIZE) hasMore = false;
          page++;
        }
      }
      
      if (companies.length === 0) throw new Error('No companies found');
      
      // Fetch all active keywords for mapping
      const { data: keywords, error: keywordsError } = await supabase
        .from('technology_keywords')
        .select('id, display_name')
        .eq('is_active', true);
      
      if (keywordsError) throw keywordsError;
      
      // Build keyword name -> id map
      const keywordIdMap = new Map<string, string>();
      for (const kw of keywords || []) {
        keywordIdMap.set(kw.display_name.toLowerCase(), kw.id);
      }
      
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
      
      // Collect all junction table inserts
      const allMappingsToInsert: Array<{ company_id: string; keyword_id: string; match_source: string; match_confidence: number }> = [];
      
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
          
          // Collect junction table mappings for all keywords (new or existing)
          const keywordsToMap = keywordsChanged ? newKeywords : oldKeywords;
          for (const kwName of keywordsToMap) {
            const keywordId = keywordIdMap.get(kwName.toLowerCase());
            if (keywordId) {
              allMappingsToInsert.push({
                company_id: company.id,
                keyword_id: keywordId,
                match_source: 'reprocess',
                match_confidence: 85,
              });
            }
          }
          
          // Count new keywords
          for (const kw of newKeywords) {
            keywordCountsAfter[kw] = (keywordCountsAfter[kw] || 0) + 1;
          }
        }
        
        // Batch update companies
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
      
      // Now sync the junction table: delete old mappings and insert new ones
      // This ensures the junction table matches the company.technology_keywords array
      onProgress?.({
        current: companies.length,
        total: companies.length,
        currentCompany: 'Syncing keyword mappings...',
        updated,
        unchanged,
      });
      
      // Delete all existing reprocess mappings (keep original import mappings)
      await supabase
        .from('crunchbase_keyword_mapping')
        .delete()
        .eq('match_source', 'reprocess');
      
      // Insert new mappings in batches
      const MAPPING_BATCH_SIZE = 500;
      for (let i = 0; i < allMappingsToInsert.length; i += MAPPING_BATCH_SIZE) {
        const mappingBatch = allMappingsToInsert.slice(i, i + MAPPING_BATCH_SIZE);
        
        // Use upsert to handle duplicates (company_id + keyword_id)
        await supabase
          .from('crunchbase_keyword_mapping')
          .upsert(mappingBatch, { 
            onConflict: 'company_id,keyword_id',
            ignoreDuplicates: true
          });
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
      queryClient.invalidateQueries({ queryKey: ['technologies'] });
    },
  });
}
