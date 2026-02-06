/**
 * Coresignal Data Analysis Script
 * Run with: npx tsx scripts/analyze-coresignal.ts
 */

import * as fs from 'fs';
import * as zlib from 'zlib';
import * as path from 'path';

const filePath = path.join(__dirname, '../docs/data/coresignal-enterprise-99.json.gz');

// Read and decompress
const compressed = fs.readFileSync(filePath);
const decompressed = zlib.gunzipSync(compressed).toString('utf-8');

// Parse NDJSON (newline-delimited JSON)
const lines = decompressed.trim().split('\n').filter(line => line.trim());
const companies: any[] = [];

for (const line of lines) {
  try {
    companies.push(JSON.parse(line));
  } catch (e) {
    console.error('Failed to parse line:', line.substring(0, 100));
  }
}

console.log('=== CORESIGNAL DATA ANALYSIS ===\n');
console.log(`Total records: ${companies.length}\n`);

// Sample first company to understand structure
if (companies.length > 0) {
  console.log('=== SAMPLE RECORD STRUCTURE ===');
  console.log('Available fields:', Object.keys(companies[0]).join(', '));
  console.log('\n=== FIRST 3 COMPANIES ===');
  
  companies.slice(0, 3).forEach((c, i) => {
    console.log(`\n--- Company ${i + 1} ---`);
    console.log('Name:', c.name || c.company_name || c.organization_name);
    console.log('Industry:', c.industry || c.industries);
    console.log('Country:', c.country || c.hq_country || c.headquarters_country);
    console.log('Employees:', c.employees_count || c.employee_count || c.size_range);
    console.log('Website:', c.website || c.company_url);
    console.log('LinkedIn:', c.linkedin_url || c.linkedin);
    console.log('Description:', (c.description || c.tagline || '').substring(0, 200));
  });

  // Industry distribution
  console.log('\n=== INDUSTRY DISTRIBUTION ===');
  const industries: Record<string, number> = {};
  companies.forEach(c => {
    const ind = c.industry || c.industries || 'Unknown';
    const indStr = Array.isArray(ind) ? ind.join(', ') : ind;
    industries[indStr] = (industries[indStr] || 0) + 1;
  });
  
  Object.entries(industries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([ind, count]) => console.log(`  ${ind}: ${count}`));

  // Country distribution
  console.log('\n=== COUNTRY DISTRIBUTION ===');
  const countries: Record<string, number> = {};
  companies.forEach(c => {
    const country = c.country || c.hq_country || c.headquarters_country || 'Unknown';
    countries[country] = (countries[country] || 0) + 1;
  });
  
  Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([country, count]) => console.log(`  ${country}: ${count}`));

  // Size distribution
  console.log('\n=== EMPLOYEE SIZE DISTRIBUTION ===');
  const sizes: Record<string, number> = {};
  companies.forEach(c => {
    const size = c.size_range || c.employee_range || c.employees_count?.toString() || 'Unknown';
    sizes[size] = (sizes[size] || 0) + 1;
  });
  
  Object.entries(sizes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([size, count]) => console.log(`  ${size}: ${count}`));

  // Export decompressed JSON for easier inspection
  const outputPath = path.join(__dirname, '../docs/data/coresignal-enterprise-99.json');
  fs.writeFileSync(outputPath, JSON.stringify(companies, null, 2));
  console.log(`\n✓ Decompressed data saved to: ${outputPath}`);
}
