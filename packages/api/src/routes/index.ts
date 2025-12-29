import { Router } from 'express';
import authRoutes from './auth.routes';
import inviteRoutes from './invite.routes';
import storageRoutes from './storage.routes';

// Main router entry point
const router = Router();

router.use('/auth', authRoutes);
router.use('/invites', inviteRoutes);
router.use('/storage', storageRoutes);

export default router;
