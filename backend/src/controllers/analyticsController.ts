import { Request, Response } from 'express';
import { getDb } from '../db/database';

export function getAnalyticsOverview(req: Request, res: Response): void {
  const db = getDb();
  const userId = req.user!.id;
  const role = req.user!.role;

  const connectedBanks = (db.prepare("SELECT COUNT(*) as c FROM bank_connections WHERE user_id = ? AND status = 'active'").get(userId) as any).c;
  const totalAccounts = (db.prepare(`
    SELECT COUNT(*) as c FROM accounts a
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    WHERE bc.user_id = ? AND bc.status = 'active'
  `).get(userId) as any).c;

  const totalTransactions = (db.prepare(`
    SELECT COUNT(*) as c FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    WHERE bc.user_id = ?
  `).get(userId) as any).c;

  const totalApiRequests = (db.prepare(`
    SELECT COUNT(*) as c FROM api_logs al
    LEFT JOIN api_keys ak ON al.api_key_id = ak.id
    WHERE al.user_id = ? OR ak.user_id = ?
  `).get(userId, userId) as any).c;

  const successApiRequests = (db.prepare(`
    SELECT COUNT(*) as c FROM api_logs al
    LEFT JOIN api_keys ak ON al.api_key_id = ak.id
    WHERE (al.user_id = ? OR ak.user_id = ?) AND al.status_code < 400
  `).get(userId, userId) as any).c;

  const totalBalance = (db.prepare(`
    SELECT COALESCE(SUM(a.balance), 0) as total FROM accounts a
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    WHERE bc.user_id = ? AND bc.status = 'active'
  `).get(userId) as any).total;

  const recentActivity = db.prepare(`
    SELECT t.*, a.account_number, b.name as bank_name FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    JOIN banks b ON bc.bank_id = b.id
    WHERE bc.user_id = ?
    ORDER BY t.created_at DESC
    LIMIT 5
  `).all(userId);

  res.json({
    success: true,
    data: {
      connectedBanks, totalAccounts, totalTransactions, totalApiRequests,
      successRate: totalApiRequests > 0 ? Math.round((successApiRequests / totalApiRequests) * 100) : 100,
      totalBalance,
      recentActivity,
    },
    timestamp: new Date().toISOString(),
  });
}

export function getApiUsageChart(req: Request, res: Response): void {
  const db = getDb();
  const userId = req.user!.id;

  // Last 14 days
  const rows = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d', al.created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN al.status_code < 400 THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN al.status_code >= 400 THEN 1 ELSE 0 END) as failed
    FROM api_logs al
    LEFT JOIN api_keys ak ON al.api_key_id = ak.id
    WHERE (al.user_id = ? OR ak.user_id = ?)
      AND al.created_at >= datetime('now', '-14 days')
    GROUP BY date
    ORDER BY date ASC
  `).all(userId, userId);

  // Endpoint popularity
  const endpoints = db.prepare(`
    SELECT al.endpoint, COUNT(*) as count
    FROM api_logs al
    LEFT JOIN api_keys ak ON al.api_key_id = ak.id
    WHERE al.user_id = ? OR ak.user_id = ?
    GROUP BY al.endpoint
    ORDER BY count DESC
    LIMIT 7
  `).all(userId, userId);

  res.json({ success: true, data: { dailyUsage: rows, topEndpoints: endpoints }, timestamp: new Date().toISOString() });
}

export function getTransactionAnalytics(req: Request, res: Response): void {
  const db = getDb();
  const userId = req.user!.id;

  // Daily transaction volume — last 30 days
  const daily = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d', t.created_at) as date,
      SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END) as credit,
      SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END) as debit,
      COUNT(*) as count
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    WHERE bc.user_id = ? AND t.created_at >= datetime('now', '-30 days')
    GROUP BY date
    ORDER BY date ASC
  `).all(userId);

  // Category breakdown
  const categories = db.prepare(`
    SELECT t.category, COUNT(*) as count, SUM(t.amount) as total
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    JOIN bank_connections bc ON a.bank_connection_id = bc.id
    WHERE bc.user_id = ?
    GROUP BY t.category
    ORDER BY total DESC
  `).all(userId);

  res.json({ success: true, data: { daily, categories }, timestamp: new Date().toISOString() });
}
