import bcrypt from 'bcrypt';
import prisma from '../../lib/db';
import { trainerRegistrationSchema } from './auth.validation';
import { Role, UserStatus, ModerationStatus } from '@prisma/client';

export const registerTrainerService = async (data: any) => {
  const validatedData = trainerRegistrationSchema.parse(data);

  const { email, password, name } = validatedData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash: hashedPassword,
      role: Role.trainer,
      status: UserStatus.pending, // Trainers need admin approval
      trainer: {
        create: {
          name,
          moderation_status: ModerationStatus.pending,
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      trainer: {
        select: {
          id: true,
          name: true,
          moderation_status: true,
        }
      }
    }
  });

  // In a real app, you would not return the full user object like this
  // But for now, it's good for debugging.
  // We'll replace this with JWT generation later.
  return {
    message: 'Trainer registered successfully. Awaiting admin approval.',
    user,
  };
};
