import prisma from '../lib/db';
import { AppError } from '../lib/AppError';
import { NotificationType, NutritionGoal } from '@prisma/client';

type NutritionGoalsInput = {
  dailyProtein: number;
  dailyFat: number;
  dailyCarbs: number;
  dailyFiber?: number | null;
};

const getStartOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getDayKey = (date: Date) => date.toISOString().split('T')[0];

const roundToOne = (value: number) => Math.round(value * 10) / 10;

const calculateDailyScore = (totals: { totalProtein: number; totalFat: number; totalCarbs: number; totalFiber: number }, goals: NutritionGoalsInput | null) => {
  if (!goals) return 0;
  const ratios: number[] = [];

  if (goals.dailyProtein > 0) ratios.push(Math.min(1, totals.totalProtein / goals.dailyProtein));
  if (goals.dailyFat > 0) ratios.push(Math.min(1, totals.totalFat / goals.dailyFat));
  if (goals.dailyCarbs > 0) ratios.push(Math.min(1, totals.totalCarbs / goals.dailyCarbs));
  if (goals.dailyFiber && goals.dailyFiber > 0) ratios.push(Math.min(1, totals.totalFiber / goals.dailyFiber));

  if (ratios.length === 0) return 0;
  const average = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
  return roundToOne(average * 7);
};

const getWeekdayLabel = (date: Date) => {
  const labels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return labels[date.getDay()];
};

const getGoalForDate = (goals: NutritionGoal[], date: Date) => {
  const targetKey =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return goals.find((goal) => {
    const startKey =
      goal.startDate.getFullYear() * 10000 +
      (goal.startDate.getMonth() + 1) * 100 +
      goal.startDate.getDate();
    const endKey = goal.endDate
      ? goal.endDate.getFullYear() * 10000 +
        (goal.endDate.getMonth() + 1) * 100 +
        goal.endDate.getDate()
      : null;
    return startKey <= targetKey && (endKey === null || targetKey < endKey);
  });
};

export class TrainerService {
  private async getTrainerByUser(userId: string) {
    const trainer = await prisma.trainer.findUnique({ where: { userId } });
    if (!trainer) {
      throw new AppError('Trainer profile not found', 404);
    }
    return trainer;
  }

  async listInvites(userId: string) {
    const trainer = await this.getTrainerByUser(userId);
    const now = new Date();

    const invites = await prisma.inviteCode.findMany({
      where: {
        trainerId: trainer.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((invite) => ({
      id: invite.id,
      code: invite.code,
      clientName: invite.clientName ?? null,
      status: invite.status,
      isActive: invite.status === 'NEW' && invite.expiresAt > now,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      usedAt: invite.usedAt,
      clientId: invite.clientId,
    }));
  }

  async listClients(userId: string) {
    const trainer = await this.getTrainerByUser(userId);
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { currentTrainerId: trainer.id },
          { archivedByTrainerId: trainer.id },
          {
            archivedAt: { not: null },
            archivedByTrainerId: null,
            inviteCodes: { some: { trainerId: trainer.id } },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const today = getStartOfDay(new Date());
    const weekStart = getStartOfDay(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));

    const summaries = [];

    for (const client of clients) {
      const goals = await prisma.nutritionGoal.findMany({
        where: {
          clientId: client.id,
          startDate: { lte: today },
          OR: [{ endDate: null }, { endDate: { gt: weekStart } }],
        },
        orderBy: { startDate: 'desc' },
      });

      const diaryEntries = await prisma.diaryEntry.findMany({
        where: { clientId: client.id, date: { gte: weekStart, lte: today } },
      });

      const unreviewedSurveys = await prisma.dailySurvey.count({
        where: { clientId: client.id, viewedByTrainer: false },
      });

      const lastMeasurement = await prisma.measurement.findFirst({
        where: { clientId: client.id },
        orderBy: { weekStartDate: 'desc' },
      });

      const dailyScores = diaryEntries.map((entry) => {
        const goalForDate = getGoalForDate(goals, entry.date);
        return calculateDailyScore(
          {
            totalProtein: entry.totalProtein,
            totalFat: entry.totalFat,
            totalCarbs: entry.totalCarbs,
            totalFiber: entry.totalFiber,
          },
          goalForDate
            ? {
                dailyProtein: goalForDate.dailyProtein,
                dailyFat: goalForDate.dailyFat,
                dailyCarbs: goalForDate.dailyCarbs,
                dailyFiber: goalForDate.dailyFiber,
              }
            : null
        );
      });

      const complianceScore = dailyScores.length
        ? roundToOne(dailyScores.reduce((sum, value) => sum + value, 0) / dailyScores.length)
        : 0;

      const lastMeasurementDays = lastMeasurement
        ? Math.floor((today.getTime() - getStartOfDay(lastMeasurement.weekStartDate).getTime()) / (24 * 60 * 60 * 1000))
        : null;

      summaries.push({
        id: client.id,
        name: client.name,
        avatarUrl: client.avatarUrl ?? null,
        complianceScore,
        unreviewedSurveys,
        lastMeasurementDays,
        lastMeasurementDate: lastMeasurement ? lastMeasurement.weekStartDate.toISOString() : null,
        archived: client.archivedAt !== null,
      });
    }

    return { clients: summaries };
  }

  async getClientDetail(userId: string, clientId: string) {
    const trainer = await this.getTrainerByUser(userId);
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        OR: [
          { currentTrainerId: trainer.id },
          { archivedByTrainerId: trainer.id },
          {
            archivedAt: { not: null },
            archivedByTrainerId: null,
            inviteCodes: { some: { trainerId: trainer.id } },
          },
        ],
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const today = getStartOfDay(new Date());
    const weekStart = getStartOfDay(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));
    const surveysStart = getStartOfDay(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000));

    const goals = await prisma.nutritionGoal.findMany({
      where: {
        clientId: client.id,
        startDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gt: weekStart } }],
      },
      orderBy: { startDate: 'desc' },
    });

    const diaryEntries = await prisma.diaryEntry.findMany({
      where: { clientId: client.id, date: { gte: weekStart, lte: today } },
      orderBy: { date: 'asc' },
    });

    const diaryMap = new Map(diaryEntries.map((entry) => [getDayKey(entry.date), entry]));

    const complianceHistory = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = getStartOfDay(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
      const entry = diaryMap.get(getDayKey(date));
      const goalForDate = getGoalForDate(goals, date);
      const dailyScore = entry
        ? calculateDailyScore(
            {
              totalProtein: entry.totalProtein,
              totalFat: entry.totalFat,
              totalCarbs: entry.totalCarbs,
              totalFiber: entry.totalFiber,
            },
            goalForDate
              ? {
                  dailyProtein: goalForDate.dailyProtein,
                  dailyFat: goalForDate.dailyFat,
                  dailyCarbs: goalForDate.dailyCarbs,
                  dailyFiber: goalForDate.dailyFiber,
                }
              : null
          )
        : 0;
      complianceHistory.push({
        day: getWeekdayLabel(date),
        value: dailyScore,
      });
    }

    const goal = getGoalForDate(goals, today);

    const surveys = await prisma.dailySurvey.findMany({
      where: { clientId: client.id, date: { gte: surveysStart, lte: today } },
      orderBy: { date: 'desc' },
    });

    const surveyItems = surveys.map((survey) => ({
      id: survey.id,
      date: survey.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      sleep: survey.sleepHours ? `${survey.sleepHours}ч` : '—',
      stress: survey.stress != null ? `${survey.stress}/10` : '—',
      motivation: survey.motivation != null ? `${survey.motivation}/10` : '—',
      status: survey.viewedByTrainer ? 'reviewed' : 'pending',
      details: {
        Сон: survey.sleepHours ? `${survey.sleepHours} часов` : '—',
        Качество: survey.sleepQuality != null ? `${survey.sleepQuality}/5` : '—',
        Стресс: survey.stress != null ? `${survey.stress}/10` : '—',
        Мотивация: survey.motivation != null ? `${survey.motivation}/10` : '—',
        Вода: survey.water != null ? `${survey.water} л` : '—',
        Самочувствие: survey.digestion ?? '—',
        Вес: survey.weight != null ? `${survey.weight} кг` : '—',
      },
    }));

    const measurements = await prisma.measurement.findMany({
      where: { clientId: client.id },
      include: { photos: true },
      orderBy: { weekStartDate: 'desc' },
    });

    const measurementItems = measurements.map((measurement) => ({
      id: measurement.id,
      date: measurement.weekStartDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      metrics: {
        arms: measurement.armCircumference ?? 0,
        legs: measurement.legCircumference ?? 0,
        waist: measurement.waistCircumference ?? 0,
        chest: measurement.chestCircumference ?? 0,
        hips: measurement.hipCircumference ?? 0,
      },
      hasPhotos: measurement.photos.length > 0,
      photos: measurement.photos.map((photo) => photo.url),
    }));

    return {
      id: client.id,
      name: client.name,
      avatarUrl: client.avatarUrl ?? null,
      archived: client.archivedAt !== null,
      goals: goal
        ? {
          protein: goal.dailyProtein,
            fat: goal.dailyFat,
            carbs: goal.dailyCarbs,
            fiber: goal.dailyFiber ?? 0,
          }
        : null,
      complianceHistory,
      surveys: surveyItems,
      measurements: measurementItems,
    };
  }

  async archiveClient(userId: string, clientId: string) {
    const trainer = await this.getTrainerByUser(userId);
    const client = await prisma.client.findFirst({
      where: { id: clientId, currentTrainerId: trainer.id },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    if (client.archivedAt) {
      return client;
    }

    const archivedAt = new Date();

    const updated = await prisma.client.update({
      where: { id: client.id },
      data: {
        archivedAt,
        archivedByTrainerId: trainer.id,
        currentTrainerId: null,
      },
    });

    await prisma.notification.create({
      data: {
        type: NotificationType.CLIENT_ARCHIVED,
        trainerId: trainer.id,
        clientId: client.id,
        message: `Клиент ${client.name} отправлен в архив`,
      },
    });

    return updated;
  }

  async unarchiveClient(userId: string, clientId: string) {
    const trainer = await this.getTrainerByUser(userId);
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        OR: [
          { archivedByTrainerId: trainer.id },
          {
            archivedAt: { not: null },
            archivedByTrainerId: null,
            inviteCodes: { some: { trainerId: trainer.id } },
          },
        ],
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    if (!client.archivedAt) {
      return client;
    }

    return prisma.client.update({
      where: { id: client.id },
      data: {
        archivedAt: null,
        archivedByTrainerId: null,
        currentTrainerId: trainer.id,
      },
    });
  }

  async updateGoals(userId: string, clientId: string, goals: NutritionGoalsInput) {
    const trainer = await this.getTrainerByUser(userId);
    const client = await prisma.client.findFirst({
      where: { id: clientId, currentTrainerId: trainer.id },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const today = getStartOfDay(new Date());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const existingGoal = await prisma.nutritionGoal.findUnique({
      where: {
        clientId_startDate: {
          clientId: client.id,
          startDate: todayDate,
        },
      },
    });

    if (existingGoal) {
      return prisma.nutritionGoal.update({
        where: { id: existingGoal.id },
        data: {
          dailyProtein: goals.dailyProtein,
          dailyFat: goals.dailyFat,
          dailyCarbs: goals.dailyCarbs,
          dailyFiber: goals.dailyFiber ?? null,
        },
      });
    }

    await prisma.nutritionGoal.updateMany({
      where: {
        clientId: client.id,
        endDate: null,
        startDate: { lt: todayDate },
      },
      data: { endDate: todayDate },
    });

    return prisma.nutritionGoal.create({
      data: {
        clientId: client.id,
        trainerId: trainer.id,
        dailyProtein: goals.dailyProtein,
        dailyFat: goals.dailyFat,
        dailyCarbs: goals.dailyCarbs,
        dailyFiber: goals.dailyFiber ?? null,
        startDate: todayDate,
      },
    });
  }
}
