import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const demoAccounts = [
  { role: 'Customer', email: 'customer@finbridge.dev', password: 'demo1234', color: 'bg-blue-50 border-blue-200 text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  { role: 'Developer', email: 'developer@finbridge.dev', password: 'demo1234', color: 'bg-purple-50 border-purple-200 text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  { role: 'Bank Admin', email: 'admin@finbridge.dev', password: 'demo1234', color: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-100 text-amber-700' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <span className="text-2xl font-black text-white">FinBridge</span>
        </div>

        <div>
          <h2 className="text-4xl font-black text-white mb-4">The Common Banking<br />API Platform</h2>
          <p className="text-slate-400 text-lg mb-12">Try demo accounts below to explore every role in the platform.</p>

          <div className="space-y-4">
            {demoAccounts.map((d) => (
              <div key={d.role} className={`border rounded-xl p-4 ${d.color} cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => { setEmail(d.email); setPassword(d.password); }}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.badge}`}>{d.role}</span>
                  <button className="text-xs font-semibold underline">Use Demo</button>
                </div>
                <p className="text-sm font-mono">{d.email}</p>
                <p className="text-sm font-mono opacity-70">Password: demo1234</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">⚠️ Academic demonstration. No real banking data.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 size={15} className="text-white" />
            </div>
            <span className="font-black text-xl text-slate-900">FinBridge</span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 mb-2">Sign in</h1>
          <p className="text-gray-500 mb-8">Enter your credentials to access the platform.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 bg-white"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 bg-white pr-12"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:text-emerald-700">Create account</Link>
          </p>
          <p className="text-center mt-4">
            <Link to="/" className="text-gray-400 text-sm hover:text-gray-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
