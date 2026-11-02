import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { z } from 'zod';

const paymentSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountRef: z.string().min(5, 'Recipient account must be at least 5 characters'),
  toName: z.string().min(1, 'Recipient name is required'),
  toBank: z.string().optional(),
  amount: z.number().positive('Amount must be positive').max(1000000, 'Maximum payment is ₹10,00,000'),
  currency: z.string().default('INR'),
  description: z.string().optional(),
});

export function initiatePayment(req: Request, res: Response): void {
  try {
    const data = paymentSchema.parse(req.body);
    const db = getDb();

    // Verify account belongs to user
    const account = db.prepare(`
      SELECT a.* FROM accounts a
      JOIN bank_connections bc ON a.bank_connection_id = bc.id
      WHERE a.id = ? AND bc.user_id = ? AND bc.status = 'active' AND a.status = 'active'
    `).get(data.fromAccountId, req.user!.id) as any;

    if (!account) {
      res.status(404).json({ success: false, message: 'Source account not found or not accessible', timestamp: new Date().toISOString() });
      return;
    }

    if (account.balance < data.amount) {
      res.status(422).json({ success: false, message: `Insufficient balance. Available: ₹${account.balance.toLocaleString('en-IN')}`, timestamp: new Date().toISOString() });
      return;
    }

    const paymentId = uuidv4();
    const reference = `FBPAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const newBalance = account.balance - data.amount;

    // Use a transaction for atomicity
    const doPayment = db.transaction(() => {
      // Create payment record
      db.prepare(`
        INSERT INTO payments (id, user_id, from_account_id, to_account_ref, to_name, to_bank, amount, currency, description, reference, status, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'))
      `).run(paymentId, req.user!.id, data.fromAccountId, data.toAccountRef, data.toName, data.toBank || null, data.amount, data.currency, data.description || null, reference);

      // Deduct from source account
      db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, data.fromAccountId);

      // Create transaction record
      const txnRef = `TXN${Date.now()}`;
      db.prepare(`
        INSERT INTO transactions (id, account_id, type, amount, description, reference, counterparty, counterparty_account, balance_after, status, category)
        VALUES (?, ?, 'debit', ?, ?, ?, ?, ?, ?, 'completed', 'transfer')
      `).run(uuidv4(), data.fromAccountId, data.amount, data.description || `Payment to ${data.toName}`, txnRef, data.toName, data.toAccountRef, newBalance);
    });

    doPayment();

    res.status(201).json({
      success: true,
      message: '✅ [SANDBOX] Payment initiated successfully. No real money transferred.',
      data: { paymentId, reference, amount: data.amount, status: 'completed', newBalance },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (err.errors) {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error', timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, message: 'Payment processing failed', timestamp: new Date().toISOString() });
    }
  }
}

export function getPayments(req: Request, res: Response): void {
  const db = getDb();
  const payments = db.prepare(`
    SELECT p.*, a.account_number as from_account_number
    FROM payments p
    JOIN accounts a ON p.from_account_id = a.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT 50
  `).all(req.user!.id);
  res.json({ success: true, data: { payments }, timestamp: new Date().toISOString() });
}

export function getPayment(req: Request, res: Response): void {
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!payment) {
    res.status(404).json({ success: false, message: 'Payment not found', timestamp: new Date().toISOString() });
    return;
  }
  res.json({ success: true, data: { payment }, timestamp: new Date().toISOString() });
}
