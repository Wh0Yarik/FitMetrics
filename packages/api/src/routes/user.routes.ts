import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as UserController from '../controllers/user.controller';

const router = Router();

router.get('/me', authenticate, UserController.getMe);
router.post('/me/trainer', authenticate, UserController.changeTrainer);
router.delete('/me/trainer', authenticate, UserController.removeTrainer);
router.put('/me/profile', authenticate, UserController.updateProfile);
router.put('/me/password', authenticate, UserController.changePassword);

export default router;
