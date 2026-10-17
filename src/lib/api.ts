// Thin fetch wrapper for the LumenX backend. Same-origin in production; proxied
// through Vite in development. Cookies are sent automatically so the session
// cookie keeps auth state.

import type { SiteContent } from '../content';
import type { Product, ProductCategory, ProductImage, ProductSpec } from '../types';

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

export interface ActivityEvent {
  id: string;
  userId: string | null;
  email: string | null;
  role: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

export interface ActivityPage {
  events: ActivityEvent[];
  total: number;
  limit: number;
  offset: number;
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

/* ── Editable catalogue overlay ─────────────────────────────────────────── */

export interface CatalogPayload {
  categories: ProductCategory[];
  products: Product[];
}

export interface AdminCatalogProduct extends Product {
  id?: string;
  datasheet?: unknown;
  sourceImportId?: string | null;
}

export interface AdminCatalogPayload {
  categories: ProductCategory[];
  products: AdminCatalogProduct[];
}

export interface CatalogCategoryInput {
  id?: string;
  title: string;
  description: string;
  applications: string;
  imageUrl: string;
  linkLabel: string;
  range: 'lighting' | 'sensors';
  sortOrder: number;
}

export interface CatalogProductInput {
  category: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  specs: ProductSpec[];
  features: string[];
  applications: string[];
  images: ProductImage[];
  mainImage?: string | null;
  pdfUrl?: string | null;
  pdfName?: string | null;
  pdfSource: 'none' | 'uploaded' | 'generated';
  warranty?: string | null;
  brand?: string | null;
  manufacturer?: string | null;
  manufacturerModel?: string | null;
  datasheet?: unknown;
  sourceImportId?: string | null;
}

export interface CatalogImageUpload {
  url: string;
  filename: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  originalName?: string | null;
}

export interface CatalogPdfUpload {
  url: string;
  filename: string;
  bytes: number;
  originalName?: string | null;
}

export type CatalogImportStatus =
  | 'queued'
  | 'extracting'
  | 'analyzing'
  | 'ready'
  | 'failed'
  | 'canceled';

export interface CatalogImportImage {
  url: string;
  width: number | null;
  height: number | null;
  mime: string;
}

export interface CatalogImportDraft {
  schemaVersion: number;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  source: {
    manufacturer: string | null;
    model: string | null;
    pageCount: number | null;
  };
  product: {
    suggestedName: string;
    manufacturerName: string | null;
    categoryId: string | null;
    brand: 'orbitx' | null;
    summary: string;
    description: string;
    warranty: string | null;
    specs: ProductSpec[];
    features: string[];
    applications: string[];
    manufacturer: string | null;
    manufacturerModel: string | null;
  };
  datasheet: {
    variant?: string;
    stats: { label: string; value: string; unit: string }[];
    columns: {
      left: { title: string; rows: { label: string; value: string }[] }[];
      right: { title: string; rows: { label: string; value: string }[] }[];
    };
  } | null;
  evidence: { field: string; quote: string; page: number | null }[];
}

export interface CatalogImportJob {
  id: string;
  status: CatalogImportStatus;
  statusMessage: string | null;
  originalName: string | null;
  bytes: number | null;
  pageCount: number | null;
  model: string | null;
  sourceUrl: string;
  images: CatalogImportImage[];
  warnings: string[];
  result: CatalogImportDraft | null;
  error: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogImportCapabilities {
  enabled: boolean;
  configured: boolean;
  model: string;
  baseUrl: string;
  pdfTools: {
    available: boolean;
    tools: Record<string, boolean>;
  };
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
  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  me: () => request<{ user: User | null }>('/api/auth/me'),

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
  adminActivity: ({
    userId,
    action,
    q,
    limit,
    offset,
  }: {
    userId?: string | null;
    action?: string | null;
    q?: string | null;
    limit?: number;
    offset?: number;
  } = {}) => {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (action) params.set('action', action);
    if (q) params.set('q', q);
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    const query = params.toString();
    return request<ActivityPage>('/api/admin/activity' + (query ? '?' + query : ''));
  },

  // Site content (CMS)
  content: () => request<{ content: SiteContent | null }>('/api/content'),
  adminContent: () =>
    request<{
      content: SiteContent | null;
      updated_at: string | null;
      updated_by: string | null;
      revisions: { id: string; created_at: string; created_by: string | null }[];
    }>('/api/admin/content'),
  saveContent: (content: SiteContent) =>
    request<{ ok: boolean; updated_at: string; updated_by: string }>('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify(content),
    }),

  // Contact form
  contact: (payload: Record<string, unknown>) =>
    request<{ ok: boolean; id: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

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

  // Editable catalogue overlay
  catalog: () => request<CatalogPayload>('/api/catalog'),
  iesProductMap: () =>
    request<{
      map: Record<string, string[]>;
      files: number;
      missing: number;
      ambiguous: { slug: string; categories: string[] }[];
    }>('/api/ies/product-map'),
  adminCatalog: () => request<AdminCatalogPayload>('/api/admin/catalog'),
  createCatalogCategory: (input: CatalogCategoryInput) =>
    request<{ ok: boolean; category: ProductCategory }>('/api/admin/catalog/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateCatalogCategory: (id: string, input: CatalogCategoryInput) =>
    request<{ ok: boolean; category: ProductCategory }>(
      `/api/admin/catalog/categories/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(input) },
    ),
  deleteCatalogCategory: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/catalog/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  createCatalogProduct: (input: CatalogProductInput) =>
    request<{ ok: boolean; product: AdminCatalogProduct }>('/api/admin/catalog/products', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateCatalogProduct: (category: string, slug: string, input: CatalogProductInput) =>
    request<{ ok: boolean; product: AdminCatalogProduct }>(
      `/api/admin/catalog/products/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`,
      { method: 'PUT', body: JSON.stringify(input) },
    ),
  deleteCatalogProduct: (category: string, slug: string) =>
    request<{ ok: boolean }>(
      `/api/admin/catalog/products/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`,
      { method: 'DELETE' },
    ),
  setCatalogProductVisibility: (
    category: string,
    slug: string,
    published: boolean,
    product?: Product,
  ) =>
    request<{ ok: boolean; product: AdminCatalogProduct }>(
      `/api/admin/catalog/products/${encodeURIComponent(category)}/${encodeURIComponent(slug)}/visibility`,
      { method: 'PUT', body: JSON.stringify({ published, product }) },
    ),
  uploadCatalogImage: async (
    scope: 'product' | 'category',
    slug: string,
    blob: Blob,
    filename: string,
    width?: number | null,
    height?: number | null,
  ) => {
    const params = new URLSearchParams({ scope, slug, filename });
    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    return requestOctet<{ ok: boolean; image: CatalogImageUpload }>(
      `/api/admin/catalog/upload/image?${params.toString()}`,
      await blob.arrayBuffer(),
    );
  },
  uploadCatalogSpecSheet: async (slug: string, file: File) => {
    const params = new URLSearchParams({ slug, filename: file.name });
    return requestOctet<{ ok: boolean; pdf: CatalogPdfUpload }>(
      `/api/admin/catalog/upload/spec-sheet?${params.toString()}`,
      await file.arrayBuffer(),
    );
  },
  previewCatalogDatasheet: (payload: Record<string, unknown>) =>
    requestBlob('/api/admin/catalog/datasheet/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // AI spec-sheet import
  catalogImportStatus: () =>
    request<CatalogImportCapabilities>('/api/admin/catalog/imports/status'),
  uploadCatalogImportSource: async (file: File) => {
    const params = new URLSearchParams({ filename: file.name });
    return requestOctet<{ ok: boolean; import: CatalogImportJob }>(
      `/api/admin/catalog/imports/source?${params.toString()}`,
      await file.arrayBuffer(),
    );
  },
  startCatalogImport: (
    sourceId: string,
    categories: { id: string; title: string }[],
    pageHint = '',
    modelHint = '',
  ) =>
    request<{ ok: boolean; import: CatalogImportJob }>('/api/admin/catalog/imports', {
      method: 'POST',
      body: JSON.stringify({ sourceId, categories, pageHint, modelHint }),
    }),
  getCatalogImport: (id: string) =>
    request<{ import: CatalogImportJob }>(
      `/api/admin/catalog/imports/${encodeURIComponent(id)}`,
    ),
  listCatalogImports: () =>
    request<{ imports: CatalogImportJob[] }>('/api/admin/catalog/imports'),
  retryCatalogImport: (id: string) =>
    request<{ ok: boolean; import: CatalogImportJob }>(
      `/api/admin/catalog/imports/${encodeURIComponent(id)}/retry`,
      { method: 'POST' },
    ),
  cancelCatalogImport: (id: string) =>
    request<{ ok: boolean; import: CatalogImportJob }>(
      `/api/admin/catalog/imports/${encodeURIComponent(id)}/cancel`,
      { method: 'POST' },
    ),
  adoptCatalogImportImages: (id: string, slug: string) =>
    request<{ ok: boolean; images: ProductImage[] }>(
      `/api/admin/catalog/imports/${encodeURIComponent(id)}/adopt`,
      { method: 'POST', body: JSON.stringify({ slug }) },
    ),
};

/* ── IES library management (admin) ──────────────────────────────────────
 *
 * Associations live in the `ies_product_files` table and are rendered into
 * `src/ies-product-map.ts` by `npm run ies:map`. Uploads are sent as raw bytes
 * (not multipart): the server reads the body with express.raw, so no upload
 * middleware or new dependency is needed.
 */

export interface IesLibraryFile {
  filename: string;
  assigned: boolean;
  productSlug: string | null;
  categorySlug: string | null;
  originalName: string | null;
  source: string | null;
  uploadedBy: string | null;
  createdAt: string | null;
  /** Attached to a product, but the file is no longer in the IES directory. */
  missing?: boolean;
}

export interface IesAdminMutation {
  ok: boolean;
  map: Record<string, string[]>;
}

export interface IesUploadResult extends IesAdminMutation {
  reused: boolean;
  files: number;
  file: {
    filename: string;
    productSlug: string;
    categorySlug: string | null;
    bytes: number | null;
  };
}

const asApiError = (message: string, status: number): ApiError => {
  const err = new Error(message) as ApiError;
  err.status = status;
  return err;
};

/** Same contract as `request`, but for a raw binary body. */
async function requestOctet<T>(
  path: string,
  body: ArrayBuffer,
  headers: Record<string, string> = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/octet-stream',
        ...headers,
      },
      body,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw asApiError(data?.error || `Upload failed (${res.status})`, res.status);
  }
  return data as T;
}

/** Raw IES upload (keeps the existing X-IES-Filename contract). */
async function requestBinary<T>(path: string, body: ArrayBuffer, filename: string): Promise<T> {
  return requestOctet<T>(path, body, { 'X-IES-Filename': filename });
}

/** Same contract as `request`, but the response is a binary blob (PDF preview). */
async function requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
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

  if (!res.ok) {
    const text = await res.text();
    let message = 'Request failed (' + res.status + ')';
    try {
      const data = JSON.parse(text);
      if (data?.error) message = data.error;
    } catch {
      // Keep the generic message.
    }
    const err = new Error(message) as ApiError;
    err.status = res.status;
    throw err;
  }
  return res.blob();
}

export const iesAdminApi = {
  library: () =>
    request<{
      files: IesLibraryFile[];
      map: Record<string, string[]>;
      missing: string[];
      ambiguous: { slug: string; categories: string[] }[];
    }>('/api/admin/ies'),

  assign: (productSlug: string, categorySlug: string | null, filename: string) =>
    request<IesAdminMutation>('/api/admin/ies/assign', {
      method: 'POST',
      body: JSON.stringify({ productSlug, categorySlug, filename }),
    }),

  detach: (filename: string) =>
    request<IesAdminMutation & { removed: number }>(
      `/api/admin/ies/assign/${encodeURIComponent(filename)}`,
      { method: 'DELETE' },
    ),

  upload: async (productSlug: string, categorySlug: string | null, file: File) => {
    const params = new URLSearchParams({ product: productSlug, filename: file.name });
    if (categorySlug) params.set('category', categorySlug);
    return requestBinary<IesUploadResult>(
      `/api/admin/ies/upload?${params.toString()}`,
      await file.arrayBuffer(),
      file.name,
    );
  },
};
