import { Request, Response, NextFunction } from 'express';
import { MeasurementService } from '../services/measurement.service';
import { measurementEntrySchema } from '../schemas/measurement.schema';

const measurementService = new MeasurementService();

export const listMeasurements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await measurementService.listForClient(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const syncMeasurement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = measurementEntrySchema.parse(req.body);
    const result = await measurementService.syncForClient(userId, data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
