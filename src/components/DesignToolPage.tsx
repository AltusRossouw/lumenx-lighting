import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { api, DesignProduct, DesignResult } from '../lib/api';
import { PageHeroBackground } from './animations';
import { LumenXMark } from './ui/lumenx-mark';
import {
  Calculator,
  Download,
  Loader2,
  Lock,
  Mail,
  Ruler,
  X,
} from 'lucide-react';

// Fallback catalogue so the tool renders even when the backend is offline.
const FALLBACK_PRODUCTS: DesignProduct[] = [
  { id: 'LumenX_V200_Highbay_160W.ies', name: 'V200 UFO Highbay 160W', lumens: 32000, watts: 160, manufacturer: 'LumenX' },
  { id: 'LumenX_Saxa_Triproof_54W.ies', name: 'Saxa Triproof 54W', lumens: 6480, watts: 54, manufacturer: 'LumenX' },
  { id: 'LumenX_60W_Street_Light.ies', name: '60W Street Light', lumens: 10200, watts: 60, manufacturer: 'LumenX' },
  { id: 'LumenX_Recessed_Panel_600x600_24W.ies', name: 'Recessed Panel 600x600 24W', lumens: 3600, watts: 24, manufacturer: 'LumenX' },
  { id: 'LumenX_9W_Surface_Downlight.ies', name: '9W Surface Downlight', lumens: 1250, watts: 9, manufacturer: 'LumenX' },
  { id: 'LumenX_Performance_Flood_175W.ies', name: 'Performance Flood 175W', lumens: 22500, watts: 175, manufacturer: 'LumenX' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormState {
  roomLength: string;
  roomWidth: string;
  mountingHeight: string;
  workingPlaneHeight: string;
  targetLux: string;
  maintenanceFactor: string;
  productId: string;
}

const DEFAULT_FORM: FormState = {
  roomLength: '12',
  roomWidth: '9',
  mountingHeight: '3',
  workingPlaneHeight: '0.75',
  targetLux: '500',
  maintenanceFactor: '0.8',
  productId: '',
};

export const DesignToolPage: React.FC = () => {
  const [products, setProducts] = useState<DesignProduct[]>(FALLBACK_PRODUCTS);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<DesignResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Email capture gate state
  const [gateOpen, setGateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .designProducts()
      .then(({ products: list }) => {
        if (!active) return;
        if (list.length > 0) {
          setProducts(list);
          setServerOnline(true);
          setForm((f) => (f.productId ? f : { ...f, productId: list[0].id }));
        } else {
          setServerOnline(true);
          setForm((f) => (f.productId ? f : { ...f, productId: FALLBACK_PRODUCTS[0].id }));
        }
      })
      .catch(() => {
        if (!active) return;
        setServerOnline(false);
        setForm((f) => (f.productId ? f : { ...f, productId: FALLBACK_PRODUCTS[0].id }));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.productId && products.length > 0) {
      setForm((f) => ({ ...f, productId: products[0].id }));
    }
  }, [form.productId, products]);

  const update = (field: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setResult(null);
    setExported(false);
  };

  const currentProduct = useMemo(
    () => products.find((p) => p.id === form.productId) ?? null,
    [products, form.productId],
  );

  const handleCalculate = async () => {
    setError(null);
    setExported(false);
    setCalculating(true);
    try {
      const payload = {
        roomLength: Number(form.roomLength),
        roomWidth: Number(form.roomWidth),
        mountingHeight: Number(form.mountingHeight),
        workingPlaneHeight: Number(form.workingPlaneHeight),
        targetLux: Number(form.targetLux),
        maintenanceFactor: Number(form.maintenanceFactor),
        productId: form.productId,
      };
      const data = await api.calculateDesign(payload);
      setResult(data.result);
    } catch (err) {
      setError((err as Error).message || 'Calculation failed.');
    } finally {
      setCalculating(false);
    }
  };

  const handleExport = async () => {
    setGateError(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setGateError('Enter a valid email address to receive your report.');
      return;
    }
    setExporting(true);
    try {
      const report = {
        product: currentProduct,
        inputs: {
          roomLength: Number(form.roomLength),
          roomWidth: Number(form.roomWidth),
          mountingHeight: Number(form.mountingHeight),
          workingPlaneHeight: Number(form.workingPlaneHeight),
          targetLux: Number(form.targetLux),
          maintenanceFactor: Number(form.maintenanceFactor),
        },
        result,
        generatedAt: new Date().toISOString(),
      };
      await api.exportDesign(email.trim(), report);
      downloadReport(report);
      setExported(true);
      setGateOpen(false);
      setEmail('');
    } catch (err) {
      setGateError((err as Error).message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const downloadReport = (report: unknown) => {
    const lines = [
      'LUMENX LIGHTING — DESIGN REPORT',
      '=================================',
      '',
      `Generated: ${new Date().toLocaleString()}`,
      `Product: ${(report as { product?: { name?: string } })?.product?.name ?? '—'}`,
      '',
      'INPUTS',
      ...Object.entries((report as { inputs: Record<string, number> }).inputs).map(
        ([k, v]) => `  ${k}: ${v}`,
      ),
      '',
      'RESULTS',
      ...Object.entries((report as { result: Record<string, unknown> }).result ?? {}).map(
        ([k, v]) => `  ${k}: ${v}`,
      ),
      '',
      'This report was generated with the LumenX lighting design tool.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LumenX-Design-Report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-[88px] pb-14 sm:pb-16 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Lighting Design Tool</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
              Plan your layout, <span className="gradient-text">quantify your light</span>
            </h1>
            <p className="text-slate-400 max-w-2xl text-base leading-relaxed font-sans font-light">
              Estimate the number of LumenX luminaires required to hit your target illuminance.
              No account needed — export your final report with an email.
            </p>
            {serverOnline === false && (
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-amber-400/90 border border-amber-400/20 bg-amber-400/5 px-3 py-2">
                Backend offline — showing the built-in catalogue. Results require the API.
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Tool body */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-7 gradient-border-card p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-white mb-6 tracking-tight flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary/60" /> Space &amp; target
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  { key: 'roomLength', label: 'Room length (m)', min: 0.5, step: 0.1 },
                  { key: 'roomWidth', label: 'Room width (m)', min: 0.5, step: 0.1 },
                  { key: 'mountingHeight', label: 'Mounting height (m)', min: 1, step: 0.1 },
                  { key: 'workingPlaneHeight', label: 'Working plane (m)', min: 0, step: 0.05 },
                  { key: 'targetLux', label: 'Target illuminance (lx)', min: 10, step: 10 },
                  { key: 'maintenanceFactor', label: 'Maintenance factor', min: 0.3, step: 0.05 },
                ] as { key: keyof FormState; label: string; min: number; step: number }[]
              ).map((f) => (
                <label key={f.key} className="block">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</span>
                  <input
                    type="number"
                    step={f.step}
                    min={f.min}
                    value={form[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                  />
                </label>
              ))}
            </div>

            <label className="block mt-5">
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">LumenX product</span>
              <select
                value={form.productId}
                onChange={(e) => update('productId', e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 transition-colors font-sans appearance-none cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0A0D14] text-white">
                    {p.name} — {p.lumens?.toLocaleString()} lm{p.watts ? ` · ${p.watts} W` : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-7">
              <button type="button" onClick={handleCalculate} disabled={calculating} className="btn btn-primary w-full sm:w-auto">
                {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                {calculating ? 'Calculating…' : 'Run calculation'}
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-400/90 font-sans">{error}</p>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-5 space-y-6">
            <div className="gradient-border-card p-6 sm:p-8 min-h-[320px] flex flex-col">
              <h2 className="font-display text-lg font-semibold text-white mb-6 tracking-tight flex items-center gap-2">
                <LumenXMark className="w-3 h-3 text-primary" /> Results
              </h2>

              {!result ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Calculator className="w-8 h-8 text-slate-700 mb-3" />
                  <p className="text-sm text-slate-500 max-w-xs font-sans font-light">
                    Configure your space and run a calculation to see the estimated luminaire count.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-6 border border-[#1E293B] bg-[#0A0F17] rounded-lg">
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Estimated luminaires</p>
                    <p className="font-display text-5xl font-extrabold gradient-text leading-none">{result.requiredCount}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-2">≈ {result.achievedLux} lx achieved</p>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { k: 'Area', v: `${result.area} m²` },
                      { k: 'Utilisation', v: result.utilizationFactor.toFixed(2) },
                      { k: 'Installed flux', v: `${result.installedLumens.toLocaleString()} lm` },
                      { k: 'Power density', v: `${result.powerDensityWm2} W/m²` },
                    ].map((row) => (
                      <div key={row.k} className="p-3 rounded-lg bg-[#0A0D14] border border-[#1E293B]">
                        <dt className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">{row.k}</dt>
                        <dd className="text-white font-medium">{row.v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Export gate */}
            <div className="gradient-border-card p-6 sm:p-8">
              <h3 className="font-display text-base font-semibold text-white mb-2 tracking-tight">Export your design report</h3>
              <p className="text-sm text-slate-400 mb-4 font-sans font-light">
                Enter your email to download the final report. It's logged for follow-up support.
              </p>
              <button
                type="button"
                onClick={() => (result ? setGateOpen(true) : setError('Run a calculation first.'))}
                disabled={!result}
                className="btn btn-outline w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {exported ? 'Report exported' : 'Export & download report'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Email gate modal */}
      {gateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#06090F]/85 backdrop-blur-sm" onClick={() => setGateOpen(false)} />
          <div className="relative z-10 w-full max-w-md gradient-border-card p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setGateOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/[0.06] border border-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-white tracking-tight">Email required to export</h3>
                <p className="text-[11px] text-slate-500 font-mono">One step before download</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-5 font-sans font-light">
              We'll send your design summary to this address and keep a record so our team can follow up.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoFocus
              className="w-full px-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans mb-3"
            />

            {gateError && <p className="text-xs text-red-400 mb-3 font-sans">{gateError}</p>}

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mb-5">
              <Lock className="w-3 h-3" /> Your email is only used for this design report.
            </div>

            <button type="button" onClick={handleExport} disabled={exporting} className="btn btn-primary btn-block">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Exporting…' : 'Confirm & download'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
