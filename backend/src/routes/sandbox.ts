import { Router } from 'express';
import {
  sandboxGetAccount,
  sandboxGetBalance,
  sandboxGetTransactions,
  sandboxInitiatePayment,
  sandboxOnboarding,
  sandboxKycVerify,
  sandboxAuthToken,
} from '../controllers/sandboxController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Sandbox endpoints — require auth; consent checked per endpoint
router.get('/accounts/:accountId', authenticate, sandboxGetAccount);
router.get('/accounts/:accountId/balance', authenticate, sandboxGetBalance);
router.get('/accounts/:accountId/transactions', authenticate, sandboxGetTransactions);
router.post('/payments', authenticate, sandboxInitiatePayment);
router.post('/onboarding', authenticate, sandboxOnboarding);
router.post('/kyc/verify', authenticate, sandboxKycVerify);
router.post('/auth/token', sandboxAuthToken);

export default router;
