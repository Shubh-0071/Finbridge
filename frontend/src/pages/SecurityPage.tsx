import { Shield, Users, ShieldCheck, Key, Gauge, ScrollText, Info, Lock, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'JWT Authentication',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    desc: 'All protected endpoints require a signed JSON Web Token. Tokens expire after 7 days and are validated on every request. Invalid or tampered tokens are rejected with a 401 status.',
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    desc: 'Three distinct roles: Customer (account/payment access), FinTech Developer (API keys, logs), Bank Administrator (full access). Each role sees only its authorized data.',
  },
  {
    icon: ShieldCheck,
    title: 'OAuth 2.0 Consent Flow',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    desc: 'Simulated OAuth 2.0 consent mechanism. Customers explicitly approve or reject data access requests from developers. Each consent has scoped permissions and an expiry date.',
  },
  {
    icon: Key,
    title: 'API Key Authentication',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    desc: 'Developer API keys are hashed with SHA-256 before storage. The raw key is shown only once at generation time and never stored in plaintext. Keys can be revoked instantly.',
  },
  {
    icon: Gauge,
    title: 'Rate Limiting',
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    desc: 'All API endpoints are protected by rate limiting (100 req/15 min by default). Auth endpoints use a stricter limit (10 req/min) to prevent brute-force attacks.',
  },
  {
    icon: ScrollText,
    title: 'Audit Logging',
    color: 'text-slate-600',
    bg: 'bg-slate-50 dark:bg-slate-800',
    desc: 'All mutating operations (POST, PUT, PATCH, DELETE) are recorded in the audit_logs table with user ID, action, resource, IP address, and timestamp.',
  },
];

const layers = [
  { n: '1', label: 'TLS Transport', desc: 'HTTPS encrypted in transit (enforced in production)' },
  { n: '2', label: 'Rate Limiting', desc: 'Request throttling per IP and per API key' },
  { n: '3', label: 'JWT / API Key Validation', desc: 'Token and key authenticity checks' },
  { n: '4', label: 'RBAC Authorization', desc: 'Role and ownership checks before data access' },
  { n: '5', label: 'Consent Validation', desc: 'Active consent check for financial data APIs' },
  { n: '6', label: 'Input Validation', desc: 'Zod schema validation on all request bodies' },
  { n: '7', label: 'Audit Log', desc: 'Immutable record of all state-changing operations' },
];

export default function SecurityPage() {
  return (
    <div className="space-y-8">
      {/* Sandbox notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <div>
          <strong>Academic Demonstration:</strong> FinBridge is a sandbox platform built for educational purposes.
          It demonstrates security concepts and open banking architecture but does <strong>not</strong> claim regulatory certification,
          PCI-DSS compliance, or production-grade banking security.
        </div>
      </div>

      {/* Security features grid */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-5">Security Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                  <f.icon size={18} className={f.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{f.title}</h3>
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} /> Active
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security layers */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
            <Lock size={18} className="text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Security Architecture</h2>
            <p className="text-xs text-gray-400">Layered defence-in-depth model</p>
          </div>
        </div>
        <div className="space-y-2">
          {layers.map(l => (
            <div key={l.n} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <div className="w-7 h-7 bg-slate-900 dark:bg-emerald-600 text-white text-xs font-black rounded-lg flex items-center justify-center flex-shrink-0">{l.n}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{l.label}</p>
                <p className="text-xs text-gray-400">{l.desc}</p>
              </div>
              <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Consent model info */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck size={22} className="text-emerald-400" />
          <h2 className="font-bold text-xl">Open Banking Consent Model</h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          FinBridge implements a simulated OAuth 2.0-style consent mechanism inspired by open banking standards (PSD2, RBI Open Banking Framework).
          Customers retain full control over their financial data:
        </p>
        <ul className="space-y-2 text-sm">
          {[
            'Customers can approve or reject each consent request individually',
            'Consents are scoped to specific permissions (read/write)',
            'Every consent has a defined expiry date (max 1 year)',
            'Customers can revoke consent at any time',
            'API calls check active consent before returning financial data',
            'All consent events are recorded in the audit log',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-slate-300">
              <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
