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
