/**
 * Centralized branding configuration
 * Update this file to change company name, app name, and branding across the entire application
 */

export const BRANDING = {
  // Company and App Names
  companyName: 'Yuktor',
  appName: 'Yuktor',
  fullAppName: 'Yuktor - Enterprise Support Platform',
  tagline: 'Enterprise Support Management System',
  
  // Logo and Icon Paths
  logo: {
    favicon: '/favicon.svg',
    faviconIco: '/favicon.ico',
    icon192: '/icons/icon-192x192.png',
    icon512: '/icons/icon-512x512.png',
    appleTouchIcon: '/icons/icon-192x192.png'
  },
  
  // PWA Configuration
  pwa: {
    name: 'Yuktor',
    shortName: 'Yuktor',
    description: 'Yuktor - Enterprise Support Management System',
    themeColor: '#f59e0b',
    backgroundColor: '#1a1b23',
    cachePrefix: 'yuktor'
  },
  
  // UI Colors and Theme
  colors: {
    primary: 'yuktor-600',
    primaryHover: 'yuktor-700',
    secondary: 'yuktor-50',
    secondaryDark: 'yuktor-800',
    accent: 'yuktor-400'
  },
  
  // Social Media
  social: {
    twitter: '@yuktor_sap'
  },
  
  // Meta Information
  meta: {
    author: 'Yuktor',
    keywords: 'enterprise support, SAP BASIS, ticket management, consultant platform'
  }
} as const;

// Helper function to generate app title with suffix
export const getAppTitle = (pageTitle?: string) => {
  if (pageTitle) {
    return `${pageTitle} - ${BRANDING.appName}`;
  }
  return BRANDING.fullAppName;
};

// Helper function to get branded cache name
export const getCacheName = (version: string = 'v1') => {
  return `${BRANDING.pwa.cachePrefix}-${version}`;
};