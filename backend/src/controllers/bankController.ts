import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';

export function getBanks(_req: Request, res: Response): void {
  const db = getDb();
  const banks = db.prepare('SELECT * FROM banks WHERE status = ? ORDER BY name').all('active');
  res.json({ success: true, data: { banks }, timestamp: new Date().toISOString() });
}

export function getConnectedBanks(req: Request, res: Response): void {
  const db = getDb();
  const connections = db.prepare(`
    SELECT bc.*, b.name as bank_name, b.code as bank_code, b.logo as bank_logo, b.description as bank_description
    FROM bank_connections bc
    JOIN banks b ON bc.bank_id = b.id
    WHERE bc.user_id = ? AND bc.status = 'active'
    ORDER BY bc.connected_at DESC
  `).all(req.user!.id);
  res.json({ success: true, data: { connections }, timestamp: new Date().toISOString() });
}

export function connectBank(req: Request, res: Response): void {
  const { bankId } = req.body;
  if (!bankId) {
    res.status(400).json({ success: false, message: 'bankId is required', timestamp: new Date().toISOString() });
    return;
  }

  const db = getDb();
  const bank = db.prepare('SELECT * FROM banks WHERE id = ? AND status = ?').get(bankId, 'active') as any;
  if (!bank) {
    res.status(404).json({ success: false, message: 'Bank not found', timestamp: new Date().toISOString() });
    return;
  }

  const existing = db.prepare('SELECT * FROM bank_connections WHERE user_id = ? AND bank_id = ?').get(req.user!.id, bankId) as any;
  if (existing) {
    if (existing.status === 'active') {
      res.status(409).json({ success: false, message: 'Already connected to this bank', timestamp: new Date().toISOString() });
      return;
    }
    // Re-activate
    db.prepare("UPDATE bank_connections SET status = 'active', connected_at = datetime('now'), disconnected_at = NULL WHERE id = ?").run(existing.id);
    res.json({ success: true, message: `Successfully reconnected to ${bank.name}`, data: { connectionId: existing.id }, timestamp: new Date().toISOString() });
    return;
  }

  const connectionId = uuidv4();
  db.prepare('INSERT INTO bank_connections (id, user_id, bank_id, status) VALUES (?, ?, ?, ?)').run(connectionId, req.user!.id, bankId, 'active');

  // Auto-create a simulated account for this bank
  const accountId = uuidv4();
  const accountNum = `${bank.code.replace(/[^A-Z0-9]/g, '')}${Math.floor(Math.random() * 9000000 + 1000000).toString()}`;
  const types = ['savings', 'current', 'salary'];
  const type = types[Math.floor(Math.random() * types.length)];
  const balance = Math.floor(Math.random() * 50000 + 10000);
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user!.id) as any;

  db.prepare('INSERT INTO accounts (id, bank_connection_id, account_number, account_type, holder_name, balance, currency) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(accountId, connectionId, accountNum, type, user?.name || 'Account Holder', balance, 'INR');

  res.status(201).json({
    success: true,
    message: `Successfully connected to ${bank.name}`,
    data: { connectionId, accountId },
    timestamp: new Date().toISOString(),
  });
}

export function disconnectBank(req: Request, res: Response): void {
  const { bankId } = req.params;
  const db = getDb();

  const connection = db.prepare('SELECT * FROM bank_connections WHERE user_id = ? AND bank_id = ? AND status = ?').get(req.user!.id, bankId, 'active') as any;
  if (!connection) {
    res.status(404).json({ success: false, message: 'Active connection not found', timestamp: new Date().toISOString() });
    return;
  }

  db.prepare("UPDATE bank_connections SET status = 'disconnected', disconnected_at = datetime('now') WHERE id = ?").run(connection.id);
  res.json({ success: true, message: 'Bank disconnected successfully', timestamp: new Date().toISOString() });
}
