// Thin fetch wrapper for the LumenX backend. Same-origin in production; proxied
// through Vite in development. Cookies are sent automatically so the session
// cookie keeps auth state.

export interface ApiError extends Error {
  status?: number;
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface DownloadRecord {
  id: string;
  email: string | null;
  filename: string;
  kind: string;
  ip: string | null;
  created_at: string;
}

export interface DownloadStats {
  total: number;
  ies: number;
  datasheet: number;
}

export interface Lead {
  id: string;
  source: 'contact' | 'quote' | 'design';
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string;
  detail: string | null;
  created_at: string;
}

export interface DesignProduct {
  id: string;
  name: string;
  lumens: number | null;
  watts: number | null;
  manufacturer: string;
}

export interface DesignResult {
  area: number;
  utilizationFactor: number;
  maintenanceFactor: number;
  requiredCount: number;
  achievedLux: number;
  installedLumens: number;
  powerDensityWm2: number;
  wattsPerFixture: number;
}

export interface IesFile {
  id: string;
  filename: string;
  name: string;
  lumens: number | null;
  watts: number | null;
  manufacturer: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`) as ApiError;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  // Auth
  register: (email: string, password: string) =>
    request<{ user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User }>('/api/auth/me'),

  // Admin (email + password login; no key needed in the browser)
  adminLogin: (email: string, password: string) =>
    request<{ user: User }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  adminUsers: () => request<{ users: AdminUser[] }>('/api/admin/users'),
  adminDownloads: () => request<{ downloads: DownloadRecord[] }>('/api/admin/downloads'),
  adminDownloadStats: () =>
    request<{ stats: DownloadStats; top: { filename: string; kind: string; count: number }[] }>(
      '/api/admin/downloads/stats',
    ),
  adminLeads: () => request<{ leads: Lead[] }>('/api/admin/leads'),

  // Contact form
  contact: (payload: Record<string, unknown>) =>
    request<{ ok: boolean; id: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // IES walled garden
  listIes: () => request<{ files: IesFile[] }>('/api/ies'),

  // Design tool
  designProducts: () => request<{ products: DesignProduct[] }>('/api/design/products'),
  calculateDesign: (payload: Record<string, unknown>) =>
    request<{ product: { id: string; name: string; lumens: number; watts: number }; result: DesignResult }>(
      '/api/design/calculate',
      { method: 'POST', body: JSON.stringify(payload) },
    ),
  exportDesign: (email: string, report: unknown) =>
    request<{ ok: boolean; exportId: string; message: string }>('/api/design/export', {
      method: 'POST',
      body: JSON.stringify({ email, report }),
    }),
};
