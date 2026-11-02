import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, ShieldCheck, Loader2, Plus } from 'lucide-react';
import { formatDate, formatDateTime, getStatusColor } from '../utils';
import type { Consent } from '../types';

const PERMISSIONS = [
  { key: 'accounts:read', label: 'Read Accounts', color: 'bg-blue-100 text-blue-700' },
  { key: 'balance:read', label: 'Read Balance', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'transactions:read', label: 'Read Transactions', color: 'bg-purple-100 text-purple-700' },
  { key: 'payments:write', label: 'Initiate Payments', color: 'bg-red-100 text-red-700' },
  { key: 'kyc:read', label: 'Read KYC', color: 'bg-orange-100 text-orange-700' },
];

function PermBadge({ perm }: { perm: string }) {
  const p = PERMISSIONS.find(p => p.key === perm);
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p?.color || 'bg-gray-100 text-gray-600'}`}>{p?.label || perm}</span>;
}

function ConsentCard({ consent, onAction }: { consent: Consent; onAction: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState('');

  const act = async (action: 'approve' | 'reject' | 'revoke') => {
    setLoading(action);
    try {
      if (action === 'approve') await api.patch(`/consents/${consent.id}/approve`);
      else if (action === 'reject') await api.patch(`/consents/${consent.id}/reject`);
      else await api.delete(`/consents/${consent.id}/revoke`);
      toast.success(`Consent ${action}d successfully`);
      onAction();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action}`);
    } finally {
      setLoading('');
    }
  };

  const statusIcon = { pending: <Clock size={14} className="text-yellow-500" />, approved: <CheckCircle size={14} className="text-emerald-500" />, rejected: <XCircle size={14} className="text-red-500" />, revoked: <XCircle size={14} className="text-gray-400" />, expired: <Clock size={14} className="text-gray-400" /> }[consent.status] || null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{consent.app_name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user?.role === 'customer' ? `by ${consent.developer_name || 'Developer'} ${consent.developer_company ? `· ${consent.developer_company}` : ''}` : `for ${consent.customer_name || 'Customer'}`}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full capitalize ${getStatusColor(consent.status)}`}>
          {statusIcon} {consent.status}
        </span>
      </div>

      {consent.app_description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{consent.app_description}</p>}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {(consent.permissions || []).map(p => <PermBadge key={p} perm={p} />)}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span>Expires {formatDate(consent.expires_at)}</span>
        {consent.approved_at && <span>Approved {formatDateTime(consent.approved_at)}</span>}
        <span>Requested {formatDate(consent.created_at)}</span>
      </div>

      {user?.role === 'customer' && consent.status === 'pending' && (
        <div className="flex gap-3">
          <button onClick={() => act('approve')} disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {loading === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
          </button>
          <button onClick={() => act('reject')} disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50">
            {loading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
          </button>
        </div>
      )}
      {consent.status === 'approved' && (user?.role === 'customer' || user?.role === 'developer') && (
        <button onClick={() => act('revoke')} disabled={!!loading}
          className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50">
          {loading === 'revoke' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Revoke Access
        </button>
      )}
    </div>
  );
}

export default function ConsentPage() {
  const { user } = useAuth();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', appName: '', appDescription: '', permissions: [] as string[], expiresInDays: 90 });
  const [submitting, setSubmitting] = useState(false);

  const fetch = () => {
    api.get('/consents').then(r => setConsents(r.data.data.consents)).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const pending = consents.filter(c => c.status === 'pending');
  const approved = consents.filter(c => c.status === 'approved');
  const past = consents.filter(c => ['rejected', 'revoked', 'expired'].includes(c.status));

  const togglePerm = (p: string) => setForm(f => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p] }));

  const submitConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.appName || !form.permissions.length) { toast.error('Fill in all required fields'); return; }
    setSubmitting(true);
    try {
      await api.post('/consents', form);
      toast.success('Consent request sent to customer!');
      setShowForm(false);
      setForm({ customerId: '', appName: '', appDescription: '', permissions: [], expiresInDays: 90 });
      fetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create consent');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {user?.role === 'developer' && (
        <div className="flex justify-end">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors">
            <Plus size={16} /> Request Consent
          </button>
        </div>
      )}

      {/* Dev form */}
      {showForm && user?.role === 'developer' && (
        <form onSubmit={submitConsent} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Request Customer Consent</h3>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Customer User ID
              <span className="ml-2 text-xs text-gray-400 font-normal">(customer@finbridge.dev ID: 9929ce61-8008-4b13-b15e-8019b3bbc775)</span>
            </label>
            <input value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} placeholder="Paste customer's user ID"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">App Name</label>
            <input value={form.appName} onChange={e => setForm(f => ({ ...f, appName: e.target.value }))} placeholder="Your application name"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">App Description</label>
            <textarea value={form.appDescription} onChange={e => setForm(f => ({ ...f, appDescription: e.target.value }))} rows={2}
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Permissions Requested</label>
            <div className="flex flex-wrap gap-2">
              {PERMISSIONS.map(p => (
                <button type="button" key={p.key} onClick={() => togglePerm(p.key)}
                  className={`text-sm font-semibold px-3 py-1.5 rounded-full border-2 transition-colors ${form.permissions.includes(p.key) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Consent Duration</label>
            <select value={form.expiresInDays} onChange={e => setForm(f => ({ ...f, expiresInDays: parseInt(e.target.value) }))}
              className="px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </div>
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Send Request
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-36 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-2xl" />)}</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock size={18} className="text-yellow-500" /> Pending Requests <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
              </h3>
              <div className="space-y-3">{pending.map(c => <ConsentCard key={c.id} consent={c} onAction={fetch} />)}</div>
            </div>
          )}

          {approved.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" /> Active Consents <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{approved.length}</span>
              </h3>
              <div className="space-y-3">{approved.map(c => <ConsentCard key={c.id} consent={c} onAction={fetch} />)}</div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <XCircle size={18} className="text-gray-400" /> Past Consents
              </h3>
              <div className="space-y-3">{past.map(c => <ConsentCard key={c.id} consent={c} onAction={fetch} />)}</div>
            </div>
          )}

          {!consents.length && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
              <ShieldCheck size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">No consent records</h3>
              <p className="text-gray-500 text-sm">{user?.role === 'customer' ? 'Consent requests from developers will appear here.' : 'Use the button above to request customer consent.'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
