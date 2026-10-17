import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type {
  AdminCatalogProduct,
  CatalogImportCapabilities,
  CatalogImportJob,
} from '../lib/api';
import type { ProductImage } from '../types';
import type { Catalog } from '../catalog';
import { slugify } from '../catalog';
import { Badge, Field, Section, StatusLine, inputCls } from './CatalogFormUi';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ExternalLink,
  FileUp,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';

interface AdminImportWizardProps {
  catalog: Catalog;
  capabilities: CatalogImportCapabilities | null;
  onCancel: () => void;
  onUseDraft: (initial: AdminCatalogProduct, sourceLabel: string) => void;
}

const RUNNING: CatalogImportJob['status'][] = ['queued', 'extracting', 'analyzing'];
const MAX_PDF_BYTES = 25 * 1024 * 1024;

const confidenceTone = (confidence: string | undefined) =>
  confidence === 'high' ? 'green' : confidence === 'low' ? 'red' : 'amber';

export const AdminImportWizard: React.FC<AdminImportWizardProps> = ({
  catalog,
  capabilities,
  onCancel,
  onUseDraft,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageHint, setPageHint] = useState('');
  const [modelHint, setModelHint] = useState('');
  const [preferredCategory, setPreferredCategory] = useState('');
  const [job, setJob] = useState<CatalogImportJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const running = job ? RUNNING.includes(job.status) : false;

  useEffect(() => {
    if (!job || !RUNNING.includes(job.status)) return;
    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const { import: next } = await api.getCatalogImport(job.id);
        if (active) setJob(next);
      } catch (err) {
        if (active) setError((err as Error).message || 'Could not check the import status.');
      }
    }, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [job?.id, job?.status]);

  const chooseFile = (fileList: FileList | null) => {
    const next = fileList?.[0] ?? null;
    setError(null);
    if (!next) return;
    if (!next.name.toLowerCase().endsWith('.pdf')) {
      setError('Choose a PDF spec sheet.');
      return;
    }
    if (next.size > MAX_PDF_BYTES) {
      setError('That PDF is larger than the 25 MB upload limit.');
      return;
    }
    setFile(next);
    setJob(null);
  };

  const start = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const source = await api.uploadCatalogImportSource(file);
      const hintParts = [modelHint.trim()];
      if (preferredCategory) {
        const category = catalog.getCategory(preferredCategory);
        hintParts.push('Preferred category: ' + (category?.title ?? preferredCategory));
      }
      const categories = catalog.categories.map((category) => ({
        id: category.id,
        title: category.title,
      }));
      const started = await api.startCatalogImport(
        source.import.id,
        categories,
        pageHint.trim(),
        hintParts.filter(Boolean).join(' — '),
      );
      setJob(started.import);
    } catch (err) {
      setError((err as Error).message || 'Could not start the import.');
    } finally {
      setBusy(false);
    }
  };

  const cancelJob = async () => {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.cancelCatalogImport(job.id);
      setJob(result.import);
    } catch (err) {
      setError((err as Error).message || 'Could not cancel the import.');
    } finally {
      setBusy(false);
    }
  };

  const retryJob = async () => {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.retryCatalogImport(job.id);
      setJob(result.import);
    } catch (err) {
      setError((err as Error).message || 'Could not retry the import.');
    } finally {
      setBusy(false);
    }
  };

  const startOver = () => {
    setJob(null);
    setFile(null);
    setError(null);
    setPageHint('');
    setModelHint('');
    setPreferredCategory('');
    if (fileInput.current) fileInput.current.value = '';
  };

  const useDraft = async (withImages: boolean) => {
    if (!job?.result) return;
    setAdopting(true);
    setError(null);
    const draft = job.result;
    const category =
      draft.product.categoryId || preferredCategory || catalog.categories[0]?.id || '';
    let images: ProductImage[] = [];

    if (withImages && job.images.length > 0) {
      try {
        const adopted = await api.adoptCatalogImportImages(job.id, slugify(draft.product.suggestedName));
        images = adopted.images;
      } catch (err) {
        setError((err as Error).message || 'Could not copy the extracted images.');
        setAdopting(false);
        return;
      }
    }

    const initial: AdminCatalogProduct = {
      category,
      slug: slugify(draft.product.suggestedName),
      name: draft.product.suggestedName,
      summary: draft.product.summary,
      description: draft.product.description,
      specs: draft.product.specs,
      features: draft.product.features,
      applications: draft.product.applications,
      images,
      imageUrl: images[0]?.src ?? '',
      mainImage: images[0]?.src,
      pdfUrl: undefined,
      pdfName: undefined,
      pdfSource: 'generated',
      warranty: draft.product.warranty ?? undefined,
      brand: draft.product.brand ?? undefined,
      manufacturer: draft.product.manufacturer ?? undefined,
      manufacturerModel: draft.product.manufacturerModel ?? undefined,
      datasheet: draft.datasheet ?? undefined,
      sourceImportId: job.id,
    };

    setAdopting(false);
    onUseDraft(initial, job.originalName || 'manufacturer spec sheet');
  };

  const header = (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={onCancel} className="btn btn-outline btn-sm">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to products
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">
          <Sparkles className="h-2.5 w-2.5" /> AI import
        </Badge>
        {job && <Badge>{job.status}</Badge>}
      </div>
    </div>
  );

  if (!capabilities) {
    return (
      <div className="space-y-5">
        {header}
        <Section title="Import from a manufacturer spec sheet">
          <p className="flex items-center gap-2 text-sm font-sans text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking AI import availability…
          </p>
        </Section>
      </div>
    );
  }

  if (!capabilities.enabled) {
    return (
      <div className="space-y-5">
        {header}
        <Section title="AI import is not available" description="The manual product editor still works normally.">
          <StatusLine tone="error">
            {!capabilities.configured
              ? 'No DeepSeek API key is configured. Add DEEPSEEK_API_KEY to the server environment.'
              : 'The PDF extraction tools are not installed on the server (poppler-utils).'}
          </StatusLine>
          <div className="space-y-1 text-xs font-sans text-slate-500">
            <p>Model: <span className="font-mono text-slate-400">{capabilities.model}</span></p>
            <p>PDF tools: <span className="font-mono text-slate-400">{capabilities.pdfTools.available ? 'available' : 'missing'}</span></p>
          </div>
          <button type="button" onClick={onCancel} className="btn btn-primary btn-sm">
            Back to manual entry
          </button>
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {header}

      {error && <StatusLine tone="error">{error}</StatusLine>}

      {!job ? (
        <>
          <Section
            title="Import from a manufacturer spec sheet"
            description="Upload the PDF; DeepSeek extracts the product data, specs and datasheet layout for you to review."
          >
            <div className="rounded-lg border border-amber-400/15 bg-amber-400/[0.03] px-3 py-2 text-[11px] font-sans text-amber-200/80">
              The PDF text and page images are sent to DeepSeek for analysis. The source PDF stays
              private to admins. Nothing is published until you review the draft and save the product.
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) => chooseFile(event.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#1E293B] bg-white/[0.02] px-4 py-10 text-slate-500 transition-colors hover:border-primary/30 hover:text-primary"
            >
              <FileUp className="h-7 w-7" />
              <span className="text-sm font-sans">{file ? file.name : 'Choose a manufacturer PDF'}</span>
              <span className="text-[10px] font-mono text-slate-600">
                {file ? (file.size / 1024 / 1024).toFixed(1) + ' MB · click to replace' : 'PDF · max 25 MB'}
              </span>
            </button>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Model to extract" hint="Optional; useful for multi-product catalogues.">
                <input
                  type="text"
                  value={modelHint}
                  onChange={(event) => setModelHint(event.target.value)}
                  placeholder="e.g. ACE-HP-S"
                  className={inputCls}
                />
              </Field>
              <Field label="Pages" hint="Optional, e.g. 1 or 1-4.">
                <input
                  type="text"
                  value={pageHint}
                  onChange={(event) => setPageHint(event.target.value)}
                  placeholder="1-4"
                  className={inputCls}
                />
              </Field>
              <Field label="Preferred category" hint="The AI may still suggest another category.">
                <select
                  value={preferredCategory}
                  onChange={(event) => setPreferredCategory(event.target.value)}
                  className={inputCls}
                >
                  <option value="">Let the AI choose</option>
                  {catalog.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void start()}
                disabled={!file || busy}
                className="btn btn-primary btn-sm"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Analyse PDF
              </button>
              <span className="text-[11px] font-mono text-slate-600">
                model <span className="text-slate-400">{capabilities.model}</span>
              </span>
            </div>
          </Section>
        </>
      ) : running ? (
        <Section title="Analysing the spec sheet" description={job.originalName || undefined}>
          <div className="flex items-center gap-3 rounded-lg border border-[#1E293B] bg-white/[0.02] px-4 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{job.statusMessage || 'Working…'}</p>
              <p className="mt-1 text-[11px] font-mono text-slate-500">
                {job.status === 'extracting'
                  ? 'Reading text and page images with Poppler…'
                  : job.status === 'analyzing'
                    ? 'DeepSeek is extracting technical data and drafting the datasheet…'
                    : 'Queued…'}
              </p>
            </div>
            <button type="button" onClick={() => void cancelJob()} disabled={busy} className="btn btn-outline btn-sm">
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </Section>
      ) : job.status === 'failed' || job.status === 'canceled' ? (
        <Section title={job.status === 'failed' ? 'The import failed' : 'Import canceled'}>
          <StatusLine tone="error">{job.error || job.statusMessage || 'The import did not finish.'}</StatusLine>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void retryJob()} disabled={busy} className="btn btn-primary btn-sm">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Retry import
            </button>
            <button type="button" onClick={startOver} className="btn btn-outline btn-sm">
              Start over
            </button>
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-primary/80 hover:text-primary"
            >
              Open source PDF
            </a>
          </div>
        </Section>
      ) : job.status === 'ready' && job.result ? (
        <Section
          title="Review the extracted draft"
          description="Check the values against the source PDF before handing the draft to the product editor."
          actions={
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Source PDF
            </a>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={confidenceTone(job.result.confidence)}>
              {job.result.confidence} confidence
            </Badge>
            <Badge>{job.result.source.manufacturer || 'Unknown manufacturer'}</Badge>
            {job.result.source.model && <Badge>{job.result.source.model}</Badge>}
            <Badge>{job.result.source.pageCount ?? job.pageCount ?? '?'} pages</Badge>
            {job.tokensIn !== null && <Badge>{job.tokensIn + (job.tokensOut ?? 0)} tokens</Badge>}
          </div>

          {job.result.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-300">
                <AlertTriangle className="h-3 w-3" /> Review notes
              </p>
              <ul className="space-y-1">
                {job.result.warnings.map((warning, index) => (
                  <li key={index} className="text-[11px] font-sans text-amber-200/80">
                    · {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#1E293B] bg-white/[0.02] p-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Suggested product</p>
              <p className="mt-1 text-sm font-semibold text-white">{job.result.product.suggestedName}</p>
              <p className="mt-1 text-[11px] font-mono text-slate-500">
                {catalog.getCategory(job.result.product.categoryId ?? '')?.title ||
                  job.result.product.categoryId ||
                  'No category suggested'}
              </p>
              <p className="mt-2 text-xs font-sans text-slate-400">
                {job.result.product.suggestedName
                  ? job.result.product.summary
                  : 'No summary extracted.'}
              </p>
            </div>
            <div className="rounded-lg border border-[#1E293B] bg-white/[0.02] p-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Extracted data</p>
              <ul className="mt-1 space-y-1 text-[11px] font-mono text-slate-400">
                <li>{job.result.product.specs.length} specifications</li>
                <li>{job.result.product.features.length} features</li>
                <li>{job.result.product.applications.length} applications</li>
                <li>{job.result.datasheet?.columns.left.length ?? 0} + {job.result.datasheet?.columns.right.length ?? 0} datasheet groups</li>
                <li>{job.result.evidence.length} source quotes</li>
              </ul>
            </div>
          </div>

          {job.images.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                <ImageIcon className="h-3 w-3" /> Extracted image candidates
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {job.images.map((image) => (
                  <div key={image.url} className="overflow-hidden rounded-lg border border-[#1E293B] bg-white">
                    <img
                      src={image.url}
                      alt=""
                      className="aspect-[4/3] w-full object-contain p-1"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] font-sans text-slate-500">
                All candidates are added to the product draft; remove any you do not want in the editor.
              </p>
            </div>
          )}

          {job.result.product.specs.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[#1E293B]">
              {job.result.product.specs.slice(0, 8).map((spec, index) => (
                <div
                  key={spec.label + index}
                  className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-[#1E293B]/60 px-3 py-2 last:border-b-0"
                >
                  <span className="text-[11px] font-mono text-slate-500">{spec.label}</span>
                  <span className="text-xs font-sans text-slate-300">{spec.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-[#1E293B] pt-4">
            <button
              type="button"
              onClick={() => void useDraft(true)}
              disabled={adopting}
              className="btn btn-primary btn-sm"
            >
              {adopting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Use this draft
            </button>
            <button
              type="button"
              onClick={() => void useDraft(false)}
              disabled={adopting}
              className="btn btn-outline btn-sm"
            >
              Use without images
            </button>
            <button type="button" onClick={startOver} className="btn btn-outline btn-sm">
              Start over
            </button>
            <span className="text-[11px] font-sans text-slate-500">
              The draft opens in the product editor; nothing is published until you save.
            </span>
          </div>
        </Section>
      ) : (
        <Section title="Import status">
          <StatusLine tone="info">{job.statusMessage || 'Waiting for the import…'}</StatusLine>
          <button type="button" onClick={startOver} className="btn btn-outline btn-sm">
            Start over
          </button>
        </Section>
      )}
    </div>
  );
};
