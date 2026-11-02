import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDateTime, getCategoryEmoji } from '../utils';
import type { Transaction } from '../types';

export default function TransactionsPage() {
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    const url = accountId
      ? `/transactions/account/${accountId}?type=${filter === 'all' ? '' : filter}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
      : `/transactions?type=${filter === 'all' ? '' : filter}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`;
    api.get(url)
      .then(r => setTransactions(r.data.data.transactions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accountId, filter, page]);

  return (
    <div className="space-y-5">
      {accountId && (
        <div className="text-sm text-gray-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2">
          Showing transactions for selected account
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        {['all', 'credit', 'debit'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(0); }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors capitalize ${filter === f ? 'bg-slate-900 dark:bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
            {f === 'all' ? 'All' : f === 'credit' ? '↓ Credits' : '↑ Debits'}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white">Transactions</h2>
          <span className="text-sm text-gray-400">{transactions.length} results</span>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">{Array(8).fill(0).map((_, i) => <div key={i} className="h-14 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-xl" />)}</div>
        ) : !transactions.length ? (
          <div className="text-center py-16 text-gray-400">
            <ArrowLeftRight size={40} className="mx-auto mb-3 opacity-30" />
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
            {transactions.map(txn => (
              <div key={txn.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${txn.type === 'credit' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                  {txn.type === 'credit'
                    ? <ArrowDownLeft size={17} className="text-emerald-600" />
                    : <ArrowUpRight size={17} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{txn.description}</p>
                    <span className="text-base flex-shrink-0" title={txn.category}>{getCategoryEmoji(txn.category)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {txn.counterparty && <span>{txn.counterparty} · </span>}
                    <span className="font-mono">{txn.reference}</span>
                  </p>
                </div>
                <div className="hidden sm:block text-xs text-gray-400">{formatDateTime(txn.created_at)}</div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-sm ${txn.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </p>
                  {txn.balance_after != null && (
                    <p className="text-xs text-gray-400">Bal: {formatCurrency(txn.balance_after)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {transactions.length === PAGE_SIZE && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-center gap-3">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-slate-700 rounded-xl disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800">← Prev</button>
            <span className="px-4 py-2 text-sm text-gray-500">Page {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowLeftRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M8 3L4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />
    </svg>
  );
}
