import { useEffect, useState } from 'react';
import { Key, Play, Loader2, Copy, CheckCircle, Trash2, Eye } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDateTime, formatRelativeTime } from '../utils';
import type { ApiKey, ApiLog } from '../types';

export default function DeveloperPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testEndpoint, setTestEndpoint] = useState('/sandbox/accounts/test');
  const [testBody] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [k, l, s] = await Promise.all([api.get('/developer/keys'), api.get('/developer/logs'), api.get('/developer/stats')]);
      setKeys(k.data.data.keys);
      setLogs(l.data.data.logs);
      setStats(s.data.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, []);

  const generateKey = async () => {
    if (!newKeyName.trim()) { toast.error('Enter a key name'); return; }
    setGenerating(true);
    try {
      const res = await api.post('/developer/keys', { name: newKeyName });
      setGeneratedKey(res.data.data.rawKey);
      setNewKeyName('');
      setShowNewKey(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate key');
    } finally {
      setGenerating(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this API key? Apps using it will lose access immediately.')) return;
    setRevoking(id);
    try {
      await api.delete(`/developer/keys/${id}`);
      toast.success('API key revoked');
      fetchAll();
    } catch { toast.error('Failed to revoke key'); }
    finally { setRevoking(null); }
  };

  const copyKey = () => {
    if (generatedKey) { navigator.clipboard.writeText(generatedKey); setKeyCopied(true); toast.success('Key copied!'); }
  };

  const runTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    const start = Date.now();
    try {
      let body: any = {};
      try { body = JSON.parse(testBody); } catch { toast.error('Invalid JSON'); setTestLoading(false); return; }
      const method = testEndpoint.includes('POST') ? 'post' : 'get';
      const url = testEndpoint.replace('/api', '').split(' ').pop()!;
      const res = method === 'get' ? await api.get(url) : await api.post(url, body);
      setTestResult({ status: res.status, time: Date.now() - start, data: res.data });
      fetchAll();
    } catch (err: any) {
      setTestResult({ status: err?.response?.status || 500, time: Date.now() - start, data: err?.response?.data });
    } finally { setTestLoading(false); }
  };

  const statCards = stats ? [
    { label: 'Total Keys', value: stats.totalKeys, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Active Keys', value: stats.activeKeys, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Requests', value: stats.totalRequests, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Success Rate', value: `${stats.successRate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Avg Response', value: `${stats.avgResponseTime}ms`, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Generated key display */}
      {generatedKey && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <Key size={18} className="text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-100">⚠️ Copy your API key now</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">This key will never be shown again after you leave this page.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
            <code className="flex-1 font-mono text-sm text-slate-900 dark:text-white break-all">
              {showKey ? generatedKey : generatedKey.replace(/(?<=.{10}).(?=.{8})/g, '•')}
            </code>
            <button onClick={() => setShowKey(!showKey)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><Eye size={16} /></button>
            <button onClick={copyKey} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              {keyCopied ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
          <button onClick={() => setGeneratedKey(null)} className="mt-3 text-sm text-amber-700 hover:text-amber-800 font-semibold underline">I've copied it safely</button>
        </div>
      )}

      {/* API Keys */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">API Keys</h2>
          <button onClick={() => setShowNewKey(!showNewKey)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors">
            <Key size={15} /> Generate Key
          </button>
        </div>

        {showNewKey && (
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex gap-3">
            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g. Production API)"
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            <button onClick={generateKey} disabled={generating}
              className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
              {generating ? <Loader2 size={15} className="animate-spin" /> : null} Generate
            </button>
          </div>
        )}

        {loading ? <div className="p-6 space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-14 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-xl" />)}</div>
          : !keys.length ? <div className="p-10 text-center text-gray-400 text-sm">No API keys yet. Generate your first key above.</div>
          : (
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {keys.map(key => (
                <div key={key.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{key.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${key.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{key.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{key.key_prefix}••••••••••••••••</p>
                    <p className="text-xs text-gray-400">Created {formatDateTime(key.created_at)}{key.last_used ? ` · Last used ${formatRelativeTime(key.last_used)}` : ''}</p>
                  </div>
                  {key.status === 'active' && (
                    <button onClick={() => revokeKey(key.id)} disabled={revoking === key.id}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50 disabled:opacity-50">
                      {revoking === key.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Quick Test */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Sandbox Quick Test</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Endpoint</label>
            <select value={testEndpoint} onChange={e => setTestEndpoint(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="/sandbox/accounts/test">GET /sandbox/accounts/:id</option>
              <option value="/sandbox/accounts/test/balance">GET /sandbox/accounts/:id/balance</option>
              <option value="/sandbox/accounts/test/transactions">GET /sandbox/accounts/:id/transactions</option>
            </select>
          </div>
          <button onClick={runTest} disabled={testLoading}
            className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm">
            {testLoading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            Execute
          </button>
          {testResult && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${testResult.status < 300 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>HTTP {testResult.status}</span>
                <span className="text-xs text-gray-400">{testResult.time}ms</span>
              </div>
              <pre className="bg-slate-900 text-blue-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-60">{JSON.stringify(testResult.data, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Request Logs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">Request Logs</h2>
          <button onClick={fetchAll} className="text-xs text-gray-400 hover:text-gray-600 font-semibold">↻ Refresh</button>
        </div>
        {!logs.length ? <div className="p-8 text-center text-gray-400 text-sm">No logs yet. Make some API calls to see them here.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">Endpoint</th>
                    <th className="text-left px-4 py-3 font-semibold">Method</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Time</th>
                    <th className="text-left px-4 py-3 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {logs.slice(0, 20).map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-3 font-mono text-xs text-gray-600 dark:text-gray-300 max-w-48 truncate">{log.endpoint}</td>
                      <td className="px-4 py-3"><span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">{log.method}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.status_code < 300 ? 'bg-emerald-100 text-emerald-700' : log.status_code < 500 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {log.status_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{log.response_time_ms}ms</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatRelativeTime(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
