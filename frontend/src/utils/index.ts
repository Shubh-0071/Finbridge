import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function maskAccount(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'customer': return 'bg-blue-100 text-blue-700';
    case 'developer': return 'bg-purple-100 text-purple-700';
    case 'bank_admin': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': case 'active': case 'approved': case 'verified': return 'bg-green-100 text-green-700';
    case 'pending': case 'processing': return 'bg-yellow-100 text-yellow-700';
    case 'failed': case 'rejected': case 'revoked': case 'closed': return 'bg-red-100 text-red-700';
    case 'expired': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    salary: '💼', shopping: '🛍️', food: '🍕', utilities: '💡',
    investment: '📈', emi: '🏠', interest: '💰', income: '💵',
    deposit: '🏦', transfer: '↔️', general: '📋',
  };
  return map[category] || '💳';
}
