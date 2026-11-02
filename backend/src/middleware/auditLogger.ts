import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export function auditLogger(req: Request, _res: Response, next: NextFunction): void {
  // Only log mutating operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, resource, details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        (req as any).user?.id || null,
        req.method,
        req.path,
        JSON.stringify({ body: req.body, query: req.query }).substring(0, 500),
        req.ip || req.socket.remoteAddress,
        req.headers['user-agent'] || null
      );
    } catch { /* don't fail on audit errors */ }
  }
  next();
}
