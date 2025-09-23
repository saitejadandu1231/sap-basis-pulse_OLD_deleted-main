export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5274/api/';

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Get the JWT token from localStorage if available
  const token = localStorage.getItem('authToken');
  
  // Prepare headers with auth token if available
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  // Create the full URL - avoid double API path issues
  let url;
  if (path.startsWith('http')) {
    url = path;
  } else if (API_BASE.includes('/api/') && path.startsWith('api/')) {
    // Remove duplicate 'api/' prefix if it exists in both the base URL and path
    url = `${API_BASE.replace(/\/+$/,'')}/${path.replace(/^api\/+/, '')}`;
  } else {
    url = `${API_BASE.replace(/\/+$/,'')}/${path.replace(/^\/+/, '')}`;
  }
  
  // Make the API call with the updated options
  const res = await fetch(url, {
    ...options,
    headers
  });
  
  return res;
}
