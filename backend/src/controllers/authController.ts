import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'developer', 'bank_admin']),
  company: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered', timestamp: new Date().toISOString() });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = uuidv4();

    db.prepare('INSERT INTO users (id, email, password_hash, name, role, company) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, data.email, passwordHash, data.name, data.role, data.company || null);

    const token = jwt.sign(
      { id: userId, email: data.email, name: data.name, role: data.role },
      process.env.JWT_SECRET || 'finbridge-secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, user: { id: userId, email: data.email, name: data.name, role: data.role } },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (err.errors) {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error', timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, message: 'Registration failed', timestamp: new Date().toISOString() });
    }
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email) as any;
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password', timestamp: new Date().toISOString() });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid email or password', timestamp: new Date().toISOString() });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'finbridge-secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company } },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (err.errors) {
      res.status(400).json({ success: false, message: 'Invalid request data', timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, message: 'Login failed', timestamp: new Date().toISOString() });
    }
  }
}

export function getMe(req: Request, res: Response): void {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, role, company, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found', timestamp: new Date().toISOString() });
    return;
  }
  res.json({ success: true, data: { user }, timestamp: new Date().toISOString() });
}

export function logout(_req: Request, res: Response): void {
  res.json({ success: true, message: 'Logged out successfully', timestamp: new Date().toISOString() });
}
