import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { formatCurrency } from '../utils';

const COLORS = ['#10b981', '#6366f1', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b'];

function ChartCard({ title, desc, children, loading }: { title: string; desc?: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
      <h3 className="font-bold text-slate-900 dark:text-white mb-0.5">{title}</h3>
      {desc && <p className="text-xs text-gray-400 mb-5">{desc}</p>}
      {loading ? (
        <div className="h-48 animate-pulse bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-300 text-sm">Loading chart...</div>
      ) : children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [apiUsage, setApiUsage] = useState<any>(null);
  const [txnData, setTxnData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/api-usage'),
      api.get('/analytics/transactions'),
    ]).then(([o, a, t]) => {
      setOverview(o.data.data);
      setApiUsage(a.data.data);
      setTxnData(t.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const summaryCards = overview ? [
    { label: 'Total API Requests', value: overview.totalApiRequests, color: 'text-blue-600' },
    { label: 'Success Rate', value: `${overview.successRate}%`, color: 'text-emerald-600' },
    { label: 'Total Balance', value: formatCurrency(overview.totalBalance), color: 'text-slate-800 dark:text-white' },
    { label: 'Connected Banks', value: overview.connectedBanks, color: 'text-purple-600' },
  ] : [];

  const emptyMsg = <p className="text-center py-12 text-gray-400 text-sm">No data available yet. Start using the platform to generate analytics.</p>;

  return (
    <div className="space-y-6">
      {/* Summary row */}
      {!loading && overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* API usage over time */}
      <ChartCard title="API Requests (Last 14 Days)" desc="Daily successful vs. failed API calls" loading={loading}>
        {apiUsage?.dailyUsage?.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={apiUsage.dailyUsage} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Successful" />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        ) : emptyMsg}
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Transaction volume */}
        <ChartCard title="Transaction Volume (30 Days)" desc="Daily credit vs debit amounts" loading={loading}>
          {txnData?.daily?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={txnData.daily} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="credit" fill="#10b981" name="Credits" radius={[3, 3, 0, 0] as any} />
                <Bar dataKey="debit" fill="#ef4444" name="Debits" radius={[3, 3, 0, 0] as any} />
              </BarChart>
            </ResponsiveContainer>
          ) : emptyMsg}
        </ChartCard>

        {/* Category breakdown */}
        <ChartCard title="Spending by Category" desc="Transaction distribution across categories" loading={loading}>
          {txnData?.categories?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={txnData.categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80}
                  label={(props: any) => `${props.category} ${((props.percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {txnData.categories.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : emptyMsg}
        </ChartCard>
      </div>

      {/* Top endpoints */}
      <ChartCard title="Most Used API Endpoints" desc="Request count by endpoint" loading={loading}>
        {apiUsage?.topEndpoints?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={apiUsage.topEndpoints} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="endpoint" tick={{ fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#6366f1" name="Requests" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : emptyMsg}
      </ChartCard>
    </div>
  );
}
