import React, { useRef, useState } from 'react';
import { api } from '../lib/api';
import type { CatalogCategoryInput } from '../lib/api';
import type { ProductCategory } from '../types';
import type { Catalog } from '../catalog';
import { isStaticCategory, slugify } from '../catalog';
import { prepareImage } from '../lib/image';
import { Badge, Field, Section, StatusLine, inputCls } from './CatalogFormUi';
import { PLACEHOLDER_PRODUCT_IMAGE } from '../products';
import { ArrowLeft, Check, ImagePlus, Loader2, Trash2 } from 'lucide-react';

interface AdminCategoryFormProps {
  initial: ProductCategory;
  create: boolean;
  isStatic: boolean;
  catalog: Catalog;
  onExit: () => void;
  onSaved: () => Promise<void> | void;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

export const AdminCategoryForm: React.FC<AdminCategoryFormProps> = ({
  initial,
  create,
  isStatic,
  catalog,
  onExit,
  onSaved,
}) => {
  const [draft, setDraft] = useState<ProductCategory>({ ...initial });
  const [mode, setMode] = useState<'create' | 'edit'>(create ? 'create' : 'edit');
  const [savedId, setSavedId] = useState<string | null>(create ? null : initial.id);
  const [idTouched, setIdTouched] = useState(!create);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<ProductCategory>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    setDirty(true);
  };

  const back = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    onExit();
  };

  const uploadImage = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const prepared = await prepareImage(file);
      const result = await api.uploadCatalogImage(
        'category',
        draft.id || slugify(draft.title) || 'category',
        prepared.blob,
        prepared.filename,
        prepared.width,
        prepared.height,
      );
      update({ imageUrl: result.image.url });
    } catch (err) {
      setError((err as Error).message || 'Could not upload that image.');
    } finally {
      setUploading(false);
      if (imageInput.current) imageInput.current.value = '';
    }
  };

  const validate = (): string | null => {
    if (!draft.title.trim()) return 'Category name is required.';
    const id = (draft.id || slugify(draft.title)).trim();
    if (!SLUG_RE.test(id)) {
      return 'Category ID must be lowercase letters, numbers and dashes (max 80 characters).';
    }
    if (mode === 'create' && catalog.getCategory(id)) {
      return 'A category with that ID already exists. Open it from the list instead.';
    }
    return null;
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
      const id = (draft.id || slugify(draft.title)).trim();
      const input: CatalogCategoryInput = {
        // The id is in the URL on update; sending it is harmless and keeps the
        // create path explicit.
        id,
        title: draft.title.trim(),
        description: (draft.description ?? '').trim(),
        applications: (draft.applications ?? '').trim(),
        imageUrl: draft.imageUrl || '',
        linkLabel: (draft.linkLabel ?? 'View Range').trim() || 'View Range',
        range: draft.range === 'sensors' ? 'sensors' : 'lighting',
        sortOrder: Number.isFinite(Number(draft.sortOrder)) ? Number(draft.sortOrder) : 0,
      };

      const result =
        mode === 'create'
          ? await api.createCatalogCategory(input)
          : await api.updateCatalogCategory(savedId ?? id, input);

      setMode('edit');
      setSavedId(result.category.id);
      setIdTouched(true);
      setDraft((previous) => ({ ...previous, ...result.category }));
      setDirty(false);
      setStatus('Category saved. It is live on the next page load.');
      try {
        await onSaved();
      } catch {
        // Saved; a failed list refresh must not look like a save failure.
      }
    } catch (err) {
      setError((err as Error).message || 'Could not save the category.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!savedId) return;
    const reset = isStatic && draft.source === 'db';
    const question = reset
      ? 'Reset this category to the catalogue version? Your edits will be removed.'
      : 'Delete this category? It can only be deleted while it has no products.';
    if (!window.confirm(question)) return;
    setSaving(true);
    setError(null);
    try {
      await api.deleteCatalogCategory(savedId);
      try {
        await onSaved();
      } catch {
        // Deleted successfully; leave the editor.
      }
      onExit();
    } catch (err) {
      setError((err as Error).message || 'Could not remove the category.');
    } finally {
      setSaving(false);
    }
  };

  const badge =
    mode === 'create' ? (
      <Badge tone="primary">New category</Badge>
    ) : isStatic ? (
      draft.source === 'db' ? <Badge tone="amber">Edited catalogue category</Badge> : <Badge>Catalogue category</Badge>
    ) : (
      <Badge tone="primary">Admin category</Badge>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={back} className="btn btn-outline btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to categories
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {badge}
          <Badge>{draft.range === 'sensors' ? 'Sensors' : 'Lighting'}</Badge>
          {dirty && <Badge tone="amber">Unsaved</Badge>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={back} disabled={saving} className="btn btn-outline btn-sm">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving || uploading} className="btn btn-primary btn-sm">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {mode === 'create' ? 'Create category' : 'Save category'}
          </button>
        </div>
      </div>

      {error && <StatusLine tone="error">{error}</StatusLine>}
      {status && <StatusLine tone="ok">{status}</StatusLine>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Section title="Category details" description="Shown on /products and on the category page.">
          <Field label="Category name" required>
            <input
              type="text"
              value={draft.title}
              onChange={(event) => {
                const title = event.target.value;
                update({
                  title,
                  ...(mode === 'create' && !idTouched ? { id: slugify(title) } : {}),
                });
              }}
              placeholder="e.g. Street & Area Lighting"
              className={inputCls}
            />
          </Field>

          <Field
            label="Category ID"
            hint={
              mode === 'edit'
                ? 'The URL is permanent so existing category links keep working.'
                : 'Used in /products/<id>. Lowercase letters, numbers and dashes.'
            }
          >
            <input
              type="text"
              value={draft.id}
              readOnly={mode === 'edit'}
              onChange={(event) => {
                setIdTouched(true);
                update({ id: slugify(event.target.value) });
              }}
              placeholder="street"
              className={inputCls + (mode === 'edit' ? ' opacity-70 cursor-not-allowed' : '')}
            />
          </Field>

          <Field
            label="Range"
            hint="Controls which tab the category appears under on the products page."
          >
            <select
              value={draft.range ?? 'lighting'}
              onChange={(event) =>
                update({ range: event.target.value === 'sensors' ? 'sensors' : 'lighting' })
              }
              className={inputCls}
            >
              <option value="lighting">Lighting Solutions</option>
              <option value="sensors">Sensors</option>
            </select>
          </Field>

          <Field label="Description">
            <textarea
              rows={4}
              value={draft.description}
              onChange={(event) => update({ description: event.target.value })}
              placeholder="What this range covers, in one or two sentences."
              className={inputCls + ' resize-y'}
            />
          </Field>

          <Field label="Applications" hint="A short line shown in the catalogue metadata.">
            <textarea
              rows={2}
              value={draft.applications ?? ''}
              onChange={(event) => update({ applications: event.target.value })}
              placeholder="e.g. Warehouses, retail, commercial"
              className={inputCls + ' resize-y'}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Link label">
              <input
                type="text"
                value={draft.linkLabel}
                onChange={(event) => update({ linkLabel: event.target.value })}
                placeholder="View Range"
                className={inputCls}
              />
            </Field>
            <Field label="Order" hint="New categories sort by this number, then title.">
              <input
                type="number"
                value={Number.isFinite(Number(draft.sortOrder)) ? Number(draft.sortOrder) : 0}
                onChange={(event) => update({ sortOrder: Number(event.target.value) || 0 })}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        <div className="space-y-5">
          <Section
            title="Category image"
            description="Used on the products page and the homepage category teaser."
            actions={
              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                disabled={saving || uploading}
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
              className="hidden"
              onChange={(event) => void uploadImage(event.target.files)}
            />
            <div className="overflow-hidden rounded-xl border border-[#1E293B] bg-white">
              <img
                src={draft.imageUrl || PLACEHOLDER_PRODUCT_IMAGE}
                alt={draft.title || 'Category image'}
                className="aspect-video w-full object-cover"
              />
            </div>
            {uploading && (
              <p className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
              </p>
            )}
            {draft.imageUrl && (
              <button
                type="button"
                onClick={() => update({ imageUrl: '' })}
                className="text-[11px] font-mono text-slate-500 hover:text-red-400"
              >
                Remove image
              </button>
            )}
            <p className="text-[11px] font-sans text-slate-500">
              PNG, JPEG or WebP. Large images are downscaled to 2400 px in the browser.
            </p>
          </Section>

          {mode === 'edit' && (
            <Section title="Danger zone" description="Reset or remove this category record.">
              {isStatic ? (
                <div className="space-y-2">
                  <p className="text-xs font-sans text-slate-400">
                    This category comes from the base catalogue. Resetting removes the admin override
                    and restores the original.
                  </p>
                  <button
                    type="button"
                    onClick={() => void remove()}
                    disabled={saving || draft.source !== 'db'}
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
                    Categories can only be deleted while they contain no products.
                  </p>
                  <button
                    type="button"
                    onClick={() => void remove()}
                    disabled={saving}
                    className="btn btn-outline btn-sm text-red-300 hover:border-red-400/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete category
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
        <button type="button" onClick={save} disabled={saving || uploading} className="btn btn-primary btn-sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {mode === 'create' ? 'Create category' : 'Save category'}
        </button>
      </div>
    </div>
  );
};
