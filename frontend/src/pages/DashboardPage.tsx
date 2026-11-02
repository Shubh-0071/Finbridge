import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Wallet, ArrowLeftRight, Activity,
  TrendingUp, IndianRupee, ArrowUpRight, ArrowDownLeft,
  AlertCircle, Send, Store, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency, formatRelativeTime, getStatusColor } from '../utils';
import type { DashboardStats, Transaction } from '../types';

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg ${className}`} />;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/overview')
      .then(r => setStats(r.data.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const statCards: StatCard[] = stats ? [
    { label: 'Connected Banks', value: String(stats.connectedBanks), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Accounts', value: String(stats.totalAccounts), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Transactions', value: String(stats.totalTransactions), icon: ArrowLeftRight, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'API Requests', value: String(stats.totalApiRequests), icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'API Success Rate', value: `${stats.successRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Balance', value: formatCurrency(stats.totalBalance), icon: IndianRupee, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-100 dark:bg-slate-800' },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your FinBridge account.</p>
        </div>
        {/* User ID badge – useful for consent flows */}
        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 flex-shrink-0">
          <p className="text-xs text-gray-400 font-medium mb-0.5">Your User ID</p>
          <p className="text-xs font-mono text-slate-700 dark:text-slate-300 select-all">{user?.id}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          statCards.map(card => (
            <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">{card.label}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{card.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon size={20} className={card.color} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Connect Bank', icon: Building2, to: '/banks', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
            { label: 'Make Payment', icon: Send, to: '/payments', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
            { label: 'View APIs', icon: Store, to: '/marketplace', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
            { label: 'Manage Consent', icon: ShieldCheck, to: '/consent', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.to)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl font-medium text-sm transition-colors ${a.color}`}>
              <a.icon size={22} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          <button onClick={() => navigate('/transactions')} className="text-sm text-emerald-600 font-semibold hover:text-emerald-700">
            View all →
          </button>
        </div>
        {loading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !stats?.recentActivity?.length ? (
          <div className="text-center py-10 text-gray-400">
            <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-30" />
            <p>No transactions yet. Connect a bank to get started.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {stats.recentActivity.map((txn: Transaction) => (
              <div key={txn.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${txn.type === 'credit' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                  {txn.type === 'credit'
                    ? <ArrowDownLeft size={16} className="text-emerald-600" />
                    : <ArrowUpRight size={16} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{txn.description}</p>
                  <p className="text-xs text-gray-400">{txn.counterparty || '—'} · {formatRelativeTime(txn.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(txn.status)}`}>{txn.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
