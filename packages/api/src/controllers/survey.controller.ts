import { Request, Response, NextFunction } from 'express';
import { dailySurveySchema } from '../schemas/survey.schema';
import { SurveyService } from '../services/survey.service';

const surveyService = new SurveyService();

export const syncDailySurvey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = dailySurveySchema.parse(req.body);
    const result = await surveyService.syncDailySurvey(userId, data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const listDailySurveys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await surveyService.listDailySurveys(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
