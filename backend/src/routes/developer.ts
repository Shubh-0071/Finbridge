import { Router } from 'express';
import { generateApiKey, getApiKeys, revokeApiKey, getApiLogs, getDevStats } from '../controllers/developerController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('developer', 'bank_admin'));

router.get('/keys', getApiKeys);
router.post('/keys', generateApiKey);
router.delete('/keys/:id', revokeApiKey);
router.get('/logs', getApiLogs);
router.get('/stats', getDevStats);

export default router;
