// Replace the old Supabase shim with a focused API client that calls our backend REST API.
import { API_BASE, apiFetch } from '@/lib/api';

function buildUrl(path: string, query?: Record<string, any>) {
  const base = API_BASE.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  const qs = query ? Object.keys(query).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(query[k]))}`).join('&') : '';
  return `${base}/api/${p}${qs ? `?${qs}` : ''}`;
}

const from = (table: string) => ({
  select: async (selectClause = '*') => {
    const url = buildUrl(table, { select: selectClause });
    const res = await apiFetch(url);
    const data = await res.json();
    return { data, error: res.ok ? null : { status: res.status, message: data } };
  },
  insert: async (payload: any) => {
    const url = buildUrl(table);
    const res = await apiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    return { data, error: res.ok ? null : { status: res.status, message: data } };
  },
  update: async (payload: any) => {
    const url = buildUrl(table);
    const res = await apiFetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    return { data, error: res.ok ? null : { status: res.status, message: data } };
  },
  rpc: async (fnName: string, params?: any) => {
    const url = buildUrl(`rpc/${fnName}`);
    const res = await apiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params || {}) });
    const data = await res.json();
    return { data, error: res.ok ? null : { status: res.status, message: data } };
  }
});

const auth = {
  getUser: async () => {
  const res = await apiFetch('/auth/user');
    const data = await res.json();
    return { data: { user: data?.user ?? null }, error: res.ok ? null : { status: res.status, message: data } };
  },
  getSession: async () => {
  const res = await apiFetch('/auth/session');
    const data = await res.json();
    return { data: { session: data?.session ?? null }, error: res.ok ? null : { status: res.status, message: data } };
  },
  signInWithPassword: async ({ email, password }: { email: string; password: string; }) => {
  const res = await apiFetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    return { data: { user: data?.user ?? null }, error: res.ok ? null : { status: res.status, message: data } };
  },
  signUp: async ({ email, password, options }: any) => {
    // Options may contain profile fields; backend expects RegisterDto
    const payload = { email, password, firstName: options?.data?.first_name, lastName: options?.data?.last_name, role: options?.data?.role };
  const res = await apiFetch('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    return { data: { user: data ?? null }, error: res.ok ? null : { status: res.status, message: data } };
  },
  signOut: async () => {
  await apiFetch('/auth/signout', { method: 'POST' });
    return { data: null, error: null };
  },
  onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } })
};

export const supabase = {
  from,
  auth,
  rpc: async (fnName: string, params?: any) => from('rpc').rpc(fnName, params),
};

export default supabase;
