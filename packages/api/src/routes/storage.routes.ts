import { Router } from 'express';
import { createPresignedUrl } from '../controllers/storage.controller';

const router = Router();

router.post('/presign', createPresignedUrl);

export default router;
