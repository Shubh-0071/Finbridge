import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, PlugZap, Unplug, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import type { Bank, BankConnection } from '../types';
import { formatDateTime } from '../utils';

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [connected, setConnected] = useState<BankConnection[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [b, c] = await Promise.all([api.get('/banks'), api.get('/banks/connected')]);
      setBanks(b.data.data.banks);
      setConnected(c.data.data.connections);
    } catch {
      toast.error('Failed to load bank data');
    } finally {
      setLoadingBanks(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const isConnected = (bankId: string) => connected.some(c => c.bank_id === bankId);

  const handleConnect = async (bankId: string, bankName: string) => {
    setConnecting(bankId);
    try {
      await api.post('/banks/connect', { bankId });
      toast.success(`Connected to ${bankName}!`);
      await fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (bankId: string) => {
    setDisconnecting(bankId);
    try {
      await api.delete(`/banks/connect/${bankId}`);
      toast.success('Bank disconnected');
      setConfirmDisconnect(null);
      await fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Disconnection failed');
    } finally {
      setDisconnecting(null);
    }
  };

  const bankColors = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-violet-600', 'from-orange-500 to-amber-600'];

  return (
    <div className="space-y-8">
      {/* Available Banks */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Available Banks</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Connect to simulated banking institutions</p>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loadingBanks ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-48 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {banks.map((bank, i) => {
              const connected_ = isConnected(bank.id);
              return (
                <div key={bank.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`h-2 bg-gradient-to-r ${bankColors[i % bankColors.length]}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bankColors[i % bankColors.length]} flex items-center justify-center text-2xl`}>
                          {bank.logo}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">{bank.name}</h3>
                          <p className="text-xs text-gray-400 font-mono">{bank.code} · {bank.swift_code}</p>
                        </div>
                      </div>
                      {connected_ && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
                          <CheckCircle size={12} /> Connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">{bank.description}</p>
                    <div className="flex items-center gap-3">
                      {connected_ ? (
                        <button onClick={() => setConfirmDisconnect(bank.id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                          <Unplug size={15} /> Disconnect
                        </button>
                      ) : (
                        <button onClick={() => handleConnect(bank.id, bank.name)} disabled={connecting === bank.id}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 dark:bg-emerald-600 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors disabled:opacity-50">
                          {connecting === bank.id ? <Loader2 size={15} className="animate-spin" /> : <PlugZap size={15} />}
                          {connecting === bank.id ? 'Connecting...' : 'Connect Bank'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connected Banks */}
      {connected.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-5">
            Connected Institutions <span className="ml-2 text-sm font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{connected.length}</span>
          </h2>
          <div className="space-y-3">
            {connected.map(conn => (
              <div key={conn.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl">{conn.bank_logo}</div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{conn.bank_name}</p>
                    <p className="text-xs text-gray-400">Connected {formatDateTime(conn.connected_at)}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
                  <CheckCircle size={12} /> Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disconnect confirmation */}
      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Disconnect Bank?</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">This will deactivate your connection and freeze access to linked accounts. You can reconnect at any time.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDisconnect(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDisconnect(confirmDisconnect)} disabled={!!disconnecting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {disconnecting ? <Loader2 size={15} className="animate-spin" /> : null}
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
