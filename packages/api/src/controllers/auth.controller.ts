import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerTrainerSchema, loginSchema, registerClientSchema } from '../schemas/auth.schema';

const authService = new AuthService();

export const registerTrainer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerTrainerSchema.parse(req.body);
    const result = await authService.registerTrainer(data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const registerClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerClientSchema.parse(req.body);
    const result = await authService.registerClient(data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};