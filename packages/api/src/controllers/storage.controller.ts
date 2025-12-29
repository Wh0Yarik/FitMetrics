import { Request, Response, NextFunction } from 'express';
import { presignSchema } from '../schemas/storage.schema';
import { StorageService } from '../services/storage.service';

const storageService = new StorageService();

export const createPresignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = presignSchema.parse(req.body);
    const result = await storageService.getPresignedUploadUrl(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
