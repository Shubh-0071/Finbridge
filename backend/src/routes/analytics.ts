import { Router } from 'express';
import { getAnalyticsOverview, getApiUsageChart, getTransactionAnalytics } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/overview', authenticate, getAnalyticsOverview);
router.get('/api-usage', authenticate, getApiUsageChart);
router.get('/transactions', authenticate, getTransactionAnalytics);

export default router;
