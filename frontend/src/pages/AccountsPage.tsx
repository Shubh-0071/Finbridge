import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowUpRight } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, getStatusColor } from '../utils';
import type { Account } from '../types';

const typeColors: Record<string, string> = {
  savings: 'bg-blue-100 text-blue-700',
  current: 'bg-purple-100 text-purple-700',
  salary: 'bg-emerald-100 text-emerald-700',
  fixed_deposit: 'bg-orange-100 text-orange-700',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/accounts')
      .then(r => setAccounts(r.data.data.accounts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gradients = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-violet-600', 'from-orange-500 to-amber-600'];

  if (loading) return (
    <div className="grid sm:grid-cols-2 gap-5">
      {Array(3).fill(0).map((_, i) => <div key={i} className="h-52 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-2xl" />)}
    </div>
  );

  if (!accounts.length) return (
    <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
      <Wallet size={48} className="mx-auto mb-4 text-gray-300" />
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No accounts yet</h3>
      <p className="text-gray-500 mb-6">Connect a bank to see your accounts here.</p>
      <button onClick={() => navigate('/banks')}
        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors">
        Connect a Bank
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Your Accounts</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{accounts.length} account{accounts.length !== 1 ? 's' : ''} across {new Set(accounts.map(a => a.bank_name)).size} bank{new Set(accounts.map(a => a.bank_name)).size !== 1 ? 's' : ''}</p>
        </div>
        <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full">{accounts.length} total</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {accounts.map((acc, i) => (
          <div key={acc.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 group">
            {/* Card top gradient */}
            <div className={`bg-gradient-to-r ${gradients[i % gradients.length]} p-5 text-white`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{acc.bank_logo}</span>
                  <span className="text-sm font-semibold opacity-90">{acc.bank_name}</span>
                </div>
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full capitalize">{acc.account_type.replace('_', ' ')}</span>
              </div>
              <p className="text-2xl font-black mb-1">{acc.account_number}</p>
              <p className="text-sm opacity-75">{acc.holder_name}</p>
            </div>

            {/* Card bottom */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">Available Balance</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(acc.balance, acc.currency)}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(acc.status)}`}>{acc.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-5">
                {acc.ifsc_code && <div><span className="font-medium">IFSC:</span> {acc.ifsc_code}</div>}
                {acc.branch && <div className="truncate"><span className="font-medium">Branch:</span> {acc.branch}</div>}
                <div><span className="font-medium">Currency:</span> {acc.currency}</div>
                <div><span className="font-medium">Type:</span> <span className={`px-1.5 py-0.5 rounded ${typeColors[acc.account_type]}`}>{acc.account_type.replace('_', ' ')}</span></div>
              </div>

              <button onClick={() => navigate(`/transactions?accountId=${acc.id}`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group-hover:border-emerald-300 group-hover:text-emerald-700">
                <ArrowUpRight size={16} /> View Transactions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
