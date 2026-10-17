import React, { useEffect, useRef, useState } from 'react';
import { api, iesAdminApi } from '../lib/api';
import type { AdminCatalogProduct, CatalogProductInput, IesLibraryFile } from '../lib/api';
import type { ProductImage } from '../types';
import type { Catalog } from '../catalog';
import { isStaticProduct, slugify } from '../catalog';
import { displayName } from '../products';
import { prepareImage } from '../lib/image';
import {
  Badge,
  Field,
  ListEditor,
  Section,
  SpecEditor,
  StatusLine,
  inputCls,
  smallInputCls,
} from './CatalogFormUi';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ExternalLink,
  FileText,
  FileUp,
  ImagePlus,
  Loader2,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';

interface AdminProductFormProps {
  initial: AdminCatalogProduct;
  create: boolean;
  isStatic: boolean;
  catalog: Catalog;
  /** Present when this draft came from the AI spec-sheet import. */
  sourceLabel?: string;
  onExit: () => void;
  onSaved: () => Promise<void> | void;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const MAX_PDF_BYTES = 25 * 1024 * 1024;

const newDraft = (initial: AdminCatalogProduct): AdminCatalogProduct => ({
  ...initial,
  specs: initial.specs ? [...initial.specs] : [],
  features: initial.features ? [...initial.features] : [],
  applications: initial.applications ? [...initial.applications] : [],
  images: initial.images ? initial.images.map((image) => ({ ...image })) : [],
});

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  initial,
  create,
  isStatic,
  catalog,
  sourceLabel,
  onExit,
  onSaved,
}) => {
  const [draft, setDraft] = useState<AdminCatalogProduct>(() => newDraft(initial));
  const [mode, setMode] = useState<'create' | 'edit'>(create ? 'create' : 'edit');
  const [savedKey, setSavedKey] = useState<{ category: string; slug: string } | null>(
    create ? null : { category: initial.category, slug: initial.slug },
  );
  const [slugTouched, setSlugTouched] = useState(!create);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [iesFiles, setIesFiles] = useState<IesLibraryFile[]>([]);
  const [pendingIes, setPendingIes] = useState<File[]>([]);
  const [iesLoading, setIesLoading] = useState(false);
  const [iesBusy, setIesBusy] = useState(false);
  const [iesStatus, setIesStatus] = useState<string | null>(null);
  const [iesError, setIesError] = useState<string | null>(null);

  const imageInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const iesInput = useRef<HTMLInputElement>(null);

  const images = draft.images ?? [];
  const specs = draft.specs ?? [];
  const features = draft.features ?? [];
  const applications = draft.applications ?? [];
  const pdfSource = draft.pdfSource ?? 'none';
  const busy = saving || uploading > 0 || iesBusy || previewBusy;

  const update = (patch: Partial<AdminCatalogProduct>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    setDirty(true);
  };

  const loadIes = async (category: string, slug: string) => {
    setIesLoading(true);
    setIesError(null);
    try {
      const data = await iesAdminApi.library();
      setIesFiles(
        data.files.filter(
          (file) =>
            file.assigned &&
            file.productSlug === slug &&
            (!file.categorySlug || file.categorySlug === category),
        ),
      );
    } catch (err) {
      setIesError((err as Error).message || 'Could not load the IES files.');
    } finally {
      setIesLoading(false);
    }
  };

  useEffect(() => {
    if (!savedKey) return;
    void loadIes(savedKey.category, savedKey.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey?.category, savedKey?.slug]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const back = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    onExit();
  };

  const setPdfSource = (next: 'none' | 'uploaded' | 'generated') => {
    if (next === 'none') {
      update({ pdfSource: 'none', pdfUrl: null, pdfName: null });
    } else if (next === 'generated') {
      update({ pdfSource: 'generated' });
    } else {
      update({ pdfSource: 'uploaded' });
    }
  };

  const uploadImages = async (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;
    setError(null);
    setStatus(null);
    setUploading((count) => count + files.length);
    const prefix = draft.slug || slugify(draft.name) || 'product';
    for (const file of files) {
      try {
        const prepared = await prepareImage(file);
        const result = await api.uploadCatalogImage(
          'product',
          prefix,
          prepared.blob,
          prepared.filename,
          prepared.width,
          prepared.height,
        );
        const image: ProductImage = {
          src: result.image.url,
          alt: (draft.name || 'Product') + ' image',
          fit: 'contain',
          width: prepared.width,
          height: prepared.height,
        };
        setDraft((previous) => {
          const nextImages = [...(previous.images ?? []), image];
          return {
            ...previous,
            images: nextImages,
            mainImage: previous.mainImage || image.src,
          };
        });
        setDirty(true);
      } catch (err) {
        setError((err as Error).message || 'Could not upload that image.');
      } finally {
        setUploading((count) => Math.max(0, count - 1));
      }
    }
    if (imageInput.current) imageInput.current.value = '';
  };

  const updateImage = (index: number, patch: Partial<ProductImage>) => {
    const next = images.map((image, i) => (i === index ? { ...image, ...patch } : image));
    update({ images: next });
  };

  const removeImage = (index: number) => {
    const removed = images[index];
    const next = images.filter((_, i) => i !== index);
    const mainImage =
      draft.mainImage && draft.mainImage !== removed?.src ? draft.mainImage : next[0]?.src ?? '';
    update({ images: next, mainImage });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const temporary = next[index];
    next[index] = next[target];
    next[target] = temporary;
    update({ images: next });
  };

  const uploadPdf = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    if (file.size > MAX_PDF_BYTES) {
      setError('PDF is larger than the 25 MB upload limit.');
      return;
    }
    setError(null);
    setUploading((count) => count + 1);
    try {
      const result = await api.uploadCatalogSpecSheet(
        draft.slug || slugify(draft.name) || 'spec-sheet',
        file,
      );
      update({
        pdfSource: 'uploaded',
        pdfUrl: result.pdf.url,
        pdfName: result.pdf.originalName || file.name,
      });
    } catch (err) {
      setError((err as Error).message || 'Could not upload that PDF.');
    } finally {
      setUploading((count) => Math.max(0, count - 1));
      if (pdfInput.current) pdfInput.current.value = '';
    }
  };

  const renameIes = (file: File) =>
    new File([file], (draft.name || draft.slug || 'product') + ' ' + file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });

  const uploadIes = async (files: File[]) => {
    if (!savedKey || files.length === 0) return;
    setIesBusy(true);
    setIesError(null);
    setIesStatus(null);
    try {
      for (const file of files) {
        await iesAdminApi.upload(savedKey.slug, savedKey.category, renameIes(file));
      }
      await loadIes(savedKey.category, savedKey.slug);
      setIesStatus(files.length + ' IES file(s) attached.');
    } catch (err) {
      setIesError((err as Error).message || 'Could not upload that IES file.');
    } finally {
      setIesBusy(false);
      if (iesInput.current) iesInput.current.value = '';
    }
  };

  const onIesSelected = (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;
    if (!savedKey) {
      setPendingIes((previous) => [...previous, ...files]);
      if (iesInput.current) iesInput.current.value = '';
      return;
    }
    void uploadIes(files);
  };

  const detachIes = async (filename: string) => {
    if (!savedKey) return;
    setIesBusy(true);
    setIesError(null);
    try {
      await iesAdminApi.detach(filename);
      await loadIes(savedKey.category, savedKey.slug);
      setIesStatus('IES file detached. The file stays in the library.');
    } catch (err) {
      setIesError((err as Error).message || 'Could not detach that IES file.');
    } finally {
      setIesBusy(false);
    }
  };

  const validate = (): string | null => {
    if (!draft.name.trim()) return 'Product name is required.';
    if (!draft.category) return 'Choose a category.';
    const slug = (draft.slug || slugify(draft.name)).trim();
    if (!SLUG_RE.test(slug)) {
      return 'Slug must be lowercase letters, numbers and dashes (max 80 characters).';
    }
    if (mode === 'create') {
      if (catalog.getProduct(draft.category, slug) || isStaticProduct(draft.category, slug)) {
        return 'A product with this slug already exists in that category.';
      }
      const existing = catalog.products.find((product) => product.slug === slug);
      if (existing) {
        return (
          'That slug is already used by ' +
          displayName(existing) +
          '. IES files are keyed by slug, so choose a unique one.'
        );
      }
    }
    if (pdfSource === 'uploaded' && !draft.pdfUrl) {
      return 'Upload a PDF, or choose "No spec sheet".';
    }
    return null;
  };

  const buildPayload = (): CatalogProductInput => {
    const slug = (draft.slug || slugify(draft.name)).trim();
    const cleanImages = images.filter((image) => image.src);
    const mainImage = cleanImages.some((image) => image.src === draft.mainImage)
      ? draft.mainImage ?? null
      : cleanImages[0]?.src ?? null;
    return {
      category: draft.category,
      slug,
      name: draft.name.trim(),
      summary: (draft.summary ?? '').trim(),
      description: (draft.description ?? '').trim(),
      specs: specs
        .map((spec) => ({ label: spec.label.trim(), value: spec.value.trim() }))
        .filter((spec) => spec.label && spec.value),
      features: features.map((item) => item.trim()).filter(Boolean),
      applications: applications.map((item) => item.trim()).filter(Boolean),
      images: cleanImages,
      mainImage,
      pdfSource,
      pdfUrl: pdfSource === 'uploaded' ? draft.pdfUrl ?? null : null,
      pdfName: pdfSource === 'uploaded' ? draft.pdfName ?? null : null,
      warranty: (draft.warranty ?? '').trim() || null,
      brand: (draft.brand ?? '').trim() || null,
      manufacturer: (draft.manufacturer ?? '').trim() || null,
      manufacturerModel: (draft.manufacturerModel ?? '').trim() || null,
      datasheet: draft.datasheet ?? undefined,
      sourceImportId: draft.sourceImportId ?? null,
    };
  };

  const previewDatasheet = async () => {
    if (!draft.name.trim()) {
      setError('Add a product name before previewing the LumenX datasheet.');
      return;
    }
    // Open the tab synchronously so the browser treats it as part of the click.
    const tab = window.open('about:blank', '_blank');
    setPreviewBusy(true);
    setError(null);
    try {
      const payload = buildPayload();
      const blob = await api.previewCatalogDatasheet({
        ...payload,
        categoryTitle: catalog.getCategory(draft.category)?.title,
      });
      const url = URL.createObjectURL(blob);
      if (!tab) {
        URL.revokeObjectURL(url);
        throw new Error('The preview was blocked by the browser. Allow pop-ups for this site and retry.');
      }
      tab.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (tab) tab.close();
      setError((err as Error).message || 'Could not render the LumenX datasheet.');
    } finally {
      setPreviewBusy(false);
    }
  };

  const save = async () => {
    setError(null);
    setStatus(null);
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      const result =
        mode === 'create'
          ? await api.createCatalogProduct(payload)
          : await api.updateCatalogProduct(savedKey?.category ?? payload.category, savedKey?.slug ?? payload.slug, payload);
      const saved = result.product;
      const nextKey = { category: saved.category, slug: saved.slug };

      setMode('edit');
      setSavedKey(nextKey);
      setSlugTouched(true);
      setDraft((previous) => ({
        ...previous,
        ...saved,
        specs: saved.specs ?? previous.specs,
        features: saved.features ?? previous.features,
        applications: saved.applications ?? previous.applications,
        images: saved.images ?? previous.images,
      }));
      setDirty(false);

      let message = 'Product saved. It is live on the next page load.';
      if (pendingIes.length > 0) {
        let failures = 0;
        for (const file of pendingIes) {
          try {
            await iesAdminApi.upload(nextKey.slug, nextKey.category, renameIes(file));
          } catch {
            failures += 1;
          }
        }
        setPendingIes([]);
        await loadIes(nextKey.category, nextKey.slug);
        if (failures > 0) {
          message += ' ' + failures + ' IES file(s) could not be uploaded; retry from the IES section.';
        }
      }
      setStatus(message);
      try {
        await onSaved();
      } catch {
        // The product is saved; a failed list refresh must not look like a save failure.
      }
    } catch (err) {
      setError((err as Error).message || 'Could not save the product.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!savedKey) return;
    const reset = isStatic && draft.source === 'db';
    const question = reset
      ? 'Reset this product to the catalogue version? Your edits will be removed.'
      : 'Delete this product? This cannot be undone.';
    if (!window.confirm(question)) return;
    setSaving(true);
    setError(null);
    try {
      await api.deleteCatalogProduct(savedKey.category, savedKey.slug);
      try {
        await onSaved();
      } catch {
        // The delete succeeded; still leave the editor.
      }
      onExit();
    } catch (err) {
      setError((err as Error).message || 'Could not remove the product.');
    } finally {
      setSaving(false);
    }
  };

  const categoryTitle = catalog.getCategory(draft.category)?.title ?? draft.category;
  const modeBadge = mode === 'create' ? (
    <Badge tone="primary">New product</Badge>
  ) : isStatic ? (
    draft.source === 'db' ? <Badge tone="amber">Edited catalogue product</Badge> : <Badge>Catalogue product</Badge>
  ) : (
    <Badge tone="primary">Admin product</Badge>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={back} className="btn btn-outline btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to products
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {modeBadge}
          <Badge>{categoryTitle || 'No category'}</Badge>
          {dirty && <Badge tone="amber">Unsaved</Badge>}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={back} disabled={saving} className="btn btn-outline btn-sm">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={busy} className="btn btn-primary btn-sm">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {mode === 'create' ? 'Create product' : 'Save product'}
          </button>
        </div>
      </div>

      {error && <StatusLine tone="error">{error}</StatusLine>}
      {status && <StatusLine tone="ok">{status}</StatusLine>}

      {draft.sourceImportId && (
        <div className="flex flex-wrap items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-sans text-slate-300">
              Drafted from{' '}
              <span className="font-semibold text-white">
                {sourceLabel || 'a manufacturer spec sheet'}
              </span>
              . Review every value against the source before publishing.
            </p>
            <a
              href={'/api/admin/catalog/imports/' + draft.sourceImportId + '/source'}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-primary/80 hover:text-primary"
            >
              Open source PDF <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Section title="Product details" description="The name and copy shown on the product page.">
            <Field label="Product name" required>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => {
                  const name = event.target.value;
                  update({
                    name,
                    ...(mode === 'create' && !slugTouched ? { slug: slugify(name) } : {}),
                  });
                }}
                placeholder="e.g. COB Anti-glare Downlight 2"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Category"
                required
                hint={mode === 'edit' ? 'Fixed after creation so the product URL stays stable.' : undefined}
              >
                <select
                  value={draft.category}
                  disabled={mode === 'edit'}
                  onChange={(event) => update({ category: event.target.value })}
                  className={inputCls + (mode === 'edit' ? ' opacity-70 cursor-not-allowed' : '')}
                >
                  <option value="">Select a category…</option>
                  {catalog.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Brand">
                <select
                  value={draft.brand ?? ''}
                  onChange={(event) => update({ brand: event.target.value || null })}
                  className={inputCls}
                >
                  <option value="">LumenX (own brand)</option>
                  <option value="orbitx">OrbitX (partner)</option>
                </select>
              </Field>
            </div>

            <Field
              label="Slug"
              hint={
                mode === 'edit'
                  ? 'The URL is permanent so existing links and IES mappings keep working.'
                  : 'Lowercase letters, numbers and dashes. Generated from the name until you edit it.'
              }
            >
              <input
                type="text"
                value={draft.slug}
                readOnly={mode === 'edit'}
                onChange={(event) => {
                  setSlugTouched(true);
                  update({ slug: slugify(event.target.value) });
                }}
                placeholder="cob-anti-glare-downlight-2"
                className={inputCls + (mode === 'edit' ? ' opacity-70 cursor-not-allowed' : '')}
              />
            </Field>

            <Field label="Summary" hint="One sentence used on product cards and in the page description.">
              <textarea
                rows={2}
                value={draft.summary ?? ''}
                onChange={(event) => update({ summary: event.target.value })}
                placeholder="Diffused recessed LED downlight with low-glare output."
                className={inputCls + ' resize-y'}
              />
            </Field>

            <Field label="Description" hint="The longer product-page copy.">
              <textarea
                rows={5}
                value={draft.description ?? ''}
                onChange={(event) => update({ description: event.target.value })}
                placeholder="Describe the fitting, its construction, options and applications."
                className={inputCls + ' resize-y'}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Warranty">
                <input
                  type="text"
                  value={draft.warranty ?? ''}
                  onChange={(event) => update({ warranty: event.target.value })}
                  placeholder="e.g. 5-year operational warranty"
                  className={inputCls}
                />
              </Field>
              <Field label="Manufacturer">
                <input
                  type="text"
                  value={draft.manufacturer ?? ''}
                  onChange={(event) => update({ manufacturer: event.target.value })}
                  placeholder="e.g. OrbitX, LEDwise"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Manufacturer model">
              <input
                type="text"
                value={draft.manufacturerModel ?? ''}
                onChange={(event) => update({ manufacturerModel: event.target.value })}
                placeholder="e.g. ACE-HP-S"
                className={inputCls}
              />
            </Field>
          </Section>

          <Section
            title="Specifications"
            description="These feed the technical table and the four product-card tiles."
          >
            <SpecEditor specs={specs} onChange={(next) => update({ specs: next })} />
            <p className="text-[11px] font-sans text-slate-500">
              The card looks for Wattage, IP Rating, Lumens / Luminous Flux, Efficacy, CCT, CRI, Beam
              Angle and Warranty. Missing slots show a deliberate placeholder.
            </p>
          </Section>

          <Section title="Features and applications" description="Short bullets; one row per bullet.">
            <ListEditor
              label="Key features"
              items={features}
              onChange={(next) => update({ features: next })}
              placeholder="e.g. Flicker-free operation"
              addLabel="Add feature"
            />
            <ListEditor
              label="Applications"
              items={applications}
              onChange={(next) => update({ applications: next })}
              placeholder="e.g. Corporate offices"
              addLabel="Add application"
            />
          </Section>
        </div>

        <div className="space-y-5">
          <Section
            title="Product images"
            description="Upload multiple images, then choose which one is the main image."
            actions={
              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                disabled={busy}
                className="btn btn-outline btn-sm"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Upload
              </button>
            }
          >
            <input
              ref={imageInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(event) => void uploadImages(event.target.files)}
            />

            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                disabled={busy}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#1E293B] bg-white/[0.02] px-4 py-10 text-slate-500 transition-colors hover:border-primary/30 hover:text-primary"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-sans">Upload the first product image</span>
                <span className="text-[10px] font-mono text-slate-600">PNG / JPEG / WebP · max 12 MB</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div
                    key={image.src}
                    className="overflow-hidden rounded-xl border border-[#1E293B] bg-white"
                  >
                    <div className="relative aspect-[4/3]">
                      <img
                        src={image.src}
                        alt={image.alt || ''}
                        className="h-full w-full object-contain p-2"
                      />
                      {image.src === draft.mainImage && (
                        <span className="absolute left-2 top-2 rounded bg-[#06090F]/85 px-1.5 py-0.5 text-[9px] font-mono tracking-wider text-primary">
                          MAIN
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 bg-[#0A0D14] p-2">
                      <input
                        type="text"
                        value={image.alt ?? ''}
                        onChange={(event) => updateImage(index, { alt: event.target.value })}
                        placeholder="Alt text"
                        className={smallInputCls}
                      />
                      <select
                        value={image.fit ?? 'contain'}
                        onChange={(event) =>
                          updateImage(index, {
                            fit: event.target.value === 'cover' ? 'cover' : 'contain',
                          })
                        }
                        className={smallInputCls}
                      >
                        <option value="contain">Product render (contain)</option>
                        <option value="cover">Lifestyle photo (cover)</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => update({ mainImage: image.src })}
                          disabled={image.src === draft.mainImage}
                          title="Set as main image"
                          aria-label="Set as main image"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-[#1E293B] text-slate-500 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-default disabled:text-primary"
                        >
                          <Star className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, -1)}
                          disabled={index === 0}
                          title="Move left"
                          aria-label="Move image left"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-[#1E293B] text-slate-500 transition-colors hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3 -rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 1)}
                          disabled={index === images.length - 1}
                          title="Move right"
                          aria-label="Move image right"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-[#1E293B] text-slate-500 transition-colors hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3 -rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          title="Remove image"
                          aria-label="Remove image"
                          className="ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-[#1E293B] text-slate-500 transition-colors hover:border-red-400/40 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {uploading > 0 && (
              <p className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading {uploading} file(s)…
              </p>
            )}
            <p className="text-[11px] font-sans text-slate-500">
              The main image is used on product cards and shown first in the gallery. Large images
              are downscaled in the browser to 2400 px before upload.
            </p>
          </Section>

          <Section title="Spec sheet" description="The PDF customers download from the product page.">
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-[#1E293B] p-1">
              {(
                [
                  { id: 'none', label: 'None' },
                  { id: 'uploaded', label: 'Upload PDF' },
                  { id: 'generated', label: 'LumenX sheet' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPdfSource(option.id)}
                  className={
                    'cursor-pointer rounded px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ' +
                    (pdfSource === option.id
                      ? 'bg-primary/15 text-primary'
                      : 'text-slate-500 hover:text-white')
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            {pdfSource === 'uploaded' && (
              <div className="space-y-3">
                {draft.pdfUrl ? (
                  <div className="flex items-center gap-3 rounded-lg border border-[#1E293B] bg-white/[0.02] px-3 py-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary/60" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">
                        {draft.pdfName || 'Spec sheet.pdf'}
                      </p>
                      <a
                        href={draft.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-primary hover:underline"
                      >
                        Open current PDF
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => update({ pdfSource: 'uploaded', pdfUrl: null, pdfName: null })}
                      className="cursor-pointer text-[11px] font-mono text-slate-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pdfInput.current?.click()}
                    disabled={busy}
                    className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#1E293B] bg-white/[0.02] px-4 py-8 text-slate-500 transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-xs font-sans">Upload a PDF spec sheet</span>
                    <span className="text-[10px] font-mono text-slate-600">PDF · max 25 MB</span>
                  </button>
                )}
                <input
                  ref={pdfInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(event) => void uploadPdf(event.target.files)}
                />
                {draft.pdfUrl && (
                  <button
                    type="button"
                    onClick={() => pdfInput.current?.click()}
                    disabled={busy}
                    className="text-[11px] font-mono text-primary/80 hover:text-primary"
                  >
                    Replace PDF
                  </button>
                )}
              </div>
            )}

            {pdfSource === 'none' && (
              <p className="text-xs font-sans text-slate-500">
                No spec sheet will be offered. The product page still shows the contact route.
              </p>
            )}

            {pdfSource === 'generated' && (
              <div className="space-y-3">
                <p className="text-xs font-sans text-slate-400">
                  LumenX will render a one-page A4 datasheet from this product's fields using the
                  branded template. Preview it before saving.
                </p>
                <button
                  type="button"
                  onClick={() => void previewDatasheet()}
                  disabled={busy}
                  className="btn btn-outline btn-sm"
                >
                  {previewBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  Preview LumenX sheet
                </button>
                <p className="text-[11px] font-sans text-slate-500">
                  For imported products this is the default. The full spec table stays on the product
                  page; the sheet is a concise summary. Upload a PDF instead if the layout is not
                  suitable.
                </p>
              </div>
            )}
          </Section>

          <Section
            title="IES photometric files"
            description="Multiple LM-63 files can be attached; downloads stay behind the login gate."
            actions={
              <button
                type="button"
                onClick={() => iesInput.current?.click()}
                disabled={busy || iesBusy}
                className="btn btn-outline btn-sm"
              >
                <FileUp className="h-3.5 w-3.5" />
                Add IES
              </button>
            }
          >
            <input
              ref={iesInput}
              type="file"
              accept=".ies,application/octet-stream"
              multiple
              className="hidden"
              onChange={(event) => onIesSelected(event.target.files)}
            />

            {!savedKey && (
              <p className="rounded-lg border border-[#1E293B] bg-white/[0.02] px-3 py-2 text-[11px] font-sans text-slate-500">
                IES files selected now will be uploaded when you create the product. Their names are
                prefixed with the product name so the library stays readable.
              </p>
            )}

            {iesLoading && (
              <p className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading attached IES files…
              </p>
            )}

            {iesFiles.length > 0 && (
              <ul className="divide-y divide-[#1E293B]/60 rounded-lg border border-[#1E293B]">
                {iesFiles.map((file) => (
                  <li key={file.filename} className="flex items-center gap-3 px-3 py-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                    <span className="min-w-0 flex-1 truncate text-xs font-mono text-slate-300" title={file.filename}>
                      {file.filename}
                    </span>
                    <button
                      type="button"
                      onClick={() => void detachIes(file.filename)}
                      disabled={iesBusy}
                      className="cursor-pointer text-[10px] font-mono text-slate-500 hover:text-red-400"
                    >
                      Detach
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {pendingIes.length > 0 && (
              <ul className="space-y-1.5">
                {pendingIes.map((file, index) => (
                  <li key={file.name + index} className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <FileUp className="h-3 w-3 shrink-0 text-primary/60" />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setPendingIes((previous) => previous.filter((_, i) => i !== index))}
                      className="cursor-pointer text-slate-500 hover:text-red-400"
                      aria-label="Remove pending IES file"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!iesLoading && savedKey && iesFiles.length === 0 && pendingIes.length === 0 && (
              <p className="text-xs font-sans text-slate-500">
                No IES files attached yet. The product page will show the contact route instead.
              </p>
            )}

            {iesBusy && (
              <p className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Updating IES files…
              </p>
            )}
            {iesStatus && <StatusLine tone="ok">{iesStatus}</StatusLine>}
            {iesError && <StatusLine tone="error">{iesError}</StatusLine>}
          </Section>

          {mode === 'edit' && (
            <Section title="Danger zone" description="Reset or remove this catalogue record.">
              {isStatic ? (
                <div className="space-y-2">
                  <p className="text-xs font-sans text-slate-400">
                    This product comes from the base catalogue. Resetting deletes the admin override
                    and restores the original record.
                  </p>
                  <button
                    type="button"
                    onClick={() => void remove()}
                    disabled={busy || draft.source !== 'db'}
                    className="btn btn-outline btn-sm text-red-300 hover:border-red-400/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Reset to catalogue version
                  </button>
                  {draft.source !== 'db' && (
                    <p className="text-[11px] font-mono text-slate-600">No override has been saved yet.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-sans text-slate-400">
                    This product was created in the admin. Deleting it removes it from the catalogue
                    immediately. Uploaded files are retained on disk.
                  </p>
                  <button
                    type="button"
                    onClick={() => void remove()}
                    disabled={busy}
                    className="btn btn-outline btn-sm text-red-300 hover:border-red-400/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete product
                  </button>
                </div>
              )}
            </Section>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#1E293B] pt-4">
        <button type="button" onClick={back} disabled={saving} className="btn btn-outline btn-sm">
          Cancel
        </button>
        <button type="button" onClick={save} disabled={busy} className="btn btn-primary btn-sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {mode === 'create' ? 'Create product' : 'Save product'}
        </button>
      </div>
    </div>
  );
};
