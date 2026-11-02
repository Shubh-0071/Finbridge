import { Request, Response } from 'express';
import { getDb } from '../db/database';

export function getAccounts(req: Request, res: Response): void {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT a.*, b.name as bank_name, b.code as bank_code, b.logo as bank_logo
    FROM accounts a
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    JOIN banks b ON bc.bank_id = b.id
    WHERE bc.user_id = ? AND bc.status = 'active' AND a.status = 'active'
    ORDER BY a.created_at DESC
  `).all(req.user!.id);

  // Mask account numbers
  const masked = accounts.map((acc: any) => ({
    ...acc,
    account_number: maskAccount(acc.account_number),
  }));

  res.json({ success: true, data: { accounts: masked }, timestamp: new Date().toISOString() });
}

export function getAccount(req: Request, res: Response): void {
  const db = getDb();
  const account = db.prepare(`
    SELECT a.*, b.name as bank_name, b.code as bank_code, b.logo as bank_logo, b.swift_code, b.country
    FROM accounts a
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    JOIN banks b ON bc.bank_id = b.id
    WHERE a.id = ? AND bc.user_id = ? AND bc.status = 'active'
  `).get(req.params.id, req.user!.id) as any;

  if (!account) {
    res.status(404).json({ success: false, message: 'Account not found', timestamp: new Date().toISOString() });
    return;
  }

  const transactions = db.prepare(`
    SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(account.id);

  res.json({
    success: true,
    data: {
      account: { ...account, account_number: maskAccount(account.account_number) },
      transactions,
    },
    timestamp: new Date().toISOString(),
  });
}

function maskAccount(num: string): string {
  if (num.length <= 4) return num;
  return '*'.repeat(num.length - 4) + num.slice(-4);
}
