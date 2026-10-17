import React, { useEffect, useRef, useState } from 'react';
import { History, Loader2, RefreshCw, Search, User, X } from 'lucide-react';
import { api } from '../lib/api';
import type { ActivityEvent, AdminUser } from '../lib/api';
import { Badge, StatusLine, inputCls } from './CatalogFormUi';

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'auth.login', label: 'Sign in' },
  { value: 'auth.admin_login', label: 'Admin sign in' },
  { value: 'auth.register', label: 'Account created' },
  { value: 'auth.logout', label: 'Sign out' },
  { value: 'auth.password_reset_requested', label: 'Password reset requested' },
  { value: 'auth.password_reset', label: 'Password reset' },
  { value: 'download.ies', label: 'IES download' },
  { value: 'download.datasheet', label: 'Datasheet download' },
  { value: 'catalog.product.create', label: 'Product created' },
  { value: 'catalog.product.update', label: 'Product updated' },
  { value: 'catalog.product.delete', label: 'Product deleted' },
  { value: 'catalog.product.visibility', label: 'Product visibility' },
  { value: 'catalog.category.create', label: 'Category created' },
  { value: 'catalog.category.update', label: 'Category updated' },
  { value: 'catalog.category.delete', label: 'Category deleted' },
  { value: 'catalog.image.upload', label: 'Image uploaded' },
  { value: 'catalog.spec_sheet.upload', label: 'Spec sheet uploaded' },
  { value: 'content.update', label: 'Content updated' },
  { value: 'ies.upload', label: 'IES uploaded' },
  { value: 'ies.assign', label: 'IES assigned' },
  { value: 'ies.remove', label: 'IES detached' },
  { value: 'import.source', label: 'Spec sheet source uploaded' },
  { value: 'import.create', label: 'AI import started' },
  { value: 'import.adopt', label: 'AI import adopted' },
  { value: 'import.retry', label: 'AI import retried' },
  { value: 'import.cancel', label: 'AI import cancelled' },
] as const;

const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  ACTION_OPTIONS.filter((option) => option.value).map((option) => [option.value, option.label]),
);

type Tone = 'primary' | 'green' | 'amber' | 'red' | 'muted';

const actionTone = (action: string): Tone => {
  if (action.startsWith('auth.')) return 'primary';
  if (action.startsWith('download.')) return 'green';
  if (action.startsWith('catalog.')) return 'amber';
  if (action.startsWith('ies.')) return 'green';
  if (action.startsWith('import.')) return 'red';
  if (action.startsWith('content.')) return 'primary';
  return 'muted';
};

const actionLabel = (action: string) => {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const [, ...rest] = action.split('.');
  return (rest.length ? rest : [action]).join(' ').replace(/_/g, ' ');
};

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface AdminActivityProps {
  users: AdminUser[];
  userId: string | null;
  onUserIdChange: (userId: string | null) => void;
}

export const AdminActivity: React.FC<AdminActivityProps> = ({ users, userId, onUserIdChange }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const requestRef = useRef(0);

  const selectedUser = users.find((user) => user.id === userId) ?? null;

  const load = async (nextOffset: number, append: boolean) => {
    const requestId = ++requestRef.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const page = await api.adminActivity({
        userId,
        action: action || null,
        q: query || null,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      if (requestId !== requestRef.current) return;
      setEvents((previous) => (append ? [...previous, ...page.events] : page.events));
      setTotal(page.total);
    } catch (err) {
      if (requestId === requestRef.current) {
        setError((err as Error).message || 'Could not load the activity log.');
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    void load(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, action, query]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setQuery(search.trim());
  };

  const clearSearch = () => {
    setSearch('');
    setQuery('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-white">User changelog</h2>
          <p className="mt-1 max-w-2xl text-sm font-sans font-light text-slate-500">
            Sign-ins, downloads and administrator changes, newest first. Filter by user or action.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(0, false)}
          disabled={loading}
          className="btn btn-outline btn-sm shrink-0"
        >
          <RefreshCw className={'h-3.5 w-3.5 ' + (loading ? 'animate-spin' : '')} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search summary, email or entity…"
            className={inputCls + ' pl-10 pr-10'}
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        <select
          value={userId ?? ''}
          onChange={(event) => onUserIdChange(event.target.value || null)}
          className={inputCls + ' lg:w-72'}
        >
          <option value="">All users</option>
          {userId && !selectedUser && <option value={userId}>Selected user</option>}
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.email}{user.role === 'admin' ? ' (admin)' : ''}
            </option>
          ))}
        </select>
        <select
          value={action}
          onChange={(event) => setAction(event.target.value)}
          className={inputCls + ' lg:w-60'}
        >
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {userId && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-xs font-sans text-slate-400">
          <User className="h-3.5 w-3.5 text-primary" />
          Showing activity for{' '}
          <span className="font-medium text-white">{selectedUser?.email ?? 'selected user'}</span>
          <button
            type="button"
            onClick={() => onUserIdChange(null)}
            className="ml-auto font-mono text-[10px] text-primary/80 transition-colors hover:text-primary"
          >
            View all users
          </button>
        </div>
      )}

      {error && <StatusLine tone="error">{error}</StatusLine>}

      <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0D14]">
        <div className="hidden grid-cols-[150px_minmax(160px,0.8fr)_minmax(0,2fr)_150px_100px] gap-4 border-b border-[#1E293B] bg-white/[0.02] px-5 py-2.5 sm:grid">
          {['When', 'User', 'Change', 'Action', 'IP'].map((label) => (
            <span key={label} className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              {label}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="px-6 py-14 text-center">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-primary" />
            <p className="text-xs font-mono text-slate-500">Loading activity…</p>
          </div>
        ) : events.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <History className="mx-auto mb-3 h-6 w-6 text-slate-600" />
            <p className="text-sm font-sans text-slate-400">No activity recorded yet.</p>
            <p className="mt-1 text-xs font-sans font-light text-slate-600">
              New sign-ins, downloads and changes will appear here.
            </p>
          </div>
        ) : (
          <>
            {events.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-1 gap-2 border-b border-[#1E293B]/60 px-5 py-4 last:border-b-0 sm:grid-cols-[150px_minmax(160px,0.8fr)_minmax(0,2fr)_150px_100px] sm:items-start sm:gap-4"
              >
                <div className="text-[11px] font-mono leading-relaxed text-slate-500">
                  {formatWhen(event.createdAt)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-sans text-slate-300">
                    {event.email || 'System'}
                  </p>
                  {event.role === 'admin' && (
                    <span className="mt-1 inline-block">
                      <Badge tone="primary">Admin</Badge>
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-sans text-white">{event.summary}</p>
                  {(event.entityType || event.entityId) && (
                    <p className="mt-1 truncate text-[10px] font-mono text-slate-600">
                      {[event.entityType, event.entityId].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div>
                  <Badge tone={actionTone(event.action)}>{actionLabel(event.action)}</Badge>
                </div>
                <div className="text-[10px] font-mono text-slate-600">{event.ip || '—'}</div>
              </div>
            ))}

            {events.length < total && (
              <div className="border-t border-[#1E293B] px-5 py-4 text-center">
                <button
                  type="button"
                  onClick={() => void load(events.length, true)}
                  disabled={loadingMore}
                  className="btn btn-outline btn-sm"
                >
                  {loadingMore ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <History className="h-3.5 w-3.5" />
                  )}
                  Load older activity
                </button>
                <p className="mt-2 text-[10px] font-mono text-slate-600">
                  Showing {events.length} of {total}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {!loading && events.length > 0 && events.length >= total && (
        <p className="text-center text-[10px] font-mono text-slate-600">
          Showing all {total} matching event{total === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  );
};
