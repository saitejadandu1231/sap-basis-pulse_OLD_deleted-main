// Minimal service worker for PWA installation support
// This service worker doesn't cache anything - it's online-only as specified in the requirements

// Note: Cache name should be updated in branding configuration
const CACHE_NAME = 'yuktor-v1';

// Install event - no caching, just claim immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event - pass through all requests (no caching)
self.addEventListener('fetch', (event) => {
  // Pass through all requests without caching
  // This maintains online-only behavior as required
  event.respondWith(fetch(event.request));
});