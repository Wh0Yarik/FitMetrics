import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { syncDiaryEntry } from '../controllers/diary.controller';

const router = Router();

router.post('/entries', authenticate, syncDiaryEntry);

export default router;
