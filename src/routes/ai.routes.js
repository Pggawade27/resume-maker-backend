import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { improveContent } from '../controllers/ai.controller.js';

const router = Router();

router.post('/improve', authenticate, improveContent);

export default router;
