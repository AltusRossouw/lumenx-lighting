import React, { useEffect, useMemo, useRef, useState } from 'react';
import { iesAdminApi, IesLibraryFile } from '../lib/api';
import { useCatalog } from '../catalog';
import type { Product } from '../types';
import { AlertTriangle, Check, FileUp, Link2, Loader2, Search, Trash2, X } from 'lucide-react';

/**
 * IES library — attach photometry to catalogue products.
 *
 * This is the "E3" admin upload: pick a product, upload one or more `.ies`
 * files, and the file is written into the walled-garden directory
 * (uploads/ies/ on the persistent Docker volume, with the committed supplier
 * files in server/files/ies/ still readable) under the repository's slugified
 * naming convention and recorded against the product in `ies_product_files`.
 *
 * The SPA reads the runtime map from /api/ies/product-map, so an upload is live
 * on the next page load without a rebuild. `src/ies-product-map.ts` remains the
 * fail-safe fallback used when the API is unavailable.
 */

const inputCls =
  'w-full px-3 py-2 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans';

type Status = { tone: 'ok' | 'error'; text: string };

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const AdminIesLibrary: React.FC = () => {
  const [files, setFiles] = useState<IesLibraryFile[]>([]);
  const [map, setMap] = useState<Record<string, string[]>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [ambiguous, setAmbiguous] = useState<{ slug: string; categories: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status[]>([]);

  const [productSlug, setProductSlug] = useState('');
  const [view, setView] = useState<'assigned' | 'unassigned' | 'all'>('assigned');
  const [search, setSearch] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const catalog = useCatalog();
  const productBySlug = useMemo(
    () => new Map<string, Product>(catalog.products.map((product) => [product.slug, product])),
    [catalog.products],
  );
  const categoryLabel = (id: string | null): string => {
    if (!id) return '';
    return catalog.getCategory(id)?.title ?? id;
  };
  const productLabel = (slug: string): string => productBySlug.get(slug)?.name ?? slug;

  /**
   * Catalogue slugs used by more than one category. The runtime IES map is
   * keyed by slug only, so two entries sharing a slug share their photometry.
   */
  const sharedSlugs = useMemo(() => {
    const bySlug = new Map<string, Set<string>>();
    for (const product of catalog.products) {
      const categories = bySlug.get(product.slug) ?? new Set<string>();
      categories.add(product.category);
      bySlug.set(product.slug, categories);
    }
    return [...bySlug.entries()]
      .filter(([, categories]) => categories.size > 1)
      .map(([slug, categories]) => ({ slug, categories: [...categories].sort() }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }, [catalog.products]);

  const productOptionLabel = (name: string, slug: string, category: string) =>
    sharedSlugs.some((entry) => entry.slug === slug)
      ? `${name} (${slug}) · ${categoryLabel(category)}`
      : `${name} (${slug})`;

  const load = async () => {
    setLoadError(null);
    try {
      const data = await iesAdminApi.library();
      setFiles(data.files);
      setMap(data.map);
      setMissing(data.missing);
      setAmbiguous(data.ambiguous);
    } catch (err) {
      setLoadError((err as Error).message || 'Could not load the IES library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProduct = productBySlug.get(productSlug) ?? null;

  const upload = async () => {
    const input = fileInput.current;
    const chosen = input?.files ? Array.from(input.files) : [];
    if (!selectedProduct || chosen.length === 0) return;

    setBusy(true);
    setStatus([]);
    const results: Status[] = [];

    for (const file of chosen) {
      try {
        const data = await iesAdminApi.upload(selectedProduct.slug, selectedProduct.category, file);
        results.push({
          tone: 'ok',
          text: `${file.name} → ${data.file.filename} (${selectedProduct.name})${
            data.reused ? ' — identical file already existed, re-attached' : ''
          }`,
        });
      } catch (err) {
        results.push({ tone: 'error', text: `${file.name}: ${(err as Error).message}` });
      }
      setStatus([...results]);
    }

    if (input) input.value = '';
    await load();
    setBusy(false);
  };

  const attach = async (filename: string, slug: string) => {
    if (!slug) return;
    setBusy(true);
    try {
      const product = productBySlug.get(slug);
      await iesAdminApi.assign(slug, product?.category ?? null, filename);
      setStatus([{ tone: 'ok', text: `${filename} attached to ${productLabel(slug)}` }]);
      await load();
    } catch (err) {
      setStatus([{ tone: 'error', text: (err as Error).message }]);
    } finally {
      setBusy(false);
    }
  };

  const detach = async (filename: string) => {
    setBusy(true);
    try {
      await iesAdminApi.detach(filename);
      setStatus([{ tone: 'ok', text: `${filename} detached — the file stays in the IES directory.` }]);
      await load();
    } catch (err) {
      setStatus([{ tone: 'error', text: (err as Error).message }]);
    } finally {
      setBusy(false);
    }
  };

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return files.filter((file) => {
      if (view === 'assigned' && !file.assigned) return false;
      if (view === 'unassigned' && file.assigned) return false;
      if (!needle) return true;
      return (
        file.filename.toLowerCase().includes(needle) ||
        (file.productSlug ?? '').toLowerCase().includes(needle) ||
        productLabel(file.productSlug ?? '').toLowerCase().includes(needle)
      );
    });
  }, [files, view, search, productBySlug]);

  const assignedCount = files.filter((file) => file.assigned).length;
  const productCount = Object.keys(map).length;

  // Shared slugs known from the catalogue, plus any the API inferred from the
  // categories recorded against uploads.
  const sharedSlugWarnings = useMemo(() => {
    const merged = new Map(sharedSlugs.map((entry) => [entry.slug, new Set(entry.categories)]));
    for (const entry of ambiguous) {
      const categories = merged.get(entry.slug) ?? new Set<string>();
      entry.categories.forEach((category) => categories.add(category));
      merged.set(entry.slug, categories);
    }
    return [...merged.entries()]
      .map(([slug, categories]) => ({ slug, categories: [...categories].sort() }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }, [ambiguous]);

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="gradient-border-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileUp className="w-4 h-4 text-primary/60" />
          <h2 className="font-display text-sm font-semibold text-white tracking-tight">
            Attach an IES file to a product
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-5 font-sans font-light">
          The file is stored in <span className="font-mono">uploads/ies/</span> under the
          repository&rsquo;s slugified name and recorded against the product. Downloads stay behind
          the login gate, and the mapping is live on the next page load.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
              Product
            </label>
            <select
              value={productSlug}
              onChange={(e) => setProductSlug(e.target.value)}
              className={inputCls}
            >
              <option value="">Select a product…</option>
              {catalog.categories.map((category) => {
                const items = catalog.products.filter((product) => product.category === category.id);
                if (items.length === 0) return null;
                return (
                  <optgroup key={category.id} label={category.title}>
                    {items.map((product) => (
                      <option key={`${category.id}-${product.slug}`} value={product.slug}>
                        {productOptionLabel(product.name, product.slug, product.category)}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
              IES files
            </label>
            <input
              ref={fileInput}
              type="file"
              accept=".ies,application/octet-stream"
              multiple
              className={`${inputCls} file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary cursor-pointer`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            onClick={upload}
            disabled={busy || !productSlug}
            className="btn btn-primary btn-sm"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
            Upload &amp; attach
          </button>
          <span className="text-[11px] font-mono text-slate-600">
            live on product pages after a refresh
          </span>
        </div>

        {status.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {status.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-sans">
                {line.tone === 'ok' ? (
                  <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                )}
                <span className={line.tone === 'ok' ? 'text-slate-300' : 'text-red-400'}>{line.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Counts + warnings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Files in library', value: files.length },
          { label: 'Attached', value: assignedCount },
          { label: 'Products with IES', value: productCount },
          { label: 'Missing on disk', value: missing.length },
        ].map((stat) => (
          <div key={stat.label} className="gradient-border-card p-5">
            <p className="font-display text-3xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {sharedSlugWarnings.length > 0 && (
        <div className="border border-amber-500/20 bg-amber-500/[0.04] rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400/80 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-400 font-sans font-light">
            {sharedSlugWarnings.map((entry) => (
              <span key={entry.slug} className="block">
                <span className="font-mono text-amber-300/80">{entry.slug}</span> is used by more
                than one category ({entry.categories.map(categoryLabel).join(', ')}). The product
                page looks photometry up by slug alone, so both pages will list the same files.
              </span>
            ))}
          </div>
        </div>
      )}

      {loadError && (
        <div className="border border-red-500/20 bg-red-500/[0.04] rounded-2xl p-4">
          <p className="text-xs text-red-400 font-sans">{loadError}</p>
        </div>
      )}

      {/* Library */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search files or products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-10`}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'assigned', label: `Attached (${assignedCount})` },
              { id: 'unassigned', label: `Unattached (${files.length - assignedCount})` },
              { id: 'all', label: 'All' },
            ] as { id: typeof view; label: string }[]
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              className={`px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                view === option.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-slate-500 border border-[#1E293B] hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
        <div className="hidden sm:grid grid-cols-[1fr_200px_150px_90px] gap-4 px-6 py-3 border-b border-[#1E293B] bg-white/[0.02]">
          {['File', 'Product', 'Attached', ''].map((heading, i) => (
            <span key={i} className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              {heading}
            </span>
          ))}
        </div>

        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500 font-mono">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Loading library…
          </p>
        ) : rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500 font-mono">
            Nothing to show.
          </p>
        ) : (
          rows.map((file) => (
            <div
              key={file.filename}
              className="grid grid-cols-1 sm:grid-cols-[1fr_200px_150px_90px] gap-3 sm:gap-4 px-6 py-3 border-b border-[#1E293B]/60 last:border-b-0 items-center"
            >
              <div className="min-w-0">
                <p className="text-xs font-mono text-slate-300 truncate" title={file.filename}>
                  {file.filename}
                </p>
                {file.originalName && file.originalName !== file.filename && (
                  <p className="text-[10px] font-mono text-slate-600 truncate">
                    uploaded as {file.originalName}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                {file.assigned ? (
                  <>
                    <p className="text-sm text-white truncate font-sans">
                      {productLabel(file.productSlug ?? '')}
                    </p>
                    {file.categorySlug && (
                      <p className="text-[10px] font-mono text-slate-600">
                        {categoryLabel(file.categorySlug)}
                      </p>
                    )}
                  </>
                ) : (
                  <select
                    defaultValue=""
                    disabled={busy}
                    onChange={(e) => attach(file.filename, e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-xs text-slate-300 focus:outline-none focus:border-primary/50 font-sans"
                  >
                    <option value="">Attach to…</option>
                    {catalog.categories.map((category) => {
                      const items = catalog.products.filter((product) => product.category === category.id);
                      if (items.length === 0) return null;
                      return (
                        <optgroup key={category.id} label={category.title}>
                          {items.map((product) => (
                            <option key={`${category.id}-${product.slug}`} value={product.slug}>
                              {productOptionLabel(product.name, product.slug, product.category)}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-500">
                {file.missing ? (
                  <span className="inline-flex items-center gap-1 text-amber-400/80">
                    <AlertTriangle className="w-3 h-3" /> missing on disk
                  </span>
                ) : (
                  fmtDate(file.createdAt)
                )}
              </div>

              <div className="text-right">
                {file.assigned ? (
                  <button
                    type="button"
                    onClick={() => detach(file.filename)}
                    disabled={busy}
                    title="Detach from the product (keeps the file)"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Detach
                  </button>
                ) : (
                  <Link2 className="w-3.5 h-3.5 text-slate-700 inline" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
