import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listMeasurements } from '../controllers/measurement.controller';

const router = Router();

router.get('/entries', authenticate, listMeasurements);

export default router;
