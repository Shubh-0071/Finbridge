import { Router } from 'express';
import { getConsents, createConsent, approveConsent, rejectConsent, revokeConsent } from '../controllers/consentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getConsents);
router.post('/', authenticate, createConsent);
router.patch('/:id/approve', authenticate, approveConsent);
router.patch('/:id/reject', authenticate, rejectConsent);
router.delete('/:id/revoke', authenticate, revokeConsent);

export default router;
