import { Router } from 'express';
import { initiatePayment, getPayments, getPayment } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getPayments);
router.get('/:id', authenticate, getPayment);
router.post('/', authenticate, initiatePayment);

export default router;
