/**
 * Unified Taxonomy Filtering
 * 
 * Central source of truth for filtering technologies across all views.
 * Ensures Explorer, Intelligence Dashboard, Radar, and Cards all show
 * the same consistent set of technologies.
 */

// Keywords to exclude from SDV ecosystem visualizations
// These are generic/tangential industry terms not specific to automotive/SDV
export const EXCLUDED_KEYWORD_PATTERNS = [
  'smart city',
  'smart cities',
  'smart recharging',
  'fleet management',
  'logistics',
  'maritime',
  'micromobility',
  'shipping',
  'aviation',
  'freight',
  'smart grid',
] as const;

// Duplicate/overlapping keywords - keep only the canonical version
// Map of keyword names to exclude → canonical name they should consolidate into
export const DUPLICATE_KEYWORDS: Record<string, string> = {
  // Electric mobility consolidation - "Electric Vehicle" is canonical
  'electric mobility': 'Electric Vehicle',
  'sustainable mobility': 'Electric Vehicle',
  
  // Autonomous driving consolidation - "Autonomous Driving" is canonical
  'autonomous mobile robots': 'Autonomous Driving',
  'self-driving vehicles': 'Autonomous Driving',
};

// Canonical keywords that should always be shown (even if they match patterns)
export const CANONICAL_KEYWORDS = [
  'Electric Vehicle',
  'Autonomous Driving',
  'Software Defined Vehicle',
  'EV Charging',
  'Bidirectional Charging',
  'LiDAR',
  'Vehicle to Everything',
  'Vehicle to Grid',
];

/**
 * Check if a technology should be included in SDV ecosystem views
 */
export function isSDVRelevant(
  name: string,
  excludedFromSdv?: boolean | null
): boolean {
  // If explicitly excluded in database, respect that
  if (excludedFromSdv === true) return false;
  
  const nameLower = name.toLowerCase();
  
  // Check if it's a duplicate that should be consolidated
  if (DUPLICATE_KEYWORDS[nameLower]) return false;
  
  // Check against excluded patterns
  const isExcludedPattern = EXCLUDED_KEYWORD_PATTERNS.some(
    pattern => nameLower.includes(pattern)
  );
  
  // Unless it's a canonical keyword, exclude if it matches patterns
  if (isExcludedPattern && !CANONICAL_KEYWORDS.some(
    canonical => canonical.toLowerCase() === nameLower
  )) {
    return false;
  }
  
  return true;
}

/**
 * Filter an array of technologies to only SDV-relevant ones
 */
export function filterSDVTechnologies<T extends { name: string; excludedFromSdv?: boolean | null }>(
  technologies: T[]
): T[] {
  return technologies.filter(tech => 
    isSDVRelevant(tech.name, tech.excludedFromSdv)
  );
}

/**
 * Check if a technology is a central ecosystem hub (primary categories)
 */
export function isCentralEcosystem(name: string): boolean {
  const CENTRAL_HUBS = [
    "Software Defined Vehicle",
    "Software-Defined Vehicle",
    "Electric Vehicle", 
    "Autonomous Driving"
  ];
  
  return CENTRAL_HUBS.some(hub => 
    name.toLowerCase() === hub.toLowerCase()
  );
}
