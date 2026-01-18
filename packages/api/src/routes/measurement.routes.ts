import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listMeasurements, syncMeasurement } from '../controllers/measurement.controller';

const router = Router();

router.get('/entries', authenticate, listMeasurements);
router.post('/entries', authenticate, syncMeasurement);

export default router;
