import { useEffect, useState } from 'react';
import { Send, History, Loader2, AlertCircle, CheckCircle, Clock, XCircle, Info } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime, getStatusColor } from '../utils';
import type { Account, Payment } from '../types';

type Tab = 'new' | 'history';

const statusIcon = (s: string) => {
  if (s === 'completed') return <CheckCircle size={14} className="text-emerald-500" />;
  if (s === 'pending' || s === 'processing') return <Clock size={14} className="text-yellow-500" />;
  return <XCircle size={14} className="text-red-500" />;
};

export default function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('new');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    fromAccountId: '',
    toAccountRef: '',
    toName: '',
    toBank: '',
    amount: '',
    description: '',
  });
  const [formError, setFormError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([api.get('/accounts'), api.get('/payments')])
      .then(([a, p]) => {
        setAccounts(a.data.data.accounts);
        if (a.data.data.accounts.length) set('fromAccountId', a.data.data.accounts[0].id);
        setPayments(p.data.data.payments);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedAccount = accounts.find(a => a.id === form.fromAccountId);
  const amount = parseFloat(form.amount) || 0;

  const validate = () => {
    if (!form.fromAccountId) return 'Select a source account';
    if (!form.toAccountRef || form.toAccountRef.length < 5) return 'Enter a valid recipient account';
    if (!form.toName) return 'Enter recipient name';
    if (!amount || amount <= 0) return 'Enter a valid amount';
    if (selectedAccount && amount > selectedAccount.balance) return `Insufficient balance. Available: ${formatCurrency(selectedAccount.balance)}`;
    if (amount > 1000000) return 'Maximum payment is ₹10,00,000';
    return '';
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError('');
    setShowConfirm(true);
  };

  const confirmPayment = async () => {
    setSubmitting(true);
    setShowConfirm(false);
    try {
      const res = await api.post('/payments', { ...form, amount });
      setResult(res.data);
      toast.success('Payment completed successfully!');
      setForm(f => ({ ...f, toAccountRef: '', toName: '', toBank: '', amount: '', description: '' }));
      const p = await api.get('/payments');
      setPayments(p.data.data.payments);
      const a = await api.get('/accounts');
      setAccounts(a.data.data.accounts);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sandbox notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <span><strong>Sandbox Mode:</strong> All payments are simulations. No real money is transferred.</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[{ id: 'new' as Tab, icon: Send, label: 'New Payment' }, { id: 'history' as Tab, icon: History, label: 'Payment History' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
            <h2 className="font-bold text-slate-900 dark:text-white mb-6">Initiate Payment</h2>
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                <AlertCircle size={15} /> {formError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">From Account</label>
                <select value={form.fromAccountId} onChange={e => set('fromAccountId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {loading ? <option>Loading...</option> : accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bank_name} · {a.account_number} · {formatCurrency(a.balance)}</option>
                  ))}
                </select>
                {selectedAccount && (
                  <p className="text-xs text-gray-400 mt-1">Available: <strong className="text-emerald-600">{formatCurrency(selectedAccount.balance)}</strong></p>
                )}
              </div>

              {[
                { key: 'toName', label: 'Recipient Name', placeholder: 'John Doe', type: 'text' },
                { key: 'toAccountRef', label: 'Recipient Account Number', placeholder: 'Enter account number (min 5 chars)', type: 'text' },
                { key: 'toBank', label: 'Recipient Bank (optional)', placeholder: 'e.g. HDFC Bank', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300" />
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                  <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min="1" max="1000000"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300" />
                </div>
                {selectedAccount && amount > 0 && amount > selectedAccount.balance && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Insufficient balance</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description (optional)</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Payment for invoice #1234"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none placeholder:text-gray-300" />
              </div>

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors disabled:opacity-50">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? 'Processing...' : 'Continue to Confirm'}
              </button>
            </div>
          </div>

          {/* Result panel */}
          {result && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Payment Successful!</h3>
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm">[SANDBOX SIMULATION]</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{result.data?.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(result.data?.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">New Balance</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(result.data?.newBalance)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white">Payment History</h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-14 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-xl" />)}</div>
          ) : !payments.length ? (
            <div className="text-center py-16 text-gray-400">
              <History size={40} className="mx-auto mb-3 opacity-30" />
              <p>No payments yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {payments.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Send size={15} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">To: {p.to_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.reference} · {formatDateTime(p.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-red-500">-{formatCurrency(p.amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 justify-end ${getStatusColor(p.status)}`}>
                      {statusIcon(p.status)} {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-black text-xl text-slate-900 dark:text-white mb-5">Confirm Payment</h3>
            <div className="space-y-3 text-sm mb-6">
              {[
                { label: 'From', value: `${selectedAccount?.bank_name} · ${selectedAccount?.account_number}` },
                { label: 'To', value: `${form.toName} (${form.toAccountRef})` },
                { label: 'Amount', value: formatCurrency(amount) },
                { label: 'Description', value: form.description || '—' },
              ].map(r => (
                <div key={r.label} className="flex justify-between gap-4">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-xs mb-5">
              ⚠️ SANDBOX: This is a simulated payment. No real money will be transferred.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={confirmPayment} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
