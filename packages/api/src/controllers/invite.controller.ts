import { Request, Response, NextFunction } from 'express';
import { InviteService } from '../services/invite.service';

const inviteService = new InviteService();

export const createInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user гарантированно существует благодаря auth middleware
    const userId = req.user!.userId;
    const clientName = typeof req.body?.clientName === 'string' ? req.body.clientName : null;
    const result = await inviteService.createInvite(userId, clientName);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const deactivateInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const inviteId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await inviteService.deactivateInvite(userId, inviteId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
