/**
 * Coresignal Data Parser
 * Parses the gzipped JSON export and saves as readable JSON
 */

import * as fs from 'fs';
import * as zlib from 'zlib';

const inputPath = './docs/data/coresignal-enterprise-99.json.gz';
const outputPath = './docs/data/coresignal-enterprise-99.json';

try {
  const compressed = fs.readFileSync(inputPath);
  const decompressed = zlib.gunzipSync(compressed).toString('utf-8');
  
  // Parse NDJSON (newline-delimited JSON)
  const lines = decompressed.trim().split('\n').filter(line => line.trim());
  const companies: any[] = [];

  for (const line of lines) {
    try {
      companies.push(JSON.parse(line));
    } catch (e) {
      // Skip malformed lines
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(companies, null, 2));
  console.log(`Parsed ${companies.length} companies`);
  console.log(`Saved to ${outputPath}`);
  
  // Print sample
  if (companies.length > 0) {
    console.log('\nSample fields:', Object.keys(companies[0]).slice(0, 20).join(', '));
  }
} catch (e) {
  console.error('Error:', e);
}
