import { Router } from 'express';
import { getAccounts, getAccount } from '../controllers/accountController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAccounts);
router.get('/:id', authenticate, getAccount);

export default router;
