import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDb } from '../db/database';

export function generateApiKey(req: Request, res: Response): void {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ success: false, message: 'Key name is required', timestamp: new Date().toISOString() });
    return;
  }

  const db = getDb();
  const rawKey = `fb_live_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = rawKey.substring(0, 16);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyId = uuidv4();

  db.prepare('INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash, status) VALUES (?, ?, ?, ?, ?, ?)').run(keyId, req.user!.id, name, prefix, keyHash, 'active');

  // Return raw key ONLY once
  res.status(201).json({
    success: true,
    message: '⚠️ Copy this key now — it will never be shown again.',
    data: { keyId, name, prefix, rawKey, createdAt: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  });
}

export function getApiKeys(req: Request, res: Response): void {
  const db = getDb();
  const keys = db.prepare('SELECT id, name, key_prefix, status, last_used, created_at, revoked_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
  res.json({ success: true, data: { keys }, timestamp: new Date().toISOString() });
}

export function revokeApiKey(req: Request, res: Response): void {
  const db = getDb();
  const key = db.prepare('SELECT * FROM api_keys WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!key) {
    res.status(404).json({ success: false, message: 'API key not found', timestamp: new Date().toISOString() });
    return;
  }
  db.prepare("UPDATE api_keys SET status = 'revoked', revoked_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: 'API key revoked', timestamp: new Date().toISOString() });
}

export function getApiLogs(req: Request, res: Response): void {
  const db = getDb();
  const { limit = '50', offset = '0' } = req.query;
  const logs = db.prepare(`
    SELECT al.* FROM api_logs al
    LEFT JOIN api_keys ak ON al.api_key_id = ak.id
    WHERE al.user_id = ? OR ak.user_id = ?
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user!.id, req.user!.id, parseInt(limit as string), parseInt(offset as string));
  res.json({ success: true, data: { logs }, timestamp: new Date().toISOString() });
}

export function getDevStats(req: Request, res: Response): void {
  const db = getDb();
  const userId = req.user!.id;

  const totalKeys = (db.prepare('SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?').get(userId) as any).count;
  const activeKeys = (db.prepare("SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND status = 'active'").get(userId) as any).count;
  const totalRequests = (db.prepare(`
    SELECT COUNT(*) as count FROM api_logs al
    LEFT JOIN api_keys ak ON al.api_key_id = ak.id
    WHERE al.user_id = ? OR ak.user_id = ?
  `).get(userId, userId) as any).count;

  const successRequests = (db.prepare(`
    SELECT COUNT(*) as count FROM api_logs al
    LEFT JOIN api_keys ak ON al.api_key_id = ak.id
    WHERE (al.user_id = ? OR ak.user_id = ?) AND al.status_code < 400
  `).get(userId, userId) as any).count;

  const avgResponseTime = (db.prepare(`
    SELECT AVG(response_time_ms) as avg FROM api_logs al
    LEFT JOIN api_keys ak ON al.api_key_id = ak.id
    WHERE (al.user_id = ? OR ak.user_id = ?)
  `).get(userId, userId) as any).avg;

  res.json({
    success: true,
    data: {
      totalKeys, activeKeys, totalRequests, successRequests,
      successRate: totalRequests > 0 ? Math.round((successRequests / totalRequests) * 100) : 0,
      avgResponseTime: Math.round(avgResponseTime || 0),
    },
    timestamp: new Date().toISOString(),
  });
}
