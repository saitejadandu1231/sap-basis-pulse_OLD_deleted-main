export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5274/api/';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/+$/,'')}/${path.replace(/^\/+/, '')}`;
  const res = await fetch(url, options);
  return res;
}
