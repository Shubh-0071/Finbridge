import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.resolve(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './data');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    const dbPath = path.resolve(process.env.DB_PATH || './data/finbridge.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initializeDatabase(): void {
  const db = getDb();
  runMigrations(db);
  runSeed(db);
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer','developer','bank_admin')),
      avatar_url TEXT,
      company TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Banks table
    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      logo TEXT NOT NULL,
      description TEXT,
      country TEXT DEFAULT 'IN',
      swift_code TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','maintenance')),
      api_base_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Bank connections
    CREATE TABLE IF NOT EXISTS bank_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bank_id TEXT NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disconnected','pending')),
      connected_at TEXT NOT NULL DEFAULT (datetime('now')),
      disconnected_at TEXT,
      UNIQUE(user_id, bank_id)
    );

    -- Accounts
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      bank_connection_id TEXT NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
      account_number TEXT NOT NULL,
      account_type TEXT NOT NULL CHECK(account_type IN ('savings','current','salary','fixed_deposit')),
      holder_name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','frozen','closed')),
      ifsc_code TEXT,
      branch TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Transactions
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('credit','debit')),
      amount REAL NOT NULL,
      description TEXT,
      reference TEXT UNIQUE NOT NULL,
      counterparty TEXT,
      counterparty_account TEXT,
      balance_after REAL,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending','completed','failed','reversed')),
      category TEXT DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      from_account_id TEXT NOT NULL REFERENCES accounts(id),
      to_account_ref TEXT NOT NULL,
      to_name TEXT,
      to_bank TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      description TEXT,
      reference TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
      failure_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    -- API Services (Marketplace)
    CREATE TABLE IF NOT EXISTS api_services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      long_description TEXT,
      auth_required TEXT NOT NULL DEFAULT 'bearer',
      request_schema TEXT,
      response_schema TEXT,
      example_request TEXT,
      example_response TEXT,
      tags TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- API Keys
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
      last_used TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      revoked_at TEXT
    );

    -- API Logs
    CREATE TABLE IF NOT EXISTS api_logs (
      id TEXT PRIMARY KEY,
      api_key_id TEXT REFERENCES api_keys(id),
      user_id TEXT REFERENCES users(id),
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      response_time_ms INTEGER,
      request_body TEXT,
      response_body TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Consents
    CREATE TABLE IF NOT EXISTS consents (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      developer_id TEXT NOT NULL REFERENCES users(id),
      bank_connection_id TEXT REFERENCES bank_connections(id),
      app_name TEXT NOT NULL,
      app_description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','revoked','expired')),
      expires_at TEXT,
      approved_at TEXT,
      rejected_at TEXT,
      revoked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Consent permissions
    CREATE TABLE IF NOT EXISTS consent_permissions (
      id TEXT PRIMARY KEY,
      consent_id TEXT NOT NULL REFERENCES consents(id) ON DELETE CASCADE,
      permission TEXT NOT NULL,
      UNIQUE(consent_id, permission)
    );

    -- Audit logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_bank_connections_user ON bank_connections(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_connection ON accounts(bank_connection_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_consents_customer ON consents(customer_id);
    CREATE INDEX IF NOT EXISTS idx_consents_developer ON consents(developer_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `);
  console.log('✅ Migrations applied');
}

function runSeed(db: Database.Database): void {
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existing.count > 0) {
    console.log('ℹ️  Database already seeded');
    return;
  }

  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');

  const hashedPassword = bcrypt.hashSync('demo1234', 10);

  // Seed users
  const customerId = uuidv4();
  const developerId = uuidv4();
  const adminId = uuidv4();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, company) VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(customerId, 'customer@finbridge.dev', hashedPassword, 'Priya Sharma', 'customer', null);
  insertUser.run(developerId, 'developer@finbridge.dev', hashedPassword, 'Arjun Mehta', 'developer', 'TechPay Solutions');
  insertUser.run(adminId, 'admin@finbridge.dev', hashedPassword, 'Ravi Kumar', 'bank_admin', 'FinBank');

  // Seed banks
  const bankIds = {
    finbank: uuidv4(),
    ndb: uuidv4(),
    gtb: uuidv4(),
    unity: uuidv4(),
  };

  const insertBank = db.prepare(`
    INSERT INTO banks (id, name, code, logo, description, swift_code, api_base_url) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertBank.run(bankIds.finbank, 'FinBank', 'FNBK', '🏦', 'India\'s leading digital-first bank with comprehensive API support', 'FNBKINBB', 'https://api.finbank.dev');
  insertBank.run(bankIds.ndb, 'National Digital Bank', 'NDB', '🏛️', 'Government-backed digital bank with secure open banking APIs', 'NDBKINBB', 'https://api.ndb.gov.in');
  insertBank.run(bankIds.gtb, 'Global Trust Bank', 'GTB', '🌐', 'Multinational bank with cross-border payment capabilities', 'GTBKINBB', 'https://api.globaltrustbank.com');
  insertBank.run(bankIds.unity, 'Unity Finance', 'UNF', '🤝', 'Community-focused cooperative bank with modern fintech APIs', 'UNFCINBB', 'https://api.unityfinance.in');

  // Seed bank connections for customer
  const connId1 = uuidv4();
  const connId2 = uuidv4();

  const insertConn = db.prepare(`
    INSERT INTO bank_connections (id, user_id, bank_id, status) VALUES (?, ?, ?, 'active')
  `);
  insertConn.run(connId1, customerId, bankIds.finbank);
  insertConn.run(connId2, customerId, bankIds.ndb);

  // Seed accounts
  const acc1Id = uuidv4();
  const acc2Id = uuidv4();
  const acc3Id = uuidv4();

  const insertAcc = db.prepare(`
    INSERT INTO accounts (id, bank_connection_id, account_number, account_type, holder_name, balance, currency, ifsc_code, branch)
    VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, ?)
  `);

  insertAcc.run(acc1Id, connId1, 'FNBK00010001234', 'savings', 'Priya Sharma', 125000.00, 'FNBK0001', 'Mumbai Main Branch');
  insertAcc.run(acc2Id, connId1, 'FNBK00010005678', 'current', 'Priya Sharma', 45000.00, 'FNBK0001', 'Mumbai Main Branch');
  insertAcc.run(acc3Id, connId2, 'NDB000200089012', 'salary', 'Priya Sharma', 68500.00, 'NDB0002', 'Delhi Central Branch');

  // Seed transactions
  const insertTxn = db.prepare(`
    INSERT INTO transactions (id, account_id, type, amount, description, reference, counterparty, counterparty_account, balance_after, status, category, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
  `);

  const now = new Date();
  const txns = [
    [uuidv4(), acc1Id, 'credit', 50000, 'Salary Credit - November 2026', 'TXN' + Date.now() + '001', 'TechPay Solutions Ltd', 'FNBK00020009999', 125000, 'salary', daysAgo(1)],
    [uuidv4(), acc1Id, 'debit', 2500, 'Amazon.in - Online Shopping', 'TXN' + Date.now() + '002', 'Amazon Payments', 'AMZN00001234567', 122500, 'shopping', daysAgo(2)],
    [uuidv4(), acc1Id, 'debit', 15000, 'HDFC Home Loan EMI', 'TXN' + Date.now() + '003', 'HDFC Bank Ltd', 'HDFC00012345678', 107500, 'emi', daysAgo(3)],
    [uuidv4(), acc1Id, 'credit', 1200, 'Interest Credit Q3', 'TXN' + Date.now() + '004', 'FinBank Interest', null, 108700, 'interest', daysAgo(5)],
    [uuidv4(), acc1Id, 'debit', 800, 'Zomato Food Order', 'TXN' + Date.now() + '005', 'Zomato Pvt Ltd', null, 107900, 'food', daysAgo(6)],
    [uuidv4(), acc1Id, 'debit', 3000, 'Electricity Bill - BEST', 'TXN' + Date.now() + '006', 'BEST Undertaking', null, 104900, 'utilities', daysAgo(8)],
    [uuidv4(), acc1Id, 'credit', 25000, 'Freelance Payment - UI Design', 'TXN' + Date.now() + '007', 'WebAgency Ltd', 'GTB000300078901', 129900, 'income', daysAgo(10)],
    [uuidv4(), acc2Id, 'credit', 45000, 'Business Deposit', 'TXN' + Date.now() + '008', 'Cash Deposit', null, 45000, 'deposit', daysAgo(15)],
    [uuidv4(), acc3Id, 'credit', 68500, 'Salary - Senior Developer', 'TXN' + Date.now() + '009', 'Infosys Ltd', 'NDB000400011111', 68500, 'salary', daysAgo(1)],
    [uuidv4(), acc3Id, 'debit', 5000, 'SIP Investment - Mutual Fund', 'TXN' + Date.now() + '010', 'Zerodha Coin', null, 63500, 'investment', daysAgo(4)],
  ];

  for (const txn of txns) {
    insertTxn.run(...txn);
  }

  // Update acc1 balance to match transactions
  db.prepare('UPDATE accounts SET balance = 125000 WHERE id = ?').run(acc1Id);

  // Seed API services
  const insertApi = db.prepare(`
    INSERT INTO api_services (id, name, slug, endpoint, method, category, description, long_description, auth_required, example_request, example_response, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const apis = [
    {
      name: 'Account Information API',
      slug: 'account-information',
      endpoint: '/api/sandbox/accounts/{accountId}',
      method: 'GET',
      category: 'Account',
      description: 'Retrieve standardized account information including account number, type, holder details and status.',
      long_description: 'The Account Information API provides a standardized way to retrieve account details from any connected bank. It supports all major account types and returns data in a consistent format regardless of the underlying bank.',
      auth_required: 'bearer,consent',
      example_request: JSON.stringify({ accountId: 'FNBK00010001234' }),
      example_response: JSON.stringify({ success: true, data: { accountId: 'acc_xxx', accountNumber: '****1234', accountType: 'savings', holderName: 'Priya Sharma', currency: 'INR', status: 'active' } }),
      tags: '["account","information","open-banking"]',
    },
    {
      name: 'Balance Enquiry API',
      slug: 'balance-enquiry',
      endpoint: '/api/sandbox/accounts/{accountId}/balance',
      method: 'GET',
      category: 'Account',
      description: 'Check the current available balance and ledger balance for any connected account.',
      long_description: 'The Balance Enquiry API returns real-time balance information for connected accounts. It provides both available balance (funds available for immediate use) and ledger balance (total balance including pending transactions).',
      auth_required: 'bearer,consent',
      example_request: JSON.stringify({ accountId: 'FNBK00010001234' }),
      example_response: JSON.stringify({ success: true, data: { availableBalance: 125000, ledgerBalance: 125000, currency: 'INR', lastUpdated: '2026-11-02T00:00:00Z' } }),
      tags: '["account","balance","real-time"]',
    },
    {
      name: 'Transaction History API',
      slug: 'transaction-history',
      endpoint: '/api/sandbox/accounts/{accountId}/transactions',
      method: 'GET',
      category: 'Transactions',
      description: 'Retrieve paginated transaction history with filtering by date range, type, and amount.',
      long_description: 'The Transaction History API provides comprehensive transaction records for connected accounts. Supports date range filtering, transaction type filtering, pagination, and sorting.',
      auth_required: 'bearer,consent',
      example_request: JSON.stringify({ accountId: 'FNBK00010001234', fromDate: '2026-10-01', toDate: '2026-11-01', limit: 10 }),
      example_response: JSON.stringify({ success: true, data: { transactions: [], total: 10, page: 1 } }),
      tags: '["transactions","history","account"]',
    },
    {
      name: 'Payment Initiation API',
      slug: 'payment-initiation',
      endpoint: '/api/sandbox/payments',
      method: 'POST',
      category: 'Payments',
      description: 'Initiate a sandbox payment between accounts. Validates balance and generates a transaction reference.',
      long_description: 'The Payment Initiation API allows authorized applications to initiate payments on behalf of consenting customers. All payments are sandbox simulations — no real money is transferred.',
      auth_required: 'bearer,apikey,consent',
      example_request: JSON.stringify({ fromAccountId: 'acc_xxx', toAccountRef: '1234567890', toName: 'John Doe', amount: 1000, currency: 'INR', description: 'Invoice payment' }),
      example_response: JSON.stringify({ success: true, data: { paymentId: 'pay_xxx', reference: 'FBPAY20261102001', status: 'completed' } }),
      tags: '["payments","initiation","transfer"]',
    },
    {
      name: 'Customer Onboarding API',
      slug: 'customer-onboarding',
      endpoint: '/api/sandbox/onboarding',
      method: 'POST',
      category: 'Customer',
      description: 'Simulate customer onboarding with basic identity verification and account creation.',
      long_description: 'The Customer Onboarding API provides a standardized flow for registering new customers across participating banks. It validates basic KYC information and creates a simulated account.',
      auth_required: 'apikey',
      example_request: JSON.stringify({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+91-9876543210', pan: 'ABCDE1234F' }),
      example_response: JSON.stringify({ success: true, data: { customerId: 'cust_xxx', status: 'pending_kyc', referenceNumber: 'ONB20261102001' } }),
      tags: '["onboarding","customer","kyc"]',
    },
    {
      name: 'KYC Verification API',
      slug: 'kyc-verification',
      endpoint: '/api/sandbox/kyc/verify',
      method: 'POST',
      category: 'Compliance',
      description: 'Perform simulated KYC document verification including PAN, Aadhaar, and address proof.',
      long_description: 'The KYC Verification API simulates the document verification process required for regulatory compliance. It validates document format and returns a simulated verification result.',
      auth_required: 'apikey',
      example_request: JSON.stringify({ customerId: 'cust_xxx', documentType: 'PAN', documentNumber: 'ABCDE1234F', name: 'John Doe', dob: '1990-01-01' }),
      example_response: JSON.stringify({ success: true, data: { verificationId: 'kyc_xxx', status: 'verified', confidence: 0.98 } }),
      tags: '["kyc","compliance","verification","identity"]',
    },
    {
      name: 'Bank Authentication API',
      slug: 'bank-authentication',
      endpoint: '/api/sandbox/auth/token',
      method: 'POST',
      category: 'Authentication',
      description: 'Simulate OAuth 2.0 token exchange for bank-level authentication using client credentials.',
      long_description: 'The Bank Authentication API implements a simulated OAuth 2.0 client credentials flow for bank-to-bank and developer-to-bank authentication. Returns a short-lived access token.',
      auth_required: 'apikey',
      example_request: JSON.stringify({ grantType: 'client_credentials', clientId: 'your_client_id', clientSecret: 'your_client_secret', scope: 'accounts:read payments:write' }),
      example_response: JSON.stringify({ success: true, data: { accessToken: 'eyJ...', tokenType: 'Bearer', expiresIn: 3600, scope: 'accounts:read payments:write' } }),
      tags: '["auth","oauth","token","security"]',
    },
  ];

  for (const api of apis) {
    insertApi.run(uuidv4(), api.name, api.slug, api.endpoint, api.method, api.category, api.description, api.long_description, api.auth_required, api.example_request, api.example_response, api.tags);
  }

  // Seed a consent request for demonstration
  const consentId = uuidv4();
  db.prepare(`
    INSERT INTO consents (id, customer_id, developer_id, bank_connection_id, app_name, app_description, status, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(consentId, customerId, developerId, connId1, 'TechPay Dashboard', 'Access your FinBank account data to provide spending insights and analytics.', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());

  const insertPerm = db.prepare('INSERT INTO consent_permissions (id, consent_id, permission) VALUES (?, ?, ?)');
  ['accounts:read', 'balance:read', 'transactions:read'].forEach(p => insertPerm.run(uuidv4(), consentId, p));

  // Seed some API logs
  const insertLog = db.prepare(`
    INSERT INTO api_logs (id, user_id, endpoint, method, status_code, response_time_ms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const endpoints = ['/api/sandbox/accounts', '/api/sandbox/accounts/balance', '/api/sandbox/transactions', '/api/sandbox/payments', '/api/sandbox/kyc/verify'];
  const statuses = [200, 200, 200, 200, 200, 200, 201, 400, 401, 200];
  for (let i = 0; i < 50; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const responseTime = Math.floor(Math.random() * 200) + 20;
    const daysBack = Math.floor(Math.random() * 14);
    insertLog.run(uuidv4(), developerId, endpoint, 'GET', status, responseTime, daysAgo(daysBack));
  }

  console.log('✅ Database seeded with demo data');

  function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
