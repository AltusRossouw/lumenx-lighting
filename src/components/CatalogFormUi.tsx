// Small shared building blocks for the catalogue admin forms.
// Deliberately plain: the admin uses the site's existing dark card/button
// language rather than introducing a second UI kit.

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const inputCls =
  'w-full px-3 py-2 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans';

export const smallInputCls =
  'w-full px-2.5 py-1.5 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans';

export const Field: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, required, children }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
      {label}
      {required && <span className="text-primary">*</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-[11px] font-sans text-slate-500">{hint}</span>}
  </label>
);

export const Section: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, actions, children }) => (
  <section className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1E293B] px-5 py-4">
      <div>
        <h3 className="font-display text-sm font-semibold tracking-tight text-white">{title}</h3>
        {description && <p className="mt-1 text-xs font-sans font-light text-slate-500">{description}</p>}
      </div>
      {actions}
    </div>
    <div className="space-y-4 p-5">{children}</div>
  </section>
);

const TONES = {
  primary: 'border-primary/20 bg-primary/10 text-primary',
  muted: 'border-white/10 bg-white/[0.03] text-slate-400',
  green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  amber: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  red: 'border-red-400/20 bg-red-400/10 text-red-300',
} as const;

export const Badge: React.FC<{
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}> = ({ tone = 'muted', children }) => (
  <span className={'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-mono ' + TONES[tone]}>
    {children}
  </span>
);

export const StatusLine: React.FC<{
  tone: 'ok' | 'error' | 'info';
  children: React.ReactNode;
}> = ({ tone, children }) => {
  const cls =
    tone === 'ok'
      ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
      : tone === 'error'
        ? 'border-red-400/20 bg-red-400/5 text-red-300'
        : 'border-[#1E293B] bg-white/[0.02] text-slate-400';
  return (
    <p role="status" className={'rounded-lg border px-3 py-2 text-xs font-sans ' + cls}>
      {children}
    </p>
  );
};

export const ListEditor: React.FC<{
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}> = ({ label, items, onChange, placeholder, addLabel = 'Add item' }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-[10px] font-mono text-slate-600">{items.length}</span>
    </div>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            placeholder={placeholder}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
            className={inputCls}
          />
          <button
            type="button"
            aria-label={'Remove ' + label + ' item'}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#1E293B] text-slate-500 transition-colors hover:border-red-400/40 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
    <button
      type="button"
      onClick={() => onChange([...items, ''])}
      className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[11px] font-mono text-primary/80 transition-colors hover:text-primary"
    >
      <Plus className="h-3 w-3" /> {addLabel}
    </button>
  </div>
);

export const SpecEditor: React.FC<{
  specs: { label: string; value: string }[];
  onChange: (specs: { label: string; value: string }[]) => void;
}> = ({ specs, onChange }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
        Technical specifications
      </span>
      <span className="text-[10px] font-mono text-slate-600">{specs.length}</span>
    </div>
    <div className="space-y-2">
      {specs.map((spec, index) => (
        <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_36px]">
          <input
            type="text"
            value={spec.label}
            placeholder="Label, e.g. Wattage"
            onChange={(event) => {
              const next = [...specs];
              next[index] = { ...next[index], label: event.target.value };
              onChange(next);
            }}
            className={smallInputCls}
          />
          <input
            type="text"
            value={spec.value}
            placeholder="Value, e.g. 20 W"
            onChange={(event) => {
              const next = [...specs];
              next[index] = { ...next[index], value: event.target.value };
              onChange(next);
            }}
            className={smallInputCls}
          />
          <button
            type="button"
            aria-label="Remove specification"
            onClick={() => onChange(specs.filter((_, i) => i !== index))}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#1E293B] text-slate-500 transition-colors hover:border-red-400/40 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
    <button
      type="button"
      onClick={() => onChange([...specs, { label: '', value: '' }])}
      className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[11px] font-mono text-primary/80 transition-colors hover:text-primary"
    >
      <Plus className="h-3 w-3" /> Add specification
    </button>
  </div>
);
