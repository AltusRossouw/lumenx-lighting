import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { api, IesFile, User } from '../lib/api';
import { PageHeroBackground } from './animations';
import { FileDown, Loader2, Lock, ShieldCheck } from 'lucide-react';

type AuthState = 'loading' | 'anonymous' | 'authenticated';

export const IESLibraryPage: React.FC = () => {
  const location = useLocation();
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<IesFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setError(null);
      try {
        const { user: me } = await api.me();
        if (!active) return;
        setUser(me);
        setState('authenticated');
        const { files: list } = await api.listIes();
        if (active) setFiles(list);
      } catch (err) {
        if (!active) return;
        if ((err as { status?: number }).status === 401) {
          setState('anonymous');
        } else {
          setState('anonymous');
          setError((err as Error).message);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  return (
    <div className="pt-[104px] min-h-screen">
      <section className="relative py-20 sm:py-24 overflow-hidden bg-[#06090F]">
        <PageHeroBackground rays={false} particles={false} dots={false} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">IES Photometric Files</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
              Photometric <span className="gradient-text">downloads</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-base leading-relaxed font-sans font-light">
              IES files for lighting-simulation software. Create a free account to download — no approval required.
            </p>
          </motion.div>

          <div className="mt-10">
            {state === 'loading' && (
              <div className="gradient-border-card p-10 text-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-mono">Checking access…</p>
              </div>
            )}

            {state === 'anonymous' && (
              <div className="gradient-border-card p-8 sm:p-10 text-center">
                <div className="w-14 h-14 mx-auto bg-primary/[0.06] border border-primary/10 flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6 text-primary/60" />
                </div>
                <h2 className="font-display text-xl font-bold text-white mb-2 tracking-tight">Sign in to download IES files</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6 font-sans font-light">
                  Create a free account to access photometric files — no approval needed.
                </p>
                {error && <p className="text-xs text-amber-400 mb-4 font-mono">{error}</p>}
                <Link to="/account" state={{ from: '/ies' }} className="btn btn-primary inline-flex">
                  Sign in or register
                </Link>
              </div>
            )}

            {state === 'authenticated' && (
              <>
                <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 mb-6 border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 w-fit">
                  <ShieldCheck className="w-4 h-4" /> Access granted — {user?.email}
                </div>

                {files.length === 0 ? (
                  <div className="gradient-border-card p-10 text-center">
                    <p className="text-sm text-slate-500 font-mono">No IES files are currently available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file, i) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="border border-[#1E293B]/70 bg-[#0A0F17] hover:border-primary/30 transition-colors duration-300 p-5"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-9 h-9 bg-primary/[0.06] flex items-center justify-center shrink-0">
                            <FileDown className="w-4 h-4 text-primary/60" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate font-display">{file.name}</p>
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                              {file.lumens ? `${file.lumens.toLocaleString()} lm` : 'LumenX'} · .IES
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/api/ies/${encodeURIComponent(file.filename)}`}
                          download
                          className="btn btn-outline btn-sm w-full no-underline"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          Download IES
                        </a>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
