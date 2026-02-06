import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    context: [], // Removed context requirement - these terms are specific enough
    exclude: ['music', 'streaming', 'marketplace', 'travel']
  },
  'Autonomous Driving': {
    required: ['autonomous driving', 'autonomous vehicle', 'self-driving', 'autopilot', 'automated driving', 'driverless', 'self driving', 'av software', 'autonomous mobility'],
    context: [], // Terms are specific enough
    exclude: ['pedestrian', 'glasses', 'blind', 'medical', 'robot', 'drone', 'uav', 'warehouse']
  },
  'ADAS': {
    required: ['adas', 'advanced driver assistance', 'driver assistance system', 'lane keeping', 'adaptive cruise', 'collision avoidance'],
    context: ['automotive', 'vehicle'],
    exclude: []
  },
  'LiDAR': {
    required: ['lidar', 'laser radar', '3d sensor', 'laser scanning'],
    context: ['automotive', 'vehicle', 'autonomous', 'adas'],
    exclude: ['drone only', 'industrial only']
  },
  'V2X': {
    required: ['v2x', 'vehicle to everything', 'v2v', 'v2i', 'vehicle-to-'],
    context: [],
    exclude: []
  },
  'Connected Car': {
    required: ['connected car', 'vehicle connectivity', 'automotive connectivity', 'connected vehicle', 'vehicle telematics platform', 'car connectivity'],
    context: [], // Terms are specific enough
    exclude: ['music', 'streaming', 'entertainment only']
  },
  'OTA Updates': {
    required: ['ota', 'over-the-air', 'software update'],
    context: ['vehicle', 'automotive', 'ecu', 'firmware'],
    exclude: ['smartphone only', 'iot only']
  },
  'Vehicle Cybersecurity': {
    required: ['vehicle cybersecurity', 'automotive cybersecurity', 'automotive security'],
    context: [],
    exclude: []
  },
  'Electric Vehicle': {
    required: ['electric vehicle', ' ev ', 'battery electric', 'bev', 'e-vehicle'],
    context: [], // No context required - EV industry is broad
    exclude: ['marketplace', 'dealership', 'mining', 'tourism', 'chauffeur', 'e-scooter', 'scooter', 'bicycle', 'e-bike', 'aircraft', 'aerospace', 'aviation', 'boat', 'marine', 'yacht']
  },
  'Sensor Fusion': {
    required: ['sensor fusion', 'multi-sensor fusion'],
    context: ['automotive', 'vehicle', 'autonomous', 'adas'],
    exclude: []
  },
  'Fleet Management': {
    required: ['fleet management', 'fleet software', 'fleet optimization', 'fleet platform'],
    context: ['vehicle', 'automotive', 'logistics'],
    exclude: []
  },
  'Telematics': {
    required: ['telematics', 'vehicle telematics'],
    context: ['vehicle', 'automotive'],
    exclude: []
  },
  'Charging Infrastructure': {
    required: ['ev charging', 'charging infrastructure', 'charging station', 'charge point'],
    context: ['electric vehicle', 'ev', 'electric'],
    exclude: []
  },
  'Battery Management': {
    required: ['battery management', 'bms', 'battery system'],
    context: ['vehicle', 'automotive', 'electric'],
    exclude: []
  },
  'Mobility as a Service': {
    required: ['mobility as a service', 'maas', 'shared mobility'],
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
  
  // 1. Check required terms (at least one must match)
  const hasRequired = config.required.some(term => lowerText.includes(term.toLowerCase()));
  if (!hasRequired) return false;
  
  // 2. Check exclude terms (none should match)
  const hasExclude = config.exclude.some(term => lowerText.includes(term.toLowerCase()));
  if (hasExclude) return false;
  
  // 3. Check context terms if specified (at least one should match)
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

// ===================== CSV PARSING =====================
interface CrunchbaseRow {
  organization_name: string;
  crunchbase_url: string;
  website?: string;
  description?: string;
  full_description?: string;
  hq_location?: string;
  hq_country?: string;
  founded_date?: string;
  operating_status?: string;
  industries: string[];
  industry_groups: string[];
  total_funding_usd: number;
  last_funding_date?: string;
  last_funding_type?: string;
  funding_rounds_count: number;
  top_5_investors: string[];
  lead_investors: string[];
  investor_count: number;
  number_of_employees?: string;
  number_of_articles: number;
  patents_count: number;
  technology_keywords: string[];
  data_quality_score: number;
}

// Column mapping from Crunchbase CSV headers
const COLUMN_MAP: Record<string, string> = {
  'Organization Name': 'organization_name',
  'Organization Name URL': 'crunchbase_url',
  'Website': 'website',
  'Description': 'description',
  'Full Description': 'full_description',
  'Headquarters Location': 'hq_location',
  'Founded Date': 'founded_date',
  'Operating Status': 'operating_status',
  'Industries': 'industries',
  'Industry Groups': 'industry_groups',
  'Total Funding Amount (in USD)': 'total_funding_usd',
  'Last Funding Date': 'last_funding_date',
  'Last Funding Type': 'last_funding_type',
  'Number of Funding Rounds': 'funding_rounds_count',
  'Top 5 Investors': 'top_5_investors',
  'Lead Investors': 'lead_investors',
  'Number of Investors': 'investor_count',
  'Number of Employees': 'number_of_employees',
  'Number of Articles': 'number_of_articles',
  'Patents Count': 'patents_count',
};

function parseFundingAmount(value: string | undefined): number {
  if (!value) return 0;
  
  // Remove $ and commas
  const cleaned = value.replace(/[$,]/g, '').trim();
  
  // Handle shorthand notations (150M, 1.2B, etc.)
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const multiplier = match[2]?.toUpperCase();
    
    if (multiplier === 'K') return Math.round(num * 1000);
    if (multiplier === 'M') return Math.round(num * 1000000);
    if (multiplier === 'B') return Math.round(num * 1000000000);
    return Math.round(num);
  }
  
  return parseInt(cleaned) || 0;
}

function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  
  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  
  // Handle MM/DD/YYYY
  const mmddyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    return `${mmddyyyy[3]}-${mmddyyyy[1].padStart(2, '0')}-${mmddyyyy[2].padStart(2, '0')}`;
  }
  
  // Try Date parsing
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return null;
}

function extractCountry(location: string | undefined): string | null {
  if (!location) return null;
  
  // Split by comma and take the last part
  const parts = location.split(',').map(p => p.trim());
  return parts[parts.length - 1] || null;
}

function parseArrayField(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function calculateDataQualityScore(row: CrunchbaseRow): number {
  let score = 0;
  
  if (row.description || row.full_description) score += 20;
  if (row.total_funding_usd > 0) score += 20;
  if (row.top_5_investors.length > 0 || row.lead_investors.length > 0) score += 20;
  if (row.founded_date) score += 10;
  if (row.technology_keywords.length > 0) score += 30;
  
  return score;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current); // Add last field
  return result;
}

export function parseCSV(content: string, filename: string): {
  rows: CrunchbaseRow[];
  errors: Array<{ row: number; error: string }>;
  headers: string[];
} {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }
  
  const headers = parseCSVLine(lines[0]);
  
  // Validate headers
  const requiredHeaders = ['Organization Name'];
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }
  
  const rows: CrunchbaseRow[] = [];
  const errors: Array<{ row: number; error: string }> = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const rawRow: Record<string, string> = {};
      
      headers.forEach((header, idx) => {
        const mappedKey = COLUMN_MAP[header] || header.toLowerCase().replace(/\s+/g, '_');
        rawRow[mappedKey] = values[idx] || '';
      });
      
      const industries = parseArrayField(rawRow.industries);
      const industryGroups = parseArrayField(rawRow.industry_groups);
      
      const row: CrunchbaseRow = {
        organization_name: rawRow.organization_name?.trim() || '',
        crunchbase_url: rawRow.crunchbase_url?.trim() || '',
        website: rawRow.website?.trim() || undefined,
        description: rawRow.description?.trim() || undefined,
        full_description: rawRow.full_description?.trim() || undefined,
        hq_location: rawRow.hq_location?.trim() || undefined,
        hq_country: extractCountry(rawRow.hq_location),
        founded_date: parseDate(rawRow.founded_date) || undefined,
        operating_status: rawRow.operating_status?.trim() || undefined,
        industries,
        industry_groups: industryGroups,
        total_funding_usd: parseFundingAmount(rawRow.total_funding_usd),
        last_funding_date: parseDate(rawRow.last_funding_date) || undefined,
        last_funding_type: rawRow.last_funding_type?.trim() || undefined,
        funding_rounds_count: parseInt(rawRow.funding_rounds_count) || 0,
        top_5_investors: parseArrayField(rawRow.top_5_investors),
        lead_investors: parseArrayField(rawRow.lead_investors),
        investor_count: parseInt(rawRow.investor_count) || 0,
        number_of_employees: rawRow.number_of_employees?.trim() || undefined,
        number_of_articles: parseInt(rawRow.number_of_articles) || 0,
        patents_count: parseInt(rawRow.patents_count) || 0,
        technology_keywords: [],
        data_quality_score: 0,
      };
      
      // Skip rows without organization name
      if (!row.organization_name) {
        errors.push({ row: i + 1, error: 'Missing organization name' });
        continue;
      }
      
      // Match keywords
      row.technology_keywords = matchKeywords(
        row.description || '',
        row.full_description || '',
        [...industries, ...industryGroups]
      );
      
      // Calculate data quality
      row.data_quality_score = calculateDataQualityScore(row);
      
      rows.push(row);
    } catch (err) {
      errors.push({ row: i + 1, error: err instanceof Error ? err.message : 'Parse error' });
    }
  }
  
  return { rows, errors, headers };
}

// ===================== DATABASE OPERATIONS =====================
export interface ImportProgress {
  current: number;
  total: number;
  currentCompany: string;
  imported: number;
  skipped: number;
  errors: number;
}

export interface ImportSummary {
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  companiesWithKeywords: number;
  keywordDistribution: Record<string, number>;
  dataQualitySummary: { high: number; medium: number; low: number };
  totalFunding: number;
  uniqueInvestors: number;
  errors: Array<{ row: number; error: string }>;
}

export function useCrunchbaseImport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      rows,
      filename,
      onProgress,
    }: {
      rows: CrunchbaseRow[];
      filename: string;
      onProgress?: (progress: ImportProgress) => void;
    }): Promise<ImportSummary> => {
      const keywordDistribution: Record<string, number> = {};
      const allInvestors = new Set<string>();
      let imported = 0;
      let skipped = 0;
      let errorCount = 0;
      let totalFunding = 0;
      const importErrors: Array<{ row: number; error: string }> = [];
      
      // Create import log
      const { data: importLog, error: logError } = await supabase
        .from('crunchbase_import_logs')
        .insert({
          filename,
          total_rows: rows.length,
          status: 'running',
        })
        .select()
        .single();
      
      if (logError) {
        console.error('Failed to create import log:', logError);
      }
      
      // Process in batches
      const BATCH_SIZE = 50;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        
        for (const row of batch) {
          onProgress?.({
            current: i + batch.indexOf(row) + 1,
            total: rows.length,
            currentCompany: row.organization_name,
            imported,
            skipped,
            errors: errorCount,
          });
          
          try {
            // Upsert company
            const { error } = await supabase
              .from('crunchbase_companies')
              .upsert({
                organization_name: row.organization_name,
                crunchbase_url: row.crunchbase_url,
                website: row.website,
                description: row.description,
                full_description: row.full_description,
                hq_location: row.hq_location,
                hq_country: row.hq_country,
                founded_date: row.founded_date,
                operating_status: row.operating_status,
                industries: row.industries,
                industry_groups: row.industry_groups,
                total_funding_usd: row.total_funding_usd,
                last_funding_date: row.last_funding_date,
                last_funding_type: row.last_funding_type,
                funding_rounds_count: row.funding_rounds_count,
                top_5_investors: row.top_5_investors,
                lead_investors: row.lead_investors,
                investor_count: row.investor_count,
                number_of_employees: row.number_of_employees,
                number_of_articles: row.number_of_articles,
                patents_count: row.patents_count,
                technology_keywords: row.technology_keywords,
                data_quality_score: row.data_quality_score,
                source_export: filename,
              }, {
                onConflict: 'organization_name,crunchbase_url',
              });
            
            if (error) {
              console.error('Insert error:', error);
              errorCount++;
              importErrors.push({ row: i + batch.indexOf(row) + 2, error: error.message });
            } else {
              imported++;
              totalFunding += row.total_funding_usd;
              
              // Track keyword distribution
              for (const kw of row.technology_keywords) {
                keywordDistribution[kw] = (keywordDistribution[kw] || 0) + 1;
              }
              
              // Track unique investors
              for (const inv of [...row.top_5_investors, ...row.lead_investors]) {
                allInvestors.add(inv);
              }
            }
          } catch (err) {
            errorCount++;
            importErrors.push({
              row: i + batch.indexOf(row) + 2,
              error: err instanceof Error ? err.message : 'Unknown error'
            });
          }
        }
      }
      
      // Calculate data quality summary
      const dataQualitySummary = {
        high: rows.filter(r => r.data_quality_score >= 80).length,
        medium: rows.filter(r => r.data_quality_score >= 50 && r.data_quality_score < 80).length,
        low: rows.filter(r => r.data_quality_score < 50).length,
      };
      
      const companiesWithKeywords = rows.filter(r => r.technology_keywords.length > 0).length;
      
      // Update import log
      if (importLog) {
        await supabase
          .from('crunchbase_import_logs')
          .update({
            imported_rows: imported,
            skipped_rows: skipped,
            error_rows: errorCount,
            companies_with_keywords: companiesWithKeywords,
            keyword_distribution: keywordDistribution,
            data_quality_summary: dataQualitySummary,
            errors: importErrors,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', importLog.id);
      }
      
      return {
        totalRows: rows.length,
        importedRows: imported,
        skippedRows: skipped,
        errorRows: errorCount,
        companiesWithKeywords,
        keywordDistribution,
        dataQualitySummary,
        totalFunding,
        uniqueInvestors: allInvestors.size,
        errors: importErrors,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crunchbase-companies'] });
      queryClient.invalidateQueries({ queryKey: ['crunchbase-stats'] });
    },
  });
}

// ===================== QUERIES =====================
export function useCrunchbaseCompanies(options?: { limit?: number; keyword?: string }) {
  return useQuery({
    queryKey: ['crunchbase-companies', options],
    queryFn: async () => {
      let query = supabase
        .from('crunchbase_companies')
        .select('*')
        .order('total_funding_usd', { ascending: false });
      
      if (options?.keyword) {
        query = query.contains('technology_keywords', [options.keyword]);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCrunchbaseStats() {
  return useQuery({
    queryKey: ['crunchbase-stats'],
    queryFn: async () => {
      const { count, error: countError } = await supabase
        .from('crunchbase_companies')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      const { data: companies, error } = await supabase
        .from('crunchbase_companies')
        .select('total_funding_usd, technology_keywords, data_quality_score');
      
      if (error) throw error;
      
      const totalFunding = companies?.reduce((sum, c) => sum + (c.total_funding_usd || 0), 0) || 0;
      const keywordCounts: Record<string, number> = {};
      
      for (const company of companies || []) {
        for (const kw of company.technology_keywords || []) {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        }
      }
      
      const companiesWithKeywords = companies?.filter(c => (c.technology_keywords?.length || 0) > 0).length || 0;
      const avgQuality = companies?.reduce((sum, c) => sum + (c.data_quality_score || 0), 0) / (companies?.length || 1);
      
      return {
        totalCompanies: count || 0,
        totalFunding,
        keywordDistribution: keywordCounts,
        companiesWithKeywords,
        avgDataQuality: Math.round(avgQuality),
      };
    },
  });
}

export function useCrunchbaseImportLogs(limit = 5) {
  return useQuery({
    queryKey: ['crunchbase-import-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crunchbase_import_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
  });
}
