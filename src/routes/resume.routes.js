import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
} from '../controllers/resume.controller.js';
import { downloadResume } from '../controllers/pdf.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getResumes);
router.post('/', createResume);
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);
router.get('/:id/download', downloadResume);

export default router;
