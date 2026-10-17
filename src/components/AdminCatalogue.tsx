import React, { useEffect, useMemo, useState } from 'react';
import type { AdminCatalogProduct } from '../lib/api';
import type { Product, ProductCategory } from '../types';
import { isStaticCategory, isStaticProduct, loadCatalog, refreshCatalog, useCatalog } from '../catalog';
import { displayName, getProductImages } from '../products';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../products';
import { AdminProductForm } from './AdminProductForm';
import { AdminCategoryForm } from './AdminCategoryForm';
import { AdminImportWizard } from './AdminImportWizard';
import { api } from '../lib/api';
import type { CatalogImportCapabilities } from '../lib/api';
import { Badge, StatusLine, inputCls } from './CatalogFormUi';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  FolderTree,
  ImageOff,
  Lightbulb,
  Loader2,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';

type View = 'products' | 'categories';
type ProductFilter = 'all' | 'new' | 'edited' | 'catalogue' | 'hidden' | 'no-images';
type Editor =
  | { type: 'product'; initial: AdminCatalogProduct; create: boolean; sourceLabel?: string }
  | { type: 'category'; initial: ProductCategory; create: boolean }
  | { type: 'import' };

const blankProduct = (category: string): AdminCatalogProduct => ({
  category,
  slug: '',
  name: '',
  summary: '',
  description: '',
  specs: [],
  features: [],
  applications: [],
  images: [],
  imageUrl: '',
  mainImage: undefined,
  pdfUrl: undefined,
  pdfName: undefined,
  pdfSource: 'none',
  warranty: undefined,
  brand: undefined,
  manufacturer: undefined,
  manufacturerModel: undefined,
});

const blankCategory = (): ProductCategory => ({
  id: '',
  title: '',
  description: '',
  applications: '',
  imageUrl: '',
  linkLabel: 'View Range',
  range: 'lighting',
  sortOrder: 0,
});

const thumbnailFor = (product: Product): string => getProductImages(product)[0]?.src || PLACEHOLDER_PRODUCT_IMAGE;

export const AdminCatalogue: React.FC = () => {
  const catalog = useCatalog();
  const [view, setView] = useState<View>('products');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');
  const [capabilities, setCapabilities] = useState<CatalogImportCapabilities | null>(null);
  const [visibilityBusy, setVisibilityBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void loadCatalog();
  }, []);

  useEffect(() => {
    let active = true;
    api
      .catalogImportStatus()
      .then((next) => {
        if (active) setCapabilities(next);
      })
      .catch(() => {
        if (active) {
          setCapabilities({
            enabled: false,
            configured: false,
            model: 'unknown',
            baseUrl: '',
            pdfTools: { available: false, tools: {} },
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const categoryOrder = useMemo(
    () => new Map(catalog.categories.map((category, index) => [category.id, index])),
    [catalog.categories],
  );
  const categoryTitle = (id: string) => catalog.getCategory(id)?.title ?? id;

  const products = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return catalog.products
      .filter((product) => {
        if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
        const staticProduct = isStaticProduct(product.category, product.slug);
        if (productFilter === 'new' && staticProduct) return false;
        if (productFilter === 'edited' && (!staticProduct || product.source !== 'db')) return false;
        if (productFilter === 'catalogue' && (!staticProduct || product.source === 'db')) return false;
        if (productFilter === 'hidden' && product.published !== false) return false;
        if (productFilter === 'no-images' && (product.images ?? []).length > 0) return false;
        if (!needle) return true;
        const haystack = [
          product.name,
          product.slug,
          categoryTitle(product.category),
          product.manufacturer ?? '',
          product.manufacturerModel ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => {
        const categoryDiff =
          (categoryOrder.get(a.category) ?? 999) - (categoryOrder.get(b.category) ?? 999);
        return categoryDiff !== 0 ? categoryDiff : displayName(a).localeCompare(displayName(b));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.products, catalog.categories, search, categoryFilter, productFilter, categoryOrder]);

  const newCount = catalog.products.filter(
    (product) => !isStaticProduct(product.category, product.slug),
  ).length;
  const editedCount = catalog.products.filter(
    (product) =>
      isStaticProduct(product.category, product.slug) && product.source === 'db',
  ).length;
  const hiddenCount = catalog.products.filter((product) => product.published === false).length;

  const apiReady = catalog.status === 'ready';

  const addProduct = () => {
    const defaultCategory =
      categoryFilter !== 'all' ? categoryFilter : catalog.categories[0]?.id ?? '';
    setEditor({ type: 'product', initial: blankProduct(defaultCategory), create: true });
  };

  const addCategory = () => {
    setEditor({ type: 'category', initial: blankCategory(), create: true });
  };

  const openProduct = (product: Product) => {
    setEditor({
      type: 'product',
      initial: product as AdminCatalogProduct,
      create: false,
      sourceLabel: undefined,
    });
  };

  const openCategory = (category: ProductCategory) => {
    setEditor({ type: 'category', initial: category, create: false });
  };

  const handleSaved = async () => {
    await refreshCatalog();
  };

  const toggleVisibility = async (product: Product) => {
    const key = product.category + '/' + product.slug;
    const nextPublished = product.published === false;
    setVisibilityBusy(key);
    setActionError(null);
    try {
      await api.setCatalogProductVisibility(
        product.category,
        product.slug,
        nextPublished,
        product,
      );
      await refreshCatalog();
    } catch (err) {
      setActionError((err as Error).message || 'Could not change the product visibility.');
    } finally {
      setVisibilityBusy(null);
    }
  };

  if (editor?.type === 'import') {
    return (
      <AdminImportWizard
        catalog={catalog}
        capabilities={capabilities}
        onCancel={() => setEditor(null)}
        onUseDraft={(initial, sourceLabel) =>
          setEditor({ type: 'product', initial, create: true, sourceLabel })
        }
      />
    );
  }

  if (editor?.type === 'product') {
    return (
      <AdminProductForm
        initial={editor.initial}
        create={editor.create}
        isStatic={!editor.create && isStaticProduct(editor.initial.category, editor.initial.slug)}
        catalog={catalog}
        sourceLabel={editor.sourceLabel}
        onExit={() => setEditor(null)}
        onSaved={handleSaved}
      />
    );
  }

  if (editor?.type === 'category') {
    return (
      <AdminCategoryForm
        initial={editor.initial}
        create={editor.create}
        isStatic={!editor.create && isStaticCategory(editor.initial.id)}
        catalog={catalog}
        onExit={() => setEditor(null)}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="h-px w-8 bg-primary/40" />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">
              Catalogue
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Products &amp; categories
          </h2>
          <p className="mt-1 max-w-xl text-sm font-sans font-light text-slate-500">
            Add products and categories, edit the base catalogue, and attach images, spec sheets and
            IES files. Saves are live on the next page load.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {view === 'products' && (
            <button
              type="button"
              onClick={() => setEditor({ type: 'import' })}
              className="btn btn-outline btn-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Import from spec sheet
            </button>
          )}
          {view === 'products' ? (
            <button type="button" onClick={addProduct} disabled={!apiReady} className="btn btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Add product
            </button>
          ) : (
            <button type="button" onClick={addCategory} disabled={!apiReady} className="btn btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" />
              Add category
            </button>
          )}
        </div>
      </div>

      {catalog.status === 'error' && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs font-sans text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            The catalogue service is unavailable. The base catalogue is still shown, but edits cannot
            be saved until the API is back.
          </span>
          <button
            type="button"
            onClick={() => void loadCatalog({ force: true })}
            className="btn btn-outline btn-sm"
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {catalog.status === 'loading' && (
        <p className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Syncing the catalogue…
        </p>
      )}

      <div className="flex items-center gap-1 border-b border-[#1E293B]">
        <button
          type="button"
          onClick={() => setView('products')}
          className={
            'flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-sans transition-colors ' +
            (view === 'products'
              ? 'border-primary text-white'
              : 'border-transparent text-slate-500 hover:text-white')
          }
        >
          <Package className="h-4 w-4" />
          Products
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            {catalog.products.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setView('categories')}
          className={
            'flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-sans transition-colors ' +
            (view === 'categories'
              ? 'border-primary text-white'
              : 'border-transparent text-slate-500 hover:text-white')
          }
        >
          <FolderTree className="h-4 w-4" />
          Categories
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            {catalog.categories.length}
          </span>
        </button>
      </div>

      {view === 'products' ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, slug, manufacturer or model…"
                className={inputCls + ' pl-10'}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={inputCls + ' lg:w-52'}
            >
              <option value="all">All categories</option>
              {catalog.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
            <select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value as ProductFilter)}
              className={inputCls + ' lg:w-44'}
            >
              <option value="all">All products</option>
              <option value="new">New ({newCount})</option>
              <option value="edited">Edited ({editedCount})</option>
              <option value="catalogue">Catalogue only</option>
              <option value="hidden">Hidden ({hiddenCount})</option>
              <option value="no-images">No images</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500">
            <span>{products.length} shown</span>
            <span className="text-slate-700">·</span>
            <span>{catalog.products.length} total</span>
            <span className="text-slate-700">·</span>
            <span className="text-emerald-300">{catalog.products.length - hiddenCount} live</span>
            <span className="text-slate-700">·</span>
            <span className="text-amber-300">{hiddenCount} hidden</span>
            <span className="text-slate-700">·</span>
            <span className="text-primary">{newCount} new</span>
            <span className="text-slate-700">·</span>
            <span className="text-amber-300">{editedCount} edited</span>
          </div>

          {actionError && <StatusLine tone="error">{actionError}</StatusLine>}

          <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
            <div className="hidden grid-cols-[56px_minmax(0,1fr)_140px_170px_190px] gap-4 border-b border-[#1E293B] bg-white/[0.02] px-4 py-2.5 sm:grid">
              {['', 'Product', 'Category', 'Media', ''].map((label, index) => (
                <span
                  key={label + index}
                  className="text-[10px] font-mono uppercase tracking-wider text-slate-500"
                >
                  {label}
                </span>
              ))}
            </div>

            {products.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Package className="mx-auto mb-3 h-6 w-6 text-slate-600" />
                <p className="text-sm font-sans text-slate-400">No products match those filters.</p>
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={!apiReady}
                  className="mt-3 text-xs font-mono text-primary hover:underline"
                >
                  Add a product
                </button>
              </div>
            ) : (
              products.map((product) => {
                const staticProduct = isStaticProduct(product.category, product.slug);
                const edited = staticProduct && product.source === 'db';
                const isNew = !staticProduct;
                const imageCount = (product.images ?? []).length;
                const iesCount = catalog.iesMap[product.slug]?.length ?? 0;
                const isPublished = product.published !== false;
                const rowKey = product.category + '/' + product.slug;
                return (
                  <div
                    key={product.category + '/' + product.slug}
                    className="grid grid-cols-1 gap-3 border-b border-[#1E293B]/60 px-4 py-3 last:border-b-0 sm:grid-cols-[56px_minmax(0,1fr)_140px_170px_190px] sm:items-center sm:gap-4"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#1E293B] bg-white">
                      <img
                        src={thumbnailFor(product)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain p-1"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white font-display">
                          {displayName(product)}
                        </p>
                        {isNew ? (
                          <Badge tone="primary">New</Badge>
                        ) : edited ? (
                          <Badge tone="amber">Edited</Badge>
                        ) : (
                          <Badge>Catalogue</Badge>
                        )}
                        <Badge tone={isPublished ? 'green' : 'amber'}>
                          {isPublished ? 'Live' : 'Hidden'}
                        </Badge>
                      </div>
                      <p className="truncate text-[11px] font-mono text-slate-500">
                        {product.slug}
                        {product.manufacturerModel ? ' · ' + product.manufacturerModel : ''}
                      </p>
                    </div>

                    <p className="truncate text-xs font-sans text-slate-400">
                      {categoryTitle(product.category)}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {product.pdfUrl ? (
                        <Badge tone="green">
                          <FileText className="h-2.5 w-2.5" /> PDF
                        </Badge>
                      ) : (
                        <Badge>No PDF</Badge>
                      )}
                      {iesCount > 0 ? (
                        <Badge>
                          <Lightbulb className="h-2.5 w-2.5" /> {iesCount} IES
                        </Badge>
                      ) : (
                        <Badge>No IES</Badge>
                      )}
                      {imageCount > 0 ? (
                        <Badge>{imageCount} img</Badge>
                      ) : (
                        <Badge tone="red">
                          <ImageOff className="h-2.5 w-2.5" /> No images
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-nowrap items-center gap-1.5 justify-self-start sm:justify-self-end">
                      <button
                        type="button"
                        onClick={() => void toggleVisibility(product)}
                        disabled={!apiReady || visibilityBusy === rowKey}
                        title={isPublished ? 'Hide from the public site' : 'Publish to the public site'}
                        className={
                          'btn btn-outline btn-row ' +
                          (isPublished ? 'text-amber-300' : 'text-emerald-300')
                        }
                      >
                        {visibilityBusy === rowKey ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isPublished ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        {isPublished ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openProduct(product)}
                        disabled={!apiReady}
                        className="btn btn-outline btn-row"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories…"
                className={inputCls + ' pl-10'}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
            {catalog.categories.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FolderTree className="mx-auto mb-3 h-6 w-6 text-slate-600" />
                <p className="text-sm font-sans text-slate-400">No categories yet.</p>
                <button
                  type="button"
                  onClick={addCategory}
                  disabled={!apiReady}
                  className="mt-3 text-xs font-mono text-primary hover:underline"
                >
                  Add a category
                </button>
              </div>
            ) : (
              catalog.categories
                .filter((category) => {
                  const needle = search.trim().toLowerCase();
                  if (!needle) return true;
                  return (category.title + ' ' + category.id).toLowerCase().includes(needle);
                })
                .map((category) => {
                  const staticCategory = isStaticCategory(category.id);
                  const edited = staticCategory && category.source === 'db';
                  const isNew = !staticCategory;
                  const productCount = catalog.productsByCategory[category.id]?.length ?? 0;
                  return (
                    <div
                      key={category.id}
                      className="grid grid-cols-1 gap-3 border-b border-[#1E293B]/60 px-4 py-3 last:border-b-0 sm:grid-cols-[96px_minmax(0,1fr)_130px_120px_70px] sm:items-center sm:gap-4"
                    >
                      <div className="h-14 w-24 overflow-hidden rounded-lg border border-[#1E293B] bg-white">
                        <img
                          src={category.imageUrl || PLACEHOLDER_PRODUCT_IMAGE}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white font-display">
                            {category.title}
                          </p>
                          {isNew ? (
                            <Badge tone="primary">New</Badge>
                          ) : edited ? (
                            <Badge tone="amber">Edited</Badge>
                          ) : (
                            <Badge>Catalogue</Badge>
                          )}
                        </div>
                        <p className="truncate text-[11px] font-mono text-slate-500">{category.id}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={category.range === 'sensors' ? 'green' : 'muted'}>
                          {category.range === 'sensors' ? 'Sensors' : 'Lighting'}
                        </Badge>
                      </div>
                      <p className="text-xs font-sans text-slate-400">
                        {productCount} product{productCount === 1 ? '' : 's'}
                      </p>
                      <button
                        type="button"
                        onClick={() => openCategory(category)}
                        disabled={!apiReady}
                        className="btn btn-outline btn-sm justify-self-start sm:justify-self-end"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </>
      )}
    </div>
  );
};
