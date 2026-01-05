import prisma from '../lib/db';
import { AppError } from '../lib/AppError';
import type { DailySurveyInput } from '../schemas/survey.schema';

const toDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid date format', 400);
  }
  return parsed;
};

const mapScale = (value: string | null | undefined, map: Record<string, number>) => {
  if (value == null) return null;
  const mapped = map[value];
  if (mapped == null) {
    throw new AppError(`Invalid value: ${value}`, 400);
  }
  return mapped;
};

const mapSleepHours = (value: string | null | undefined) => {
  if (value == null) return null;
  switch (value) {
    case '0-4':
      return 3;
    case '4-6':
      return 5;
    case '6-8':
      return 7;
    case '8+':
      return 8.5;
    default:
      throw new AppError(`Invalid sleep value: ${value}`, 400);
  }
};

const mapWater = (value: string | null | undefined) => {
  if (value == null) return null;
  switch (value) {
    case '0-1':
      return 0.5;
    case '1-2':
      return 1.5;
    case '2-3':
      return 2.5;
    case '2+':
      return 3;
    default:
      throw new AppError(`Invalid water value: ${value}`, 400);
  }
};

export class SurveyService {
  async syncDailySurvey(userId: string, data: DailySurveyInput) {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const date = toDate(data.date);
    const motivation = mapScale(data.motivation, { low: 1, moderate: 2, high: 3 });
    const stress = mapScale(data.stress, { low: 1, moderate: 2, high: 3 });
    const hunger = mapScale(data.hunger, { no_appetite: 1, moderate: 2, constant: 3 });
    const libido = mapScale(data.libido, { low: 1, moderate: 2, high: 3 });
    const sleepHours = mapSleepHours(data.sleep);
    const water = mapWater(data.water);

    const survey = await prisma.dailySurvey.upsert({
      where: {
        unique_survey_per_day: {
          clientId: client.id,
          date,
        },
      },
      update: {
        weight: data.weight ?? null,
        motivation,
        sleepHours,
        sleepQuality: null,
        stress,
        digestion: data.digestion ?? null,
        water,
        hunger,
        libido,
        comment: data.comment ?? null,
        synced: true,
      },
      create: {
        clientId: client.id,
        date,
        weight: data.weight ?? null,
        motivation,
        sleepHours,
        sleepQuality: null,
        stress,
        digestion: data.digestion ?? null,
        water,
        hunger,
        libido,
        comment: data.comment ?? null,
        synced: true,
      },
    });

    return { surveyId: survey.id, synced: true };
  }
}
