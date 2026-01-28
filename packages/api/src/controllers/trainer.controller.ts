import { Request, Response, NextFunction } from 'express';
import { TrainerService } from '../services/trainer.service';
import { AppError } from '../lib/AppError';

const trainerService = new TrainerService();

const parseNumber = (value: unknown, field: string) => {
  if (value === null || value === undefined || value === '') {
    throw new AppError(`${field} is required`, 400);
  }
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    throw new AppError(`${field} must be a number`, 400);
  }
  return numberValue;
};

const getParamId = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

export const listClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await trainerService.listClients(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const clientId = getParamId(req.params.id);
    const result = await trainerService.getClientDetail(userId, clientId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const clientId = getParamId(req.params.id);

    const dailyProtein = parseNumber(req.body.dailyProtein, 'dailyProtein');
    const dailyFat = parseNumber(req.body.dailyFat, 'dailyFat');
    const dailyCarbs = parseNumber(req.body.dailyCarbs, 'dailyCarbs');
    const dailyFiber = req.body.dailyFiber === '' || req.body.dailyFiber == null ? null : Number(req.body.dailyFiber);

    if (dailyFiber !== null && Number.isNaN(dailyFiber)) {
      throw new AppError('dailyFiber must be a number', 400);
    }

    const result = await trainerService.updateGoals(userId, clientId, {
      dailyProtein,
      dailyFat,
      dailyCarbs,
      dailyFiber,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const listInvites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await trainerService.listInvites(userId);
    res.json({ invites: result });
  } catch (error) {
    next(error);
  }
};

export const archiveClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const clientId = getParamId(req.params.id);
    const result = await trainerService.archiveClient(userId, clientId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const unarchiveClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const clientId = getParamId(req.params.id);
    const result = await trainerService.unarchiveClient(userId, clientId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const markSurveyReviewed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const clientId = getParamId(req.params.id);
    const surveyId = getParamId(req.params.surveyId);
    const result = await trainerService.markSurveyReviewed(userId, clientId, surveyId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
