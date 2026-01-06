import bcrypt from 'bcrypt';
import prisma from '../lib/db';
import { generateTokens } from '../lib/jwt';
import { UserRole, UserStatus, TrainerStatus, InviteStatus } from '@prisma/client';
import { z } from 'zod';
import { registerTrainerSchema, loginSchema, registerClientSchema } from '../schemas/auth.schema';
import { AppError } from '../lib/AppError';

export class AuthService {
  private parseBirthDate(value: string) {
    const [year, month, day] = value.split('-').map((part) => Number(part));
    const parsed = new Date(Date.UTC(year, month - 1, day));
    const valid =
      !Number.isNaN(parsed.getTime()) &&
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day;
    if (!valid) {
      throw new AppError('Birth date must be in YYYY-MM-DD format', 400);
    }
    return parsed;
  }

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

      await tx.client.create({
        data: {
          userId: user.id,
          name: data.name,
          gender: null,
          birthDate: this.parseBirthDate(data.birthDate),
          height: null,
          currentTrainerId: trainer.id,
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

    const now = new Date();
    if (invite.status !== InviteStatus.NEW || invite.expiresAt < now) {
      throw new AppError('Invite code is not active', 400);
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
          birthDate: this.parseBirthDate(data.birthDate),
          currentTrainerId: invite.trainerId,
        },
      });

      // Обновляем инвайт (защита от повторного использования)
      const updated = await tx.inviteCode.updateMany({
        where: { id: invite.id, status: InviteStatus.NEW },
        data: {
          status: InviteStatus.USED,
          clientId: client.id,
          usedAt: now,
        },
      });
      if (updated.count === 0) {
        throw new AppError('Invite code is not active', 400);
      }

      return { user, client };
    });

    const tokens = generateTokens(result.user.id, result.user.role);
    return { user: result.user, client: result.client, ...tokens };
  }
}
