import prisma from '../lib/db';
import { AppError } from '../lib/AppError';
import { InviteStatus } from '@prisma/client';

export class UserService {
  private formatBirthDate(value: Date | null) {
    return value ? value.toISOString().slice(0, 10) : null;
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        client: {
          include: {
            currentTrainer: {
              include: {
                user: true,
              },
            },
          },
        },
        trainer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const buildTrainerPayload = (trainer: {
      id: string;
      name: string;
      moderationStatus: string;
      avatarUrl: string | null;
      phone: string | null;
      socialLink: string | null;
      user?: {
        email: string;
      } | null;
    }) => {
      const contacts: { label: string; value: string }[] = [];
      if (trainer.phone) {
        contacts.push({ label: 'Телефон', value: trainer.phone });
      }
      if (trainer.socialLink) {
        const normalized = trainer.socialLink.trim();
        const label = normalized.includes('t.me') || normalized.startsWith('@') ? 'Telegram' : 'Соцсеть';
        contacts.push({ label, value: normalized });
      }
      return {
        id: trainer.id,
        name: trainer.name,
        status: trainer.moderationStatus,
        avatarUrl: trainer.avatarUrl ?? null,
        contacts,
        email: trainer.user?.email ?? null,
      };
    };

    if (user.client) {
      const latestSurvey = await prisma.dailySurvey.findFirst({
        where: { clientId: user.client.id },
        orderBy: { date: 'desc' },
      });
      const latestGoal = await prisma.nutritionGoal.findFirst({
        where: { clientId: user.client.id },
        orderBy: { startDate: 'desc' },
      });
      const goalsHistory = await prisma.nutritionGoal.findMany({
        where: { clientId: user.client.id },
        orderBy: { startDate: 'desc' },
      });

      return {
        id: user.id,
        role: user.role,
        email: user.email,
          profile: {
            name: user.client.name,
            gender: user.client.gender,
            birthDate: this.formatBirthDate(user.client.birthDate ?? null),
            height: user.client.height,
            avatarUrl: user.client.avatarUrl ?? null,
            telegram: user.client.telegram ?? null,
            currentWeight: latestSurvey?.weight ?? null,
          },
        nutritionGoals: latestGoal
          ? {
              dailyProtein: latestGoal.dailyProtein,
              dailyFat: latestGoal.dailyFat,
              dailyCarbs: latestGoal.dailyCarbs,
              dailyFiber: latestGoal.dailyFiber ?? 0,
            }
          : null,
        nutritionGoalsHistory: goalsHistory.map((goal) => ({
          dailyProtein: goal.dailyProtein,
          dailyFat: goal.dailyFat,
          dailyCarbs: goal.dailyCarbs,
          dailyFiber: goal.dailyFiber ?? 0,
          startDate: goal.startDate,
          endDate: goal.endDate,
        })),
        trainer: user.client.currentTrainer
          ? buildTrainerPayload(user.client.currentTrainer)
          : user.trainer
            ? buildTrainerPayload(user.trainer)
            : null,
      };
    }

    if (user.role === 'TRAINER' && user.trainer) {
      const createdClient = await prisma.client.create({
        data: {
          userId: user.id,
          name: user.trainer.name,
          gender: null,
          birthDate: null,
          height: null,
          currentTrainerId: user.trainer.id,
        },
      });

      return {
        id: user.id,
        role: user.role,
        email: user.email,
        profile: {
          name: createdClient.name,
          gender: createdClient.gender,
          birthDate: this.formatBirthDate(createdClient.birthDate ?? null),
          height: createdClient.height,
          avatarUrl: createdClient.avatarUrl ?? null,
          telegram: createdClient.telegram ?? null,
          currentWeight: null,
        },
        nutritionGoals: null,
        trainer: buildTrainerPayload(user.trainer),
      };
    }

    return {
      id: user.id,
      role: user.role,
      email: user.email,
      profile: {
        name: user.email,
        gender: null,
        birthDate: null,
        height: null,
        avatarUrl: null,
        telegram: null,
        currentWeight: null,
      },
      nutritionGoals: null,
      trainer: null,
    };
  }

  async updateProfile(
    userId: string,
    data: {
      name: string;
      gender?: string | null;
      birthDate?: Date | null;
      height?: number | null;
      avatarUrl?: string | null;
      telegram?: string | null;
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { client: true, trainer: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let clientId = user.client?.id ?? null;
    if (!clientId && user.role === 'TRAINER' && user.trainer) {
      const createdClient = await prisma.client.create({
        data: {
          userId: user.id,
          name: data.name,
          gender: null,
          birthDate: null,
          height: null,
          currentTrainerId: user.trainer.id,
        },
      });
      clientId = createdClient.id;
    }

    if (!clientId) {
      throw new AppError('Client profile not found', 404);
    }

    const normalizedGender =
      data.gender === 'male' ? 'M' : data.gender === 'female' ? 'F' : data.gender ? 'other' : null;

    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientId },
        data: {
          name: data.name,
          gender: normalizedGender,
          birthDate: data.birthDate ?? null,
          height: data.height ?? null,
          avatarUrl: data.avatarUrl ?? undefined,
          telegram: data.telegram ?? undefined,
        },
      });

      if (user.trainer) {
        await tx.trainer.update({
          where: { id: user.trainer.id },
          data: {
            name: data.name,
            avatarUrl: data.avatarUrl ?? undefined,
          },
        });
      }
    });

    return this.getMe(userId);
  }

  async changeTrainer(userId: string, inviteCode: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { client: true, trainer: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode },
    });

    if (!invite) {
      throw new AppError('Invalid invite code', 400);
    }

    const now = new Date();
    if (invite.status !== 'NEW' || invite.expiresAt < now) {
      throw new AppError('Invite code is not active', 400);
    }

    await prisma.$transaction(async (tx) => {
      let clientId = user.client?.id ?? null;
      if (!clientId) {
        if (user.role !== 'TRAINER' || !user.trainer) {
          throw new AppError('Client profile not found', 404);
        }
        if (invite.trainerId !== user.trainer.id) {
          throw new AppError('Invite code belongs to another trainer', 400);
        }
        const createdClient = await tx.client.create({
          data: {
            userId: user.id,
            name: user.trainer.name,
            gender: null,
            birthDate: null,
            height: null,
            currentTrainerId: invite.trainerId,
          },
        });
        clientId = createdClient.id;
      } else {
        await tx.client.update({
          where: { id: clientId },
          data: {
            currentTrainerId: invite.trainerId,
            archivedAt: null,
            archivedByTrainerId: null,
          },
        });
      }

      const updated = await tx.inviteCode.updateMany({
        where: { id: invite.id, status: InviteStatus.NEW },
        data: {
          status: InviteStatus.USED,
          clientId,
          usedAt: now,
        },
      });

      if (updated.count === 0) {
        throw new AppError('Invite code is not active', 400);
      }
    });

    return this.getMe(userId);
  }
}
