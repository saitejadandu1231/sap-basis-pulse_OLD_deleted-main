#!/usr/bin/env node

/**
 * Update Branding Script
 * 
 * This script reads the centralized branding configuration and updates
 * static files that can't import TypeScript modules directly.
 * 
 * Usage: npm run update-branding
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read branding configuration (simplified for Node.js)
const brandingPath = join(__dirname, '../src/lib/branding.ts');
const brandingContent = readFileSync(brandingPath, 'utf8');

// Extract values from branding file using regex (simple approach)
const extractValue = (key) => {
  const regex = new RegExp(`${key}:\\s*['"]([^'"]+)['"]`);
  const match = brandingContent.match(regex);
  return match ? match[1] : null;
};

const BRANDING = {
  companyName: extractValue('companyName') || 'Yuktor',
  appName: extractValue('appName') || 'Yuktor', 
  fullAppName: extractValue('fullAppName') || 'Yuktor - Enterprise Support Platform',
  description: extractValue('description') || 'Yuktor - Enterprise Support Management System',
  themeColor: extractValue('themeColor') || '#f59e0b',
  backgroundColor: extractValue('backgroundColor') || '#1a1b23',
  cachePrefix: extractValue('cachePrefix') || 'yuktor'
};

console.log('📋 Extracted branding configuration:');
console.log(JSON.stringify(BRANDING, null, 2));

// Update manifest.json
const manifestPath = join(__dirname, '../public/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

manifest.name = BRANDING.appName;
manifest.short_name = BRANDING.appName;
manifest.description = BRANDING.description;
manifest.theme_color = BRANDING.themeColor;
manifest.background_color = BRANDING.backgroundColor;

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ Updated manifest.json');

// Update service worker cache name
const swPath = join(__dirname, '../public/sw.js');
let swContent = readFileSync(swPath, 'utf8');
swContent = swContent.replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = '${BRANDING.cachePrefix}-v1';`);
writeFileSync(swPath, swContent);
console.log('✅ Updated sw.js cache name');

console.log('🎉 Branding update complete!');
console.log('');
console.log('💡 Note: index.html still needs manual updates for now');
console.log('   Update the following in index.html:');
console.log(`   - <title>${BRANDING.fullAppName}</title>`);
console.log(`   - meta description: "${BRANDING.description}"`);
console.log(`   - meta author: "${BRANDING.companyName}"`);
console.log(`   - apple-mobile-web-app-title: "${BRANDING.appName}"`);