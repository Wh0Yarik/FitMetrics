import { Router } from 'express';
import * as InviteController from '../controllers/invite.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, InviteController.createInvite);

export default router;