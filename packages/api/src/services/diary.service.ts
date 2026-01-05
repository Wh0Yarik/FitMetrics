import prisma from '../lib/db';
import { AppError } from '../lib/AppError';
import type { DiaryEntryInput } from '../schemas/diary.schema';

const toDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid date format', 400);
  }
  return parsed;
};

export class DiaryService {
  async syncDiaryEntry(userId: string, data: DiaryEntryInput) {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const date = toDate(data.date);
    const totals = data.meals.reduce(
      (acc, meal) => ({
        protein: acc.protein + meal.protein,
        fat: acc.fat + meal.fat,
        carbs: acc.carbs + meal.carbs,
        fiber: acc.fiber + meal.fiber,
      }),
      { protein: 0, fat: 0, carbs: 0, fiber: 0 }
    );

    return prisma.$transaction(async (tx) => {
      const diary = await tx.diaryEntry.upsert({
        where: {
          clientId_date: {
            clientId: client.id,
            date,
          },
        },
        update: {
          totalProtein: totals.protein,
          totalFat: totals.fat,
          totalCarbs: totals.carbs,
          totalFiber: totals.fiber,
          synced: true,
        },
        create: {
          clientId: client.id,
          date,
          totalProtein: totals.protein,
          totalFat: totals.fat,
          totalCarbs: totals.carbs,
          totalFiber: totals.fiber,
          synced: true,
        },
      });

      await tx.mealEntry.deleteMany({ where: { diaryEntryId: diary.id } });

      if (data.meals.length > 0) {
        await tx.mealEntry.createMany({
          data: data.meals.map((meal) => ({
            diaryEntryId: diary.id,
            name: meal.name,
            time: meal.time ? new Date(meal.time) : null,
            protein: meal.protein,
            fat: meal.fat,
            carbs: meal.carbs,
            fiber: meal.fiber,
            synced: true,
          })),
        });
      }

      return { diaryId: diary.id, synced: true };
    });
  }
}
