import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';

const router = Router();

router.post('/register-trainer', AuthController.registerTrainer);
router.post('/login', AuthController.login);
router.post('/register-client', AuthController.registerClient);

export default router;