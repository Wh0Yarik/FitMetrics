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
    const birthDateRaw = req.body.birthDate !== undefined && req.body.birthDate !== null && req.body.birthDate !== ''
      ? String(req.body.birthDate).trim()
      : null;
    const height = req.body.height !== undefined && req.body.height !== null && req.body.height !== ''
      ? Number(req.body.height)
      : null;
    const avatarUrl = req.body.avatarUrl ? String(req.body.avatarUrl).trim() : null;
    const telegram = req.body.telegram ? String(req.body.telegram).trim() : null;

    if (height !== null && Number.isNaN(height)) {
      return res.status(400).json({ message: 'Height must be a number' });
    }

    let birthDate: Date | null = null;
    if (birthDateRaw) {
      const parts = birthDateRaw.split('-').map((value) => Number(value));
      if (parts.length !== 3) {
        return res.status(400).json({ message: 'Birth date must be in YYYY-MM-DD format' });
      }
      const [year, month, day] = parts;
      const parsed = new Date(Date.UTC(year, month - 1, day));
      const valid =
        !Number.isNaN(parsed.getTime()) &&
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day;
      if (!valid) {
        return res.status(400).json({ message: 'Birth date must be in YYYY-MM-DD format' });
      }
      birthDate = parsed;
    }

    const result = await userService.updateProfile(userId, {
      name,
      gender,
      birthDate,
      height,
      avatarUrl,
      telegram,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};
