import { Request, Response, NextFunction } from 'express';
import { diaryEntrySchema } from '../schemas/diary.schema';
import { DiaryService } from '../services/diary.service';

const diaryService = new DiaryService();

export const syncDiaryEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = diaryEntrySchema.parse(req.body);
    const result = await diaryService.syncDiaryEntry(userId, data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const listDiaryEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const result = await diaryService.listDiaryEntries(userId, from, to);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
