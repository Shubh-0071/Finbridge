import { Router } from 'express';
import { getTransactions } from '../controllers/transactionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getTransactions);
router.get('/account/:accountId', authenticate, getTransactions);

export default router;
