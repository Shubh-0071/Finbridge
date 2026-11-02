import { Request, Response } from 'express';
import { getDb } from '../db/database';

export function getTransactions(req: Request, res: Response): void {
  const db = getDb();
  const { accountId } = req.params;
  const { type, limit = '20', offset = '0' } = req.query;

  let query = `
    SELECT t.* FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    WHERE bc.user_id = ?
  `;
  const params: any[] = [req.user!.id];

  if (accountId) {
    query += ' AND t.account_id = ?';
    params.push(accountId);
  }
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit as string), parseInt(offset as string));

  const transactions = db.prepare(query).all(...params);
  res.json({ success: true, data: { transactions }, timestamp: new Date().toISOString() });
}
