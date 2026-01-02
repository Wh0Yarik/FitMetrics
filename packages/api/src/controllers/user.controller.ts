import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await userService.getMe(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const changeTrainer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const inviteCode = String(req.body.inviteCode ?? '').trim();
    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required' });
    }
    const result = await userService.changeTrainer(userId, inviteCode);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const name = String(req.body.name ?? '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const gender = req.body.gender ? String(req.body.gender).trim() : null;
    const age = req.body.age !== undefined && req.body.age !== null && req.body.age !== ''
      ? Number(req.body.age)
      : null;
    const height = req.body.height !== undefined && req.body.height !== null && req.body.height !== ''
      ? Number(req.body.height)
      : null;
    const avatarUrl = req.body.avatarUrl ? String(req.body.avatarUrl).trim() : null;
    const telegram = req.body.telegram ? String(req.body.telegram).trim() : null;

    if (age !== null && Number.isNaN(age)) {
      return res.status(400).json({ message: 'Age must be a number' });
    }
    if (height !== null && Number.isNaN(height)) {
      return res.status(400).json({ message: 'Height must be a number' });
    }

    const result = await userService.updateProfile(userId, {
      name,
      gender,
      age,
      height,
      avatarUrl,
      telegram,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};
