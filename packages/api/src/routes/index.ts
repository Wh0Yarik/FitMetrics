import { Router } from 'express';
import authRoutes from './auth.routes';
import inviteRoutes from './invite.routes';

// Main router entry point
const router = Router();

router.use('/auth', authRoutes);
router.use('/invites', inviteRoutes);

export default router;