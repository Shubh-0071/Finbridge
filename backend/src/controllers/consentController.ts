import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { z } from 'zod';

const createConsentSchema = z.object({
  customerId: z.string().min(1),
  bankConnectionId: z.string().optional(),
  appName: z.string().min(1),
  appDescription: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
  expiresInDays: z.number().int().min(1).max(365).default(90),
});

export function getConsents(req: Request, res: Response): void {
  const db = getDb();
  const user = req.user!;

  let consents;
  if (user.role === 'customer') {
    consents = db.prepare(`
      SELECT c.*, u.name as developer_name, u.company as developer_company,
        GROUP_CONCAT(cp.permission, ',') as permissions
      FROM consents c
      JOIN users u ON c.developer_id = u.id
      LEFT JOIN consent_permissions cp ON c.id = cp.consent_id
      WHERE c.customer_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all(user.id);
  } else {
    consents = db.prepare(`
      SELECT c.*, u.name as customer_name,
        GROUP_CONCAT(cp.permission, ',') as permissions
      FROM consents c
      JOIN users u ON c.customer_id = u.id
      LEFT JOIN consent_permissions cp ON c.id = cp.consent_id
      WHERE c.developer_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all(user.id);
  }

  const parsed = (consents as any[]).map(c => ({
    ...c,
    permissions: c.permissions ? c.permissions.split(',') : [],
  }));

  res.json({ success: true, data: { consents: parsed }, timestamp: new Date().toISOString() });
}

export function createConsent(req: Request, res: Response): void {
  const user = req.user!;

  if (user.role !== 'developer' && user.role !== 'bank_admin') {
    res.status(403).json({ success: false, message: 'Only developers can create consent requests', timestamp: new Date().toISOString() });
    return;
  }

  try {
    const data = createConsentSchema.parse(req.body);
    const db = getDb();

    // Verify customer exists
    const customer = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'customer'").get(data.customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found. Please check the Customer ID.', timestamp: new Date().toISOString() });
      return;
    }

    // Prevent duplicate pending requests
    const existing = db.prepare("SELECT id FROM consents WHERE customer_id = ? AND developer_id = ? AND status = 'pending'").get(data.customerId, user.id);
    if (existing) {
      res.status(409).json({ success: false, message: 'A pending consent request already exists for this customer', timestamp: new Date().toISOString() });
      return;
    }

    const consentId = uuidv4();
    const expiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO consents (id, customer_id, developer_id, bank_connection_id, app_name, app_description, status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(consentId, data.customerId, user.id, data.bankConnectionId || null, data.appName, data.appDescription || null, expiresAt);

    const insertPerm = db.prepare('INSERT INTO consent_permissions (id, consent_id, permission) VALUES (?, ?, ?)');
    for (const perm of data.permissions) {
      insertPerm.run(uuidv4(), consentId, perm);
    }

    res.status(201).json({ success: true, message: 'Consent request sent to customer', data: { consentId }, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.errors?.[0]?.message || 'Invalid request data', timestamp: new Date().toISOString() });
  }
}

export function approveConsent(req: Request, res: Response): void {
  const db = getDb();
  const consent = db.prepare('SELECT * FROM consents WHERE id = ? AND customer_id = ?').get(req.params.id, req.user!.id) as any;
  if (!consent) {
    res.status(404).json({ success: false, message: 'Consent not found', timestamp: new Date().toISOString() });
    return;
  }
  if (consent.status !== 'pending') {
    res.status(409).json({ success: false, message: `Consent is already ${consent.status}`, timestamp: new Date().toISOString() });
    return;
  }
  db.prepare("UPDATE consents SET status = 'approved', approved_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: 'Consent approved successfully', timestamp: new Date().toISOString() });
}

export function rejectConsent(req: Request, res: Response): void {
  const db = getDb();
  const consent = db.prepare('SELECT * FROM consents WHERE id = ? AND customer_id = ?').get(req.params.id, req.user!.id) as any;
  if (!consent) {
    res.status(404).json({ success: false, message: 'Consent not found', timestamp: new Date().toISOString() });
    return;
  }
  db.prepare("UPDATE consents SET status = 'rejected', rejected_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: 'Consent rejected', timestamp: new Date().toISOString() });
}

export function revokeConsent(req: Request, res: Response): void {
  const db = getDb();
  const consent = db.prepare('SELECT * FROM consents WHERE id = ? AND (customer_id = ? OR developer_id = ?)').get(req.params.id, req.user!.id, req.user!.id) as any;
  if (!consent) {
    res.status(404).json({ success: false, message: 'Consent not found', timestamp: new Date().toISOString() });
    return;
  }
  db.prepare("UPDATE consents SET status = 'revoked', revoked_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: 'Consent revoked successfully', timestamp: new Date().toISOString() });
}
