import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Building2, ArrowRight, CheckCircle,
  Lock, Users, ChevronRight, Star
} from 'lucide-react';

const codeSnippet = `// FinBridge Standardized Response
{
  "success": true,
  "data": {
    "accountId": "acc_9xK2mP",
    "accountType": "savings",
    "balance": 125000.00,
    "currency": "INR",
    "holderName": "Priya Sharma"
  },
  "timestamp": "2026-11-02T08:20:53Z"
}`;

const features = [
  { icon: Shield, title: 'Bank-Grade Security', desc: 'JWT auth, OAuth 2.0, role-based access, consent validation, and full audit logging.' },
  { icon: Zap, title: 'Standardized APIs', desc: '7 unified REST APIs that work across all connected banks with consistent JSON responses.' },
  { icon: Users, title: 'Consent Management', desc: 'Customers fully control data sharing. Grant, limit, or revoke access at any time.' },
];

const steps = [
  { n: '01', title: 'Discover APIs', desc: 'Browse the API marketplace and find the banking services you need.' },
  { n: '02', title: 'Connect Bank', desc: 'Link a simulated bank to your account via secure OAuth flow.' },
  { n: '03', title: 'Grant Consent', desc: 'Customer approves specific data permissions with defined expiry.' },
  { n: '04', title: 'Build Products', desc: 'Access authorized financial data through a unified standardized API.' },
];

const apis = [
  { method: 'GET', name: 'Account Information API', endpoint: '/api/sandbox/accounts/{id}', desc: 'Retrieve standardized account details across any connected bank.' },
  { method: 'GET', name: 'Balance Enquiry API', endpoint: '/api/sandbox/accounts/{id}/balance', desc: 'Real-time available balance and ledger balance.' },
  { method: 'POST', name: 'Payment Initiation API', endpoint: '/api/sandbox/payments', desc: 'Initiate sandbox payments with full validation and reference generation.' },
];

const security = ['JWT Authentication', 'OAuth 2.0 Consent', 'Rate Limiting', 'Audit Logs', 'Role-Based Access', 'Input Validation'];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-700 bg-clip-text text-transparent">FinBridge</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <Link to="/marketplace" className="hover:text-slate-900 transition-colors">API Marketplace</Link>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
            <a href="#how" className="hover:text-slate-900 transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-slate-900 transition-colors">Sign In</Link>
            <Link to="/register" className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 50%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <Star size={12} /> Open Banking Standard v2.0
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 leading-tight">
              The Common<br />
              <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">Banking API</span><br />
              Platform
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              FinBridge standardizes communication between banks, fintech companies, and third-party providers through a unified, consent-based API architecture.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/register')}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 justify-center transition-colors">
                Start Building <ArrowRight size={18} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/marketplace')}
                className="border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/5 transition-colors">
                Explore APIs
              </motion.button>
            </div>
          </motion.div>

          {/* Code Snippet */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
            className="max-w-2xl mx-auto bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-900/50">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400 text-xs ml-2">FinBridge API Response</span>
            </div>
            <pre className="p-6 text-emerald-300 text-sm font-mono leading-relaxed overflow-x-auto">{codeSnippet}</pre>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-900 py-6 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '4', label: 'Banks Connected' },
            { value: '7', label: 'Standardized APIs' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '< 50ms', label: 'Response Time' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black text-emerald-400">{s.value}</p>
              <p className="text-slate-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Everything you need</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">A complete platform for banking API integration, consent management, and developer tooling.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <motion.div key={f.title} whileHover={{ y: -4 }} className="p-8 border border-gray-100 rounded-2xl hover:shadow-xl transition-all duration-200 group">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">How FinBridge Works</h2>
            <p className="text-lg text-gray-500">From API discovery to production integration in four steps.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
                  <div className="text-4xl font-black text-emerald-500/20 mb-3">{s.n}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-3 z-10">
                    <ChevronRight size={20} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Showcase */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Standardized Banking APIs</h2>
            <p className="text-lg text-gray-500">One integration. Every bank. Consistent responses.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {apis.map((a) => (
              <motion.div key={a.name} whileHover={{ y: -4 }} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{a.method}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{a.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{a.desc}</p>
                <code className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 block font-mono text-gray-600">{a.endpoint}</code>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/marketplace" className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700">
              View all 7 APIs <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <Lock size={12} /> Security First
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Built Secure from the Ground Up</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Every layer of FinBridge is designed with security as the primary concern.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {security.map((s) => (
              <div key={s} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-indigo-700">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-black text-white mb-6">Start building with FinBridge today</h2>
          <p className="text-emerald-100 text-lg mb-10">Join developers and banks building the future of open banking.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 justify-center">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 size={13} className="text-white" />
            </div>
            <span className="text-white font-bold">FinBridge</span>
            <span className="text-slate-500 text-sm ml-2">– Common Industry API Platform</span>
          </div>
          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <span>Academic demonstration only</span>
            <span>•</span>
            <span>No real banking data</span>
            <span>•</span>
            <span>Sandbox payments only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
