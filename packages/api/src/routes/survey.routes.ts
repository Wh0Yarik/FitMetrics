import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { syncDailySurvey } from '../controllers/survey.controller';

const router = Router();

router.post('/entries', authenticate, syncDailySurvey);

export default router;
