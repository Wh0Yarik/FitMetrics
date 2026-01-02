import { Router } from 'express';
import authRoutes from './auth.routes';
import inviteRoutes from './invite.routes';
import storageRoutes from './storage.routes';
import trainerRoutes from './trainer.routes';
import userRoutes from './user.routes';

// Main router entry point
const router = Router();

router.use('/auth', authRoutes);
router.use('/invites', inviteRoutes);
router.use('/storage', storageRoutes);
router.use('/trainer', trainerRoutes);
router.use('/users', userRoutes);

export default router;
