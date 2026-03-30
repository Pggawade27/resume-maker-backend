import { Router } from 'express';
import { queryExecutor } from '../helper/queryExecutor.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const templates = await queryExecutor(
      'SELECT id, name, preview_icon FROM templates WHERE is_active = TRUE ORDER BY id'
    );
    return res.status(200).json({ templates });
  } catch (error) {
    console.error('[template.routes > GET /]', error.message, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
