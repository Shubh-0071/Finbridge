import { useEffect, useState } from 'react';
import { Play, ChevronRight, X, Loader2, Copy, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import type { ApiService } from '../types';

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  POST: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  PUT: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
};

const categoryColors: Record<string, string> = {
  Account: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  Transactions: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
  Payments: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
  Customer: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20',
  Compliance: 'bg-red-50 text-red-600 dark:bg-red-900/20',
  Authentication: 'bg-slate-100 text-slate-600 dark:bg-slate-800',
};

export default function MarketplacePage() {
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<ApiService | null>(null);
  const [detailTab, setDetailTab] = useState<'docs' | 'test'>('docs');
  const [testBody, setTestBody] = useState('{}');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/marketplace/services')
      .then(r => setServices(r.data.data.services))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))];
  const filtered = category === 'All' ? services : services.filter(s => s.category === category);

  const openDetail = (svc: ApiService) => {
    setSelected(svc);
    setDetailTab('docs');
    setTestBody(svc.example_request ? JSON.stringify(svc.example_request, null, 2) : '{}');
    setTestResult(null);
  };

  const copyEndpoint = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };

  const runTest = async () => {
    if (!selected) return;
    setTestLoading(true);
    setTestResult(null);
    const start = Date.now();
    try {
      let parsed: any = {};
      try { parsed = JSON.parse(testBody); } catch { toast.error('Invalid JSON body'); setTestLoading(false); return; }

      // Map endpoint to actual sandbox route
      const endpointMap: Record<string, () => Promise<any>> = {
        'account-information': () => api.get(`/sandbox/accounts/${parsed.accountId || 'test'}`),
        'balance-enquiry': () => api.get(`/sandbox/accounts/${parsed.accountId || 'test'}/balance`),
        'transaction-history': () => api.get(`/sandbox/accounts/${parsed.accountId || 'test'}/transactions`),
        'payment-initiation': () => api.post('/sandbox/payments', parsed),
        'customer-onboarding': () => api.post('/sandbox/onboarding', parsed),
        'kyc-verification': () => api.post('/sandbox/kyc/verify', parsed),
        'bank-authentication': () => api.post('/sandbox/auth/token', parsed),
      };
      const fn = endpointMap[selected.slug];
      if (!fn) { toast.error('No sandbox handler for this API'); setTestLoading(false); return; }
      const res = await fn();
      setTestResult({ status: res.status, time: Date.now() - start, data: res.data });
    } catch (err: any) {
      setTestResult({ status: err?.response?.status || 500, time: Date.now() - start, data: err?.response?.data || { error: err.message } });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">API Marketplace</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{services.length} standardized banking APIs · All sandbox-enabled</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${category === c ? 'bg-slate-900 dark:bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* API cards grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array(6).fill(0).map((_, i) => <div key={i} className="h-44 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-2xl" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(svc => (
            <div key={svc.id} onClick={() => openDetail(svc)}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${methodColors[svc.method]}`}>{svc.method}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[svc.category] || 'bg-gray-100 text-gray-600'}`}>{svc.category}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1.5">{svc.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed line-clamp-2">{svc.description}</p>
              <code className="text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 block font-mono text-gray-600 dark:text-gray-300 truncate">{svc.endpoint}</code>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {svc.tags?.slice(0, 3).map(t => (
                  <span key={t} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-4 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${methodColors[selected.method]}`}>{selected.method}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[selected.category] || 'bg-gray-100 text-gray-600'}`}>{selected.category}</span>
                </div>
                <h2 className="font-black text-xl text-slate-900 dark:text-white">{selected.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono text-gray-500 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded flex-1 truncate">{selected.endpoint}</code>
                  <button onClick={() => copyEndpoint(selected.endpoint)} className="text-gray-400 hover:text-gray-600">
                    {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-slate-800 px-6">
              {['docs', 'test'].map(t => (
                <button key={t} onClick={() => setDetailTab(t as any)}
                  className={`py-3 px-4 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${detailTab === t ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  {t === 'docs' ? 'Documentation' : 'Test API'}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {detailTab === 'docs' && (
                <>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{selected.long_description || selected.description}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Authentication</h4>
                    <div className="flex gap-2 flex-wrap">
                      {selected.auth_required.split(',').map(a => (
                        <span key={a} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full font-medium">{a.trim()}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Example Request</h4>
                    <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                      {JSON.stringify(selected.example_request, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Example Response</h4>
                    <pre className="bg-slate-900 text-blue-300 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                      {JSON.stringify(selected.example_response, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              {detailTab === 'test' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-2 text-sm">Request Body (JSON)</label>
                    <textarea value={testBody} onChange={e => setTestBody(e.target.value)} rows={8}
                      className="w-full font-mono text-xs bg-slate-900 text-emerald-300 p-4 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                  </div>
                  <button onClick={runTest} disabled={testLoading}
                    className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    {testLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    {testLoading ? 'Executing...' : 'Execute Request'}
                  </button>

                  {testResult && (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${testResult.status < 300 ? 'bg-emerald-100 text-emerald-700' : testResult.status < 500 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          HTTP {testResult.status}
                        </span>
                        <span className="text-sm text-gray-400">{testResult.time}ms</span>
                      </div>
                      <pre className="bg-slate-900 text-blue-300 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-80">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
