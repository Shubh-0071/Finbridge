import { Router } from 'express';
import { getBanks, connectBank, disconnectBank, getConnectedBanks } from '../controllers/bankController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getBanks);
router.get('/connected', authenticate, getConnectedBanks);
router.post('/connect', authenticate, connectBank);
router.delete('/connect/:bankId', authenticate, disconnectBank);

export default router;
