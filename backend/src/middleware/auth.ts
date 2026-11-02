import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'developer' | 'bank_admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required', timestamp: new Date().toISOString() });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'finbridge-secret';
    const decoded = jwt.verify(token, secret) as AuthUser;
    const db = getDb();
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(decoded.id) as AuthUser | undefined;
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found', timestamp: new Date().toISOString() });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token', timestamp: new Date().toISOString() });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required', timestamp: new Date().toISOString() });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: `Access denied. Required role: ${roles.join(' or ')}`, timestamp: new Date().toISOString() });
      return;
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'finbridge-secret';
      const decoded = jwt.verify(token, secret) as AuthUser;
      const db = getDb();
      const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(decoded.id) as AuthUser | undefined;
      if (user) req.user = user;
    } catch { /* ignore */ }
  }
  next();
}
