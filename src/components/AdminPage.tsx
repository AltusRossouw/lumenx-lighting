import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api, AdminUser, DownloadRecord, DownloadStats, Lead } from '../lib/api';
import { PageHeroBackground } from './animations';
import {
  AtSign,
  FileDown,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';

type AuthState = 'loading' | 'login' | 'authenticated';
type Filter = 'all' | 'admins';
type Tab = 'users' | 'downloads' | 'leads';

export const AdminPage: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tab, setTab] = useState<Tab>('users');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const loadUsers = async () => {
    const { users: list } = await api.adminUsers();
    setUsers(list);
  };

  const loadDownloads = async () => {
    const [{ downloads: list }, { stats: s }] = await Promise.all([
      api.adminDownloads(),
      api.adminDownloadStats(),
    ]);
    setDownloads(list);
    setStats(s);
  };

  const loadLeads = async () => {
    const { leads: list } = await api.adminLeads();
    setLeads(list);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { user: me } = await api.me();
        if (!active) return;
        if (me.role === 'admin') {
          setAdminEmail(me.email);
          setAuthState('authenticated');
          await Promise.all([loadUsers(), loadDownloads(), loadLeads()]);
        } else {
          setAuthState('login');
        }
      } catch {
        if (active) setAuthState('login');
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { user } = await api.adminLogin(email.trim(), password);
      setAdminEmail(user.email);
      setAuthState('authenticated');
      await Promise.all([loadUsers(), loadDownloads(), loadLeads()]);
    } catch (err) {
      setError((err as Error).message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setAuthState('login');
    setUsers([]);
    setDownloads([]);
    setStats(null);
    setLeads([]);
    setAdminEmail('');
    setEmail('');
    setPassword('');
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;

  const visible = users.filter((u) => {
    if (filter === 'admins' && u.role !== 'admin') return false;
    if (search && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'admins', label: 'Admins' },
  ];

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="pt-[88px] min-h-screen">
      <section className="relative py-16 sm:py-20 overflow-hidden bg-[#06090F]">
        <PageHeroBackground rays={false} particles={false} dots={false} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading */}
          {authState === 'loading' && (
            <div className="gradient-border-card p-10 text-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-mono">Checking access…</p>
            </div>
          )}

          {/* Login */}
          {authState === 'login' && (
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="gradient-border-card p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/[0.08] border border-primary/15 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary/70" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-white tracking-tight">Admin sign in</h1>
                </div>
                <p className="text-sm text-slate-500 font-sans font-light mb-6">
                  Restricted area — manage users and download activity.
                </p>

                <form onSubmit={login} className="space-y-4">
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="Admin email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>

                  {error && <p className="text-xs text-red-400 font-sans">{error}</p>}

                  <button type="submit" disabled={busy} className="btn btn-primary btn-block">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Sign in
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {/* Dashboard */}
          {authState === 'authenticated' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-px bg-primary/40" />
                    <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Administration</span>
                  </div>
                  <h1 className="font-display text-3xl font-bold text-white tracking-[-0.02em]">User management</h1>
                  <p className="text-sm text-slate-500 mt-1 font-sans font-light">Signed in as {adminEmail}</p>
                </div>
                <button onClick={logout} className="btn btn-outline btn-sm">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 mb-8 border-b border-[#1E293B]">
                {(
                  [
                    { id: 'users', label: 'Users', icon: Users },
                    { id: 'leads', label: 'Leads', icon: Inbox },
                    { id: 'downloads', label: 'Downloads', icon: FileDown },
                  ] as { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[]
                ).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-sans -mb-px border-b-2 transition-colors cursor-pointer ${
                        tab === t.id
                          ? 'border-primary text-white'
                          : 'border-transparent text-slate-500 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {tab === 'users' ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Total users', value: users.length, icon: UserPlus },
                      { label: 'Administrators', value: adminCount, icon: ShieldCheck },
                      { label: 'Members', value: users.length - adminCount, icon: Users },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="gradient-border-card p-5">
                          <Icon className="w-4 h-4 text-primary/50 mb-3" />
                          <p className="font-display text-3xl font-bold text-white tracking-tight">{s.value}</p>
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Search + filter */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search by email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                            filter === f.id
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-slate-500 border border-[#1E293B] hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Users table */}
                  <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
                    <div className="hidden sm:grid grid-cols-[1fr_120px_160px] gap-4 px-6 py-3 border-b border-[#1E293B] bg-white/[0.02]">
                      {['Email', 'Role', 'Joined'].map((h) => (
                        <span key={h} className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{h}</span>
                      ))}
                    </div>

                    {visible.length === 0 ? (
                      <p className="px-6 py-10 text-center text-sm text-slate-500 font-mono">No users match.</p>
                    ) : (
                      visible.map((u) => (
                        <div
                          key={u.id}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_120px_160px] gap-3 sm:gap-4 px-6 py-4 border-b border-[#1E293B]/60 last:border-b-0 items-center"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate font-sans">{u.email}</p>
                          </div>

                          <div>
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20 text-[10px] font-mono text-secondary">
                                <ShieldCheck className="w-3 h-3" /> Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] border border-white/10 text-[10px] font-mono text-slate-400">
                                Member
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-mono text-slate-500">
                            {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : tab === 'downloads' ? (
                <>
                  {/* Download stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Total downloads', value: stats?.total ?? 0, icon: FileDown },
                      { label: 'IES files', value: stats?.ies ?? 0, icon: ShieldCheck },
                      { label: 'Datasheets', value: stats?.datasheet ?? 0, icon: FileDown },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="gradient-border-card p-5">
                          <Icon className="w-4 h-4 text-primary/50 mb-3" />
                          <p className="font-display text-3xl font-bold text-white tracking-tight">{s.value}</p>
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent downloads */}
                  <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
                    <div className="hidden sm:grid grid-cols-[150px_1fr_160px_100px] gap-4 px-6 py-3 border-b border-[#1E293B] bg-white/[0.02]">
                      {['When', 'File', 'Downloaded by', 'Type'].map((h) => (
                        <span key={h} className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{h}</span>
                      ))}
                    </div>

                    {downloads.length === 0 ? (
                      <p className="px-6 py-10 text-center text-sm text-slate-500 font-mono">No downloads yet.</p>
                    ) : (
                      downloads.map((d) => (
                        <div
                          key={d.id}
                          className="grid grid-cols-1 sm:grid-cols-[150px_1fr_160px_100px] gap-3 sm:gap-4 px-6 py-4 border-b border-[#1E293B]/60 last:border-b-0 items-center"
                        >
                          <div className="text-[11px] font-mono text-slate-500">{fmt(d.created_at)}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate font-sans">{d.filename}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 truncate font-sans">
                              {d.email ? d.email : <span className="text-slate-600 italic">Anonymous (IP)</span>}
                            </p>
                            {!d.email && d.ip && <p className="text-[10px] font-mono text-slate-600">{d.ip}</p>}
                          </div>
                          <div>
                            {d.kind === 'ies' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary">
                                <ShieldCheck className="w-3 h-3" /> IES
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] border border-white/10 text-[10px] font-mono text-slate-400">
                                <FileDown className="w-3 h-3" /> PDF
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Leads */}
                  <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
                    <div className="hidden sm:grid grid-cols-[140px_1fr_120px] gap-4 px-6 py-3 border-b border-[#1E293B] bg-white/[0.02]">
                      {['When', 'Lead', 'Source'].map((h) => (
                        <span key={h} className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{h}</span>
                      ))}
                    </div>

                    {leads.length === 0 ? (
                      <p className="px-6 py-10 text-center text-sm text-slate-500 font-mono">No leads yet.</p>
                    ) : (
                      leads.map((l) => (
                        <div
                          key={`${l.source}-${l.id}`}
                          className="grid grid-cols-1 sm:grid-cols-[140px_1fr_120px] gap-3 sm:gap-4 px-6 py-4 border-b border-[#1E293B]/60 last:border-b-0 items-start"
                        >
                          <div className="text-[11px] font-mono text-slate-500">{fmt(l.created_at)}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate font-sans">{l.subject}</p>
                            <p className="text-xs text-slate-400 truncate font-sans">
                              {l.name ? `${l.name} · ` : ''}{l.email}
                            </p>
                            {l.phone && <p className="text-[10px] font-mono text-slate-600">{l.phone}</p>}
                            {l.company && <p className="text-[10px] font-mono text-slate-600">{l.company}</p>}
                            {l.detail && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap font-sans font-light">{l.detail}</p>}
                          </div>
                          <div>
                            {l.source === 'contact' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary">Contact</span>
                            ) : l.source === 'quote' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20 text-[10px] font-mono text-secondary">Quote</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] border border-white/10 text-[10px] font-mono text-slate-400">Design</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};
