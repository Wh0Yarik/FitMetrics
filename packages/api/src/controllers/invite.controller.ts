import { Request, Response, NextFunction } from 'express';
import { InviteService } from '../services/invite.service';

const inviteService = new InviteService();

export const createInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user гарантированно существует благодаря auth middleware
    const userId = req.user!.userId;
    const result = await inviteService.createInvite(userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};