import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listDailySurveys, syncDailySurvey } from '../controllers/survey.controller';

const router = Router();

router.post('/entries', authenticate, syncDailySurvey);
router.get('/entries', authenticate, listDailySurveys);

export default router;
