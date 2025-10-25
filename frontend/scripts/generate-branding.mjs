/**
 * Build script to generate static files from branding configuration
 * This script updates manifest.json, index.html, and service worker with centralized branding
 */

import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import branding configuration (we'll need to compile this)
const BRANDING = {
  companyName: 'Yuktor',
  appName: 'Yuktor',
  fullAppName: 'Yuktor - Enterprise Support Platform',
  tagline: 'Enterprise Support Management System',
  
  logo: {
    favicon: '/favicon.svg',
    faviconIco: '/favicon.ico',
    icon192: '/icons/icon-192x192.png',
    icon512: '/icons/icon-512x512.png',
    appleTouchIcon: '/icons/icon-192x192.png'
  },
  
  pwa: {
    name: 'Yuktor',
    shortName: 'Yuktor',
    description: 'Yuktor - Enterprise Support Management System',
    themeColor: '#f59e0b',
    backgroundColor: '#1a1b23',
    cachePrefix: 'yuktor'
  },
  
  social: {
    twitter: '@yuktor_sap'
  },
  
  meta: {
    author: 'Yuktor',
    keywords: 'enterprise support, SAP BASIS, ticket management, consultant platform'
  }
};

// Generate manifest.json
const manifest = {
  name: BRANDING.pwa.name,
  short_name: BRANDING.pwa.shortName,
  description: BRANDING.pwa.description,
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: BRANDING.pwa.backgroundColor,
  theme_color: BRANDING.pwa.themeColor,
  orientation: "portrait-primary",
  icons: [
    {
      src: BRANDING.logo.icon192,
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: BRANDING.logo.icon512,
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    }
  ],
  categories: ["business", "productivity"],
  prefer_related_applications: false
};

// Write manifest.json
const manifestPath = join(__dirname, '../public/manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ Generated manifest.json');

// Generate index.html
const indexTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <!-- Anti-cache version -->
    <meta name="app-version" content="<%- Date.now() %>" />
    <title>${BRANDING.fullAppName}</title>
    <meta name="description" content="${BRANDING.pwa.description} - Manage consultants, track tickets, and streamline support processes" />
    <meta name="author" content="${BRANDING.meta.author}" />
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="${BRANDING.pwa.themeColor}" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${BRANDING.appName}" />
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Razorpay Payment Gateway -->
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    
    <!-- PWA Icons -->
    <link rel="icon" type="image/png" sizes="192x192" href="${BRANDING.logo.icon192}" />
    <link rel="icon" type="image/png" sizes="512x512" href="${BRANDING.logo.icon512}" />
    <link rel="apple-touch-icon" href="${BRANDING.logo.appleTouchIcon}" />
    
    <!-- Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <meta property="og:title" content="${BRANDING.fullAppName}" />
    <meta property="og:description" content="SAP BASIS Support Management System - Manage consultants, track tickets, and streamline support processes" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${BRANDING.logo.icon512}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="${BRANDING.social.twitter}" />
    <meta name="twitter:image" content="${BRANDING.logo.icon512}" />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`.trim();

// Write index.html
const indexPath = join(__dirname, '../index.html');
writeFileSync(indexPath, indexTemplate);
console.log('✅ Generated index.html');

// Generate service worker with branded cache name
const serviceWorkerTemplate = `
// Service Worker for ${BRANDING.appName}
// This is a minimal service worker for PWA installation support

const CACHE_NAME = '${BRANDING.pwa.cachePrefix}-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Fetch event (basic pass-through)
self.addEventListener('fetch', (event) => {
  // Basic fetch handler - just pass through all requests
  // This can be enhanced with caching strategies as needed
  event.respondWith(fetch(event.request));
});
`.trim();

// Write service worker
const swPath = join(__dirname, '../public/sw.js');
writeFileSync(swPath, serviceWorkerTemplate);
console.log('✅ Generated sw.js');

console.log('🎉 All branding files generated successfully!');