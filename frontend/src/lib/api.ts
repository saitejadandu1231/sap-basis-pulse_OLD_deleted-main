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
  
  // Handle 401 Unauthorized - session expired
  if (res.status === 401) {
    // Clear local auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Check if we're not already on the login page to avoid infinite redirects
    if (!window.location.pathname.includes('/login')) {
      // Show a brief notification (optional, as user will be redirected immediately)
      console.log('Session expired. Redirecting to login...');
      
      // Redirect to login page with the current location for redirect after login
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  }
  
  return res;
}
