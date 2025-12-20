import { Router } from 'express';
import { registerTrainer } from './auth.controller';

const router = Router();

router.post('/register-trainer', registerTrainer);

export default router;
