import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listDiaryEntries, syncDiaryEntry } from '../controllers/diary.controller';

const router = Router();

router.post('/entries', authenticate, syncDiaryEntry);
router.get('/entries', authenticate, listDiaryEntries);

export default router;
