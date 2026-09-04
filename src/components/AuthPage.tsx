import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { PageHeroBackground } from './animations';
import { LumenXWordmark } from './ui/lumenx-wordmark';
import { AtSign, Loader2, Lock, ShieldCheck } from 'lucide-react';

type Mode = 'register' | 'login' | 'forgot' | 'reset';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/ies';

  const resetToken = searchParams.get('token') ?? '';
  const [mode, setMode] = useState<Mode>(resetToken ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const title =
    mode === 'login'
      ? 'Sign in'
      : mode === 'register'
        ? 'Create an account'
        : mode === 'forgot'
          ? 'Reset password'
          : 'Choose a new password';

  const subtitle =
    mode === 'login' || mode === 'register' ? 'IES download access' : 'Account recovery';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === 'reset' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'register') {
        const res = await api.register(email.trim(), password);
        setNotice(res.message || 'Account created.');
        setMode('login');
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email.trim());
        setNotice(res.message || 'If an account exists, a reset link has been sent.');
      } else if (mode === 'reset') {
        const res = await api.resetPassword(resetToken, password);
        setNotice(res.message || 'Password updated. You can now sign in.');
        setPassword('');
        setConfirm('');
        setMode('login');
      } else {
        await api.login(email.trim(), password);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError((err as Error).message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-[104px] min-h-screen">
      <section className="relative py-20 sm:py-28 overflow-hidden bg-[#06090F]">
        <PageHeroBackground rays={false} particles={false} dots={false} />
        <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="gradient-border-card p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-white tracking-tight mb-1">{title}</h1>
                <p className="text-xs text-slate-500 font-mono">{subtitle}</p>
              </div>
              <LumenXWordmark className="h-8" />
            </div>

            {(mode === 'login' || mode === 'register') && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 mb-6 border border-[#1E293B] rounded-lg p-3">
                <ShieldCheck className="w-4 h-4 text-primary/60 shrink-0" />
                Create a free account to download photometric (IES) files — no approval required.
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode !== 'reset' && (
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="Work email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder={mode === 'register' ? 'Password (min. 8 characters)' : mode === 'reset' ? 'New password (min. 8 characters)' : 'Password'}
                    autoComplete={mode === 'register' ? 'new-password' : mode === 'reset' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                  />
                </div>
              )}

              {mode === 'reset' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                  />
                </div>
              )}

              {error && <p className="text-xs text-red-400 font-sans">{error}</p>}
              {notice && <p className="text-xs text-emerald-400 font-sans">{notice}</p>}

              <button type="submit" disabled={busy} className="btn btn-primary btn-block">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {mode === 'login'
                  ? 'Sign in'
                  : mode === 'register'
                    ? 'Create account'
                    : mode === 'forgot'
                      ? 'Send reset link'
                      : 'Reset password'}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-400 font-sans">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setNotice(null);
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                  <span className="text-slate-600 mx-2">·</span>
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setNotice(null);
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </>
              )}
              {mode === 'register' && (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setNotice(null);
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
              {(mode === 'forgot' || mode === 'reset') && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setNotice(null);
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Back to sign in
                  </button>
                </>
              )}
            </div>

            <Link to="/ies" className="block mt-4 text-center text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Back to IES library
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
