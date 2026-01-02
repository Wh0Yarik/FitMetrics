import { Router } from 'express';
import * as TrainerController from '../controllers/trainer.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/clients', authenticate, TrainerController.listClients);
router.get('/clients/:id', authenticate, TrainerController.getClient);
router.put('/clients/:id/goals', authenticate, TrainerController.updateGoals);
router.get('/invites', authenticate, TrainerController.listInvites);
router.post('/clients/:id/archive', authenticate, TrainerController.archiveClient);
router.post('/clients/:id/unarchive', authenticate, TrainerController.unarchiveClient);

export default router;
