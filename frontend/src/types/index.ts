export type UserRole = 'customer' | 'developer' | 'bank_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  logo: string;
  description: string;
  country: string;
  swift_code: string;
  status: string;
}

export interface BankConnection {
  id: string;
  user_id: string;
  bank_id: string;
  bank_name: string;
  bank_code: string;
  bank_logo: string;
  bank_description: string;
  status: string;
  connected_at: string;
}

export interface Account {
  id: string;
  bank_connection_id: string;
  account_number: string;
  account_type: string;
  holder_name: string;
  balance: number;
  currency: string;
  status: string;
  bank_name: string;
  bank_code: string;
  bank_logo: string;
  ifsc_code?: string;
  branch?: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  counterparty?: string;
  counterparty_account?: string;
  balance_after: number;
  status: string;
  category: string;
  created_at: string;
}

export interface Payment {
  id: string;
  from_account_id: string;
  to_account_ref: string;
  to_name: string;
  to_bank?: string;
  amount: number;
  currency: string;
  description?: string;
  reference: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

export interface ApiService {
  id: string;
  name: string;
  slug: string;
  endpoint: string;
  method: string;
  category: string;
  description: string;
  long_description: string;
  auth_required: string;
  tags: string[];
  example_request: Record<string, unknown>;
  example_response: Record<string, unknown>;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  status: string;
  last_used?: string;
  created_at: string;
  revoked_at?: string;
}

export interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
}

export interface Consent {
  id: string;
  customer_id: string;
  developer_id: string;
  developer_name?: string;
  developer_company?: string;
  customer_name?: string;
  app_name: string;
  app_description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked' | 'expired';
  permissions: string[];
  expires_at: string;
  approved_at?: string;
  created_at: string;
}

export interface DashboardStats {
  connectedBanks: number;
  totalAccounts: number;
  totalTransactions: number;
  totalApiRequests: number;
  successRate: number;
  totalBalance: number;
  recentActivity: Transaction[];
}
