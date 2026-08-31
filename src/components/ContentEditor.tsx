import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DEFAULT_CONTENT, SiteContent, setSiteContent } from '../content';
import { CONTENT_SCHEMA, FieldDef, Group } from '../content-schema';
import { Check, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';

/* ── Immutable path helpers over the SiteContent document ──────────────── */

const getAt = (obj: unknown, path: string[]): unknown =>
  path.reduce((acc, k) => (acc == null ? undefined : (acc as Record<string, unknown>)[k]), obj);

const setAt = (obj: unknown, path: string[], value: unknown): unknown => {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const source = obj && typeof obj === 'object' ? obj : {};
  const copy = Array.isArray(source) ? [...source] : { ...(source as Record<string, unknown>) };
  (copy as Record<string, unknown>)[head] = setAt(
    (source as Record<string, unknown>)[head],
    rest,
    value,
  );
  return copy;
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/* ── Reusable inputs ───────────────────────────────────────────────────── */

const inputCls =
  'w-full px-3 py-2 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans';

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">{children}</label>
);

interface RenderFieldProps {
  field: FieldDef;
  draft: SiteContent;
  onChange: (next: SiteContent) => void;
}

const TextField: React.FC<RenderFieldProps> = ({ field, draft, onChange }) => {
  const value = (getAt(draft, field.path) as string) ?? '';
  return (
    <div>
      <FieldLabel>{field.label}</FieldLabel>
      {field.kind === 'textarea' ? (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(setAt(draft, field.path, e.target.value) as SiteContent)}
          className={`${inputCls} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(setAt(draft, field.path, e.target.value) as SiteContent)}
          className={inputCls}
        />
      )}
    </div>
  );
};

const HeadingField: React.FC<RenderFieldProps> = ({ field, draft, onChange }) => {
  const lead = (getAt(draft, [...field.path, 'lead']) as string) ?? '';
  const accent = (getAt(draft, [...field.path, 'accent']) as string) ?? '';
  const tail = (getAt(draft, [...field.path, 'tail']) as string) ?? '';
  return (
    <div className="space-y-3 p-4 rounded-lg border border-[#1E293B] bg-white/[0.02]">
      <FieldLabel>{field.label}</FieldLabel>
      <div>
        <FieldLabel>Lead text</FieldLabel>
        <input type="text" value={lead} onChange={(e) => onChange(setAt(draft, [...field.path, 'lead'], e.target.value) as SiteContent)} className={inputCls} />
      </div>
      <div>
        <FieldLabel>Highlighted word(s)</FieldLabel>
        <input type="text" value={accent} onChange={(e) => onChange(setAt(draft, [...field.path, 'accent'], e.target.value) as SiteContent)} className={inputCls} />
      </div>
      <div>
        <FieldLabel>Tail text</FieldLabel>
        <input type="text" value={tail} onChange={(e) => onChange(setAt(draft, [...field.path, 'tail'], e.target.value) as SiteContent)} className={inputCls} />
      </div>
    </div>
  );
};

const StringListField: React.FC<RenderFieldProps> = ({ field, draft, onChange }) => {
  const items = (getAt(draft, field.path) as string[]) ?? [];
  const addable = field.addable !== false;
  return (
    <div>
      <FieldLabel>{field.label}</FieldLabel>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => onChange(setAt(draft, [...field.path, String(i)], e.target.value) as SiteContent)}
              className={inputCls}
            />
            {addable && (
              <button
                type="button"
                onClick={() => onChange(setAt(draft, field.path, items.filter((_, j) => j !== i)) as SiteContent)}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-[#1E293B] text-slate-500 hover:text-red-400 hover:border-red-400/40 transition-colors cursor-pointer"
                aria-label="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      {addable && (
        <button
          type="button"
          onClick={() => onChange(setAt(draft, field.path, [...items, '']) as SiteContent)}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E293B] text-xs font-mono text-slate-400 hover:text-white hover:border-primary/40 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      )}
    </div>
  );
};

const ObjectListField: React.FC<RenderFieldProps> = ({ field, draft, onChange }) => {
  const items = (getAt(draft, field.path) as Record<string, string>[]) ?? [];
  const addable = field.addable !== false;
  const itemFields = field.itemFields ?? [];
  return (
    <div>
      <FieldLabel>{field.label}</FieldLabel>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 rounded-lg border border-[#1E293B] bg-white/[0.02] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-primary/70 uppercase tracking-wider">
                Item {i + 1}
              </span>
              {addable && (
                <button
                  type="button"
                  onClick={() => onChange(setAt(draft, field.path, items.filter((_, j) => j !== i)) as SiteContent)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#1E293B] text-slate-500 hover:text-red-400 hover:border-red-400/40 transition-colors cursor-pointer text-[10px] font-mono"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
            {itemFields.map((f) => {
              const value = item[f.key] ?? '';
              return (
                <div key={f.key}>
                  <FieldLabel>{f.label}</FieldLabel>
                  {f.kind === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={value}
                      onChange={(e) =>
                        onChange(setAt(draft, [...field.path, String(i), f.key], e.target.value) as SiteContent)
                      }
                      className={`${inputCls} resize-y`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        onChange(setAt(draft, [...field.path, String(i), f.key], e.target.value) as SiteContent)
                      }
                      className={inputCls}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {addable && (
        <button
          type="button"
          onClick={() => {
            const empty = Object.fromEntries(itemFields.map((f) => [f.key, '']));
            onChange(setAt(draft, field.path, [...items, empty]) as SiteContent);
          }}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E293B] text-xs font-mono text-slate-400 hover:text-white hover:border-primary/40 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      )}
    </div>
  );
};

const FieldRenderer: React.FC<RenderFieldProps> = (props) => {
  switch (props.field.kind) {
    case 'heading':
      return <HeadingField {...props} />;
    case 'stringList':
      return <StringListField {...props} />;
    case 'objectList':
      return <ObjectListField {...props} />;
    default:
      return <TextField {...props} />;
  }
};

const GroupBlock: React.FC<{ group: Group; draft: SiteContent; onChange: (next: SiteContent) => void }> = ({
  group,
  draft,
  onChange,
}) => (
  <section className="rounded-2xl border border-[#1E293B] bg-[#0A0D14] overflow-hidden">
    <div className="px-6 py-4 border-b border-[#1E293B] bg-white/[0.02]">
      <h3 className="font-display text-base font-semibold text-white tracking-tight">{group.title}</h3>
      {group.description && <p className="text-xs text-slate-500 font-sans font-light mt-0.5">{group.description}</p>}
    </div>
    <div className="p-6 space-y-5">
      {group.fields.map((field) => (
        <FieldRenderer key={field.path.join('.')} field={field} draft={draft} onChange={onChange} />
      ))}
    </div>
  </section>
);

/* ── Editor ────────────────────────────────────────────────────────────── */

type Status = { type: 'idle' | 'saving' | 'saved' | 'error'; msg: string };

export const ContentEditor: React.FC = () => {
  const [draft, setDraft] = useState<SiteContent>(() => clone(DEFAULT_CONTENT));
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>({ type: 'idle', msg: '' });
  const [meta, setMeta] = useState<{ updated_at: string | null; updated_by: string | null }>({
    updated_at: null,
    updated_by: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.adminContent();
        if (!active) return;
        setDraft(res.content ? clone(res.content as SiteContent) : clone(DEFAULT_CONTENT));
        setMeta({ updated_at: res.updated_at, updated_by: res.updated_by });
      } catch (err) {
        if (active) setStatus({ type: 'error', msg: (err as Error).message || 'Failed to load content.' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setStatus({ type: 'saving', msg: '' });
    try {
      const res = await api.saveContent(draft);
      setSiteContent(draft);
      setMeta({ updated_at: res.updated_at, updated_by: res.updated_by });
      setStatus({ type: 'saved', msg: 'Saved. The live site now shows this copy.' });
    } catch (err) {
      setStatus({ type: 'error', msg: (err as Error).message || 'Save failed.' });
    }
  };

  const reset = () => {
    setDraft(clone(DEFAULT_CONTENT));
    setStatus({ type: 'idle', msg: 'Reverted to defaults in the editor — press Save to publish.' });
  };

  if (loading) {
    return (
      <div className="gradient-border-card p-10 text-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400 font-mono">Loading content…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-20 z-10 bg-[#06090F]/95 backdrop-blur-sm p-4 rounded-2xl border border-[#1E293B]">
        <div>
          <p className="text-sm text-white font-sans">Site copy</p>
          <p className="text-[11px] font-mono text-slate-500">
            {meta.updated_at
              ? `Last published ${new Date(meta.updated_at).toLocaleString()}${meta.updated_by ? ` by ${meta.updated_by}` : ''}`
              : 'Never saved — showing built-in defaults.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reset} disabled={status.type === 'saving'} className="btn btn-outline btn-sm">
            <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
          </button>
          <button type="button" onClick={save} disabled={status.type === 'saving'} className="btn btn-primary btn-sm">
            {status.type === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Publish
          </button>
        </div>
      </div>

      {status.type === 'saved' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-sans">
          <Check className="w-4 h-4" /> {status.msg}
        </div>
      )}
      {status.type === 'error' && (
        <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm font-sans">
          {status.msg}
        </div>
      )}

      {CONTENT_SCHEMA.map((group) => (
        <GroupBlock key={group.title} group={group} draft={draft} onChange={setDraft} />
      ))}
    </div>
  );
};
