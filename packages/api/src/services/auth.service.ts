import bcrypt from 'bcrypt';
import prisma from '../lib/db';
import { generateTokens } from '../lib/jwt';
import { UserRole, UserStatus, TrainerStatus, InviteStatus } from '@prisma/client';
import { z } from 'zod';
import { registerTrainerSchema, loginSchema, registerClientSchema } from '../schemas/auth.schema';
import { AppError } from '../lib/AppError';

export class AuthService {
  async registerTrainer(data: z.infer<typeof registerTrainerSchema>) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Transaction to create User and Trainer
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          phone: data.phone,
          role: UserRole.TRAINER,
          status: UserStatus.ACTIVE,
        },
      });

      const trainer = await tx.trainer.create({
        data: {
          userId: user.id,
          name: data.name,
          bio: data.bio,
          specialization: data.specialization,
          moderationStatus: TrainerStatus.PENDING_APPROVAL,
        },
      });

      return { user, trainer };
    });

    const tokens = generateTokens(result.user.id, result.user.role);
    return { user: result.user, trainer: result.trainer, ...tokens };
  }

  async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = generateTokens(user.id, user.role);
    return { user, ...tokens };
  }

  async registerClient(data: z.infer<typeof registerClientSchema>) {
    // 1. Проверяем инвайт-код
    const invite = await prisma.inviteCode.findUnique({
      where: { code: data.inviteCode },
    });

    if (!invite) {
      throw new AppError('Invalid invite code', 400);
    }

    if (invite.status !== InviteStatus.NEW) {
      throw new AppError('Invite code already used or expired', 400);
    }

    if (invite.expiresAt < new Date()) {
      throw new AppError('Invite code expired', 400);
    }

    // 2. Проверяем существование пользователя
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // 3. Транзакция создания клиента
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          phone: data.phone,
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
        },
      });

      const client = await tx.client.create({
        data: {
          userId: user.id,
          name: data.name,
          currentTrainerId: invite.trainerId,
        },
      });

      // Обновляем инвайт
      await tx.inviteCode.update({
        where: { id: invite.id },
        data: {
          status: InviteStatus.USED,
          clientId: client.id,
          usedAt: new Date(),
        },
      });

      return { user, client };
    });

    const tokens = generateTokens(result.user.id, result.user.role);
    return { user: result.user, client: result.client, ...tokens };
  }
}
