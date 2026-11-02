import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

function logApiCall(userId: string | undefined, endpoint: string, method: string, statusCode: number, responseTimeMs: number): void {
  try {
    const db = getDb();
    db.prepare('INSERT INTO api_logs (id, user_id, endpoint, method, status_code, response_time_ms) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), userId || null, endpoint, method, statusCode, responseTimeMs);
  } catch { /* silent */ }
}

export function sandboxGetAccount(req: Request, res: Response): void {
  const start = Date.now();
  const db = getDb();
  const { accountId } = req.params;

  const account = db.prepare(`
    SELECT a.*, b.name as bank_name, b.code as bank_code
    FROM accounts a
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    JOIN banks b ON bc.bank_id = b.id
    WHERE (a.id = ? OR a.account_number = ?) AND bc.user_id = ?
  `).get(accountId, accountId, req.user!.id) as any;

  if (!account) {
    logApiCall(req.user?.id, req.path, req.method, 404, Date.now() - start);
    res.status(404).json({ success: false, message: 'Account not found', timestamp: new Date().toISOString() });
    return;
  }

  logApiCall(req.user?.id, req.path, req.method, 200, Date.now() - start);
  res.json({
    success: true,
    data: {
      accountId: account.id,
      accountNumber: account.account_number.slice(-4).padStart(account.account_number.length, '*'),
      accountType: account.account_type,
      holderName: account.holder_name,
      currency: account.currency,
      status: account.status,
      bankName: account.bank_name,
      bankCode: account.bank_code,
      ifscCode: account.ifsc_code,
      branch: account.branch,
    },
    meta: { source: 'FinBridge Sandbox', sandboxMode: true },
    timestamp: new Date().toISOString(),
  });
}

export function sandboxGetBalance(req: Request, res: Response): void {
  const start = Date.now();
  const db = getDb();
  const { accountId } = req.params;

  const account = db.prepare(`
    SELECT a.balance, a.currency FROM accounts a
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    WHERE (a.id = ? OR a.account_number = ?) AND bc.user_id = ?
  `).get(accountId, accountId, req.user!.id) as any;

  if (!account) {
    logApiCall(req.user?.id, req.path, req.method, 404, Date.now() - start);
    res.status(404).json({ success: false, message: 'Account not found', timestamp: new Date().toISOString() });
    return;
  }

  logApiCall(req.user?.id, req.path, req.method, 200, Date.now() - start);
  res.json({
    success: true,
    data: {
      availableBalance: account.balance,
      ledgerBalance: account.balance,
      currency: account.currency,
      lastUpdated: new Date().toISOString(),
    },
    meta: { source: 'FinBridge Sandbox', sandboxMode: true },
    timestamp: new Date().toISOString(),
  });
}

export function sandboxGetTransactions(req: Request, res: Response): void {
  const start = Date.now();
  const db = getDb();
  const { accountId } = req.params;
  const { limit = '10', fromDate, toDate } = req.query;

  let query = `
    SELECT t.* FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    WHERE (a.id = ? OR a.account_number = ?) AND bc.user_id = ?
  `;
  const params: any[] = [accountId, accountId, req.user!.id];

  if (fromDate) { query += ' AND t.created_at >= ?'; params.push(fromDate); }
  if (toDate) { query += ' AND t.created_at <= ?'; params.push(toDate); }
  query += ' ORDER BY t.created_at DESC LIMIT ?';
  params.push(parseInt(limit as string));

  const transactions = db.prepare(query).all(...params);
  logApiCall(req.user?.id, req.path, req.method, 200, Date.now() - start);
  res.json({
    success: true,
    data: { transactions, total: transactions.length },
    meta: { source: 'FinBridge Sandbox', sandboxMode: true },
    timestamp: new Date().toISOString(),
  });
}

export function sandboxInitiatePayment(req: Request, res: Response): void {
  const start = Date.now();
  const { fromAccountId, toAccountRef, toName, amount, currency = 'INR', description } = req.body;

  if (!fromAccountId || !toAccountRef || !toName || !amount) {
    logApiCall(req.user?.id, req.path, req.method, 400, Date.now() - start);
    res.status(400).json({ success: false, message: 'fromAccountId, toAccountRef, toName, amount are required', timestamp: new Date().toISOString() });
    return;
  }

  const db = getDb();
  const account = db.prepare(`
    SELECT a.* FROM accounts a
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    WHERE a.id = ? AND bc.user_id = ? AND bc.status = 'active'
  `).get(fromAccountId, req.user!.id) as any;

  if (!account || account.balance < amount) {
    logApiCall(req.user?.id, req.path, req.method, 422, Date.now() - start);
    res.status(422).json({ success: false, message: 'Insufficient balance or account not found', timestamp: new Date().toISOString() });
    return;
  }

  const ref = `FBPAY${Date.now()}`;
  const newBalance = account.balance - amount;

  db.transaction(() => {
    db.prepare(`INSERT INTO payments (id, user_id, from_account_id, to_account_ref, to_name, amount, currency, description, reference, status, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'))`).run(uuidv4(), req.user!.id, fromAccountId, toAccountRef, toName, amount, currency, description || null, ref);
    db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, fromAccountId);
    db.prepare(`INSERT INTO transactions (id, account_id, type, amount, description, reference, counterparty, counterparty_account, balance_after, status, category)
      VALUES (?, ?, 'debit', ?, ?, ?, ?, ?, ?, 'completed', 'transfer')`).run(uuidv4(), fromAccountId, amount, description || `Payment to ${toName}`, `TXN${Date.now()}`, toName, toAccountRef, newBalance);
  })();

  logApiCall(req.user?.id, req.path, req.method, 201, Date.now() - start);
  res.status(201).json({
    success: true,
    message: '✅ [SANDBOX] Payment simulated. No real money transferred.',
    data: { paymentReference: ref, status: 'completed', amount, currency },
    meta: { source: 'FinBridge Sandbox', sandboxMode: true },
    timestamp: new Date().toISOString(),
  });
}

export function sandboxOnboarding(req: Request, res: Response): void {
  const start = Date.now();
  const { firstName, lastName, email, phone, pan } = req.body;
  if (!firstName || !lastName || !email) {
    logApiCall(req.user?.id, req.path, req.method, 400, Date.now() - start);
    res.status(400).json({ success: false, message: 'firstName, lastName, email are required', timestamp: new Date().toISOString() });
    return;
  }
  const customerId = `CUST${Date.now()}`;
  logApiCall(req.user?.id, req.path, req.method, 201, Date.now() - start);
  res.status(201).json({
    success: true,
    data: { customerId, status: 'pending_kyc', referenceNumber: `ONB${Date.now()}`, message: '[SANDBOX] Customer onboarding simulated.' },
    meta: { source: 'FinBridge Sandbox', sandboxMode: true },
    timestamp: new Date().toISOString(),
  });
}

export function sandboxKycVerify(req: Request, res: Response): void {
  const start = Date.now();
  const { customerId, documentType, documentNumber } = req.body;
  if (!customerId || !documentType || !documentNumber) {
    logApiCall(req.user?.id, req.path, req.method, 400, Date.now() - start);
    res.status(400).json({ success: false, message: 'customerId, documentType, documentNumber are required', timestamp: new Date().toISOString() });
    return;
  }
  logApiCall(req.user?.id, req.path, req.method, 200, Date.now() - start);
  res.json({
    success: true,
    data: { verificationId: `KYC${Date.now()}`, status: 'verified', confidence: 0.98, documentType, message: '[SANDBOX] KYC verification simulated.' },
    meta: { source: 'FinBridge Sandbox', sandboxMode: true },
    timestamp: new Date().toISOString(),
  });
}

export function sandboxAuthToken(req: Request, res: Response): void {
  const start = Date.now();
  const { grantType, clientId, clientSecret, scope } = req.body;
  if (!clientId || !clientSecret) {
    logApiCall(undefined, req.path, req.method, 400, Date.now() - start);
    res.status(400).json({ success: false, message: 'clientId and clientSecret required', timestamp: new Date().toISOString() });
    return;
  }
  logApiCall(undefined, req.path, req.method, 200, Date.now() - start);
  res.json({
    success: true,
    data: {
      accessToken: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SANDBOX_TOKEN.${Buffer.from(clientId).toString('base64')}`,
      tokenType: 'Bearer', expiresIn: 3600, scope: scope || 'accounts:read',
      message: '[SANDBOX] OAuth token simulated.',
    },
    meta: { source: 'FinBridge Sandbox', sandboxMode: true },
    timestamp: new Date().toISOString(),
  });
}
