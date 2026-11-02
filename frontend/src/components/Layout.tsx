import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Wallet, Send, ArrowLeftRight,
  Store, ShieldCheck, Code2, BarChart3, Lock, LogOut,
  Menu, X, Sun, Moon, Bell, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials, getRoleBadgeColor } from '../utils';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/banks', icon: Building2, label: 'Banks' },
  { to: '/accounts', icon: Wallet, label: 'Accounts' },
  { to: '/payments', icon: Send, label: 'Payments' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/marketplace', icon: Store, label: 'API Marketplace' },
  { to: '/consent', icon: ShieldCheck, label: 'Consent' },
  { to: '/developer', icon: Code2, label: 'Developer', roles: ['developer', 'bank_admin'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/security', icon: Lock, label: 'Security' },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/banks': 'Bank Integrations',
  '/accounts': 'Accounts',
  '/payments': 'Payments',
  '/transactions': 'Transactions',
  '/marketplace': 'API Marketplace',
  '/consent': 'Consent Management',
  '/developer': 'Developer Portal',
  '/analytics': 'Analytics',
  '/security': 'Security Center',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('fb_theme') === 'dark');

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fb_theme', 'light');
    }
  }, [dark]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const pageTitle = pageTitles[location.pathname] || 'FinBridge';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-100 dark:border-slate-800">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={15} className="text-white" />
        </div>
        <div>
          <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">FinBridge</p>
          <p className="text-gray-400 text-xs">API Platform</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {getInitials(user?.name || 'U')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeColor(user?.role || '')}`}>
              {user?.role === 'bank_admin' ? 'Bank Admin' : user?.role === 'developer' ? 'Developer' : 'Customer'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          if (item.roles && !item.roles.includes(user?.role || '')) return null;
          return (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }>
              <item.icon size={17} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-slate-800 space-y-1">
        <button onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 transform transition-transform duration-200 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
          <span className="font-black text-slate-900 dark:text-white">FinBridge</span>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 h-16 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.name || 'U')}
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
