import { Router } from 'express';
import { getApiServices, getApiService } from '../controllers/marketplaceController';

const router = Router();

router.get('/services', getApiServices);
router.get('/services/:slug', getApiService);

export default router;
