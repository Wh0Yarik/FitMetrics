import prisma from '../lib/db';
import { InviteStatus } from '@prisma/client';
import { AppError } from '../lib/AppError';

export class InviteService {
  async createInvite(userId: string) {
    // 1. Находим тренера по userId
    const trainer = await prisma.trainer.findUnique({
      where: { userId },
    });

    if (!trainer) {
      throw new AppError('Trainer profile not found', 404);
    }

    // 2. Генерируем уникальный код
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await prisma.inviteCode.findUnique({ where: { code } });
      if (!existing) isUnique = true;
    }

    // 3. Создаем инвайт (срок действия 48 часов)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    return prisma.inviteCode.create({
      data: {
        code,
        trainerId: trainer.id,
        expiresAt,
        status: InviteStatus.NEW,
      },
    });
  }
}