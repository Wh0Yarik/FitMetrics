import { Request, Response } from 'express';
import { registerTrainerService } from '../../services/auth.service';

export const registerTrainer = async (req: Request, res: Response) => {
  try {
    const result = await registerTrainerService(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
