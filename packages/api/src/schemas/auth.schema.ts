import { z } from 'zod';

export const registerTrainerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialization: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const registerClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format'),
  phone: z.string().optional(),
  inviteCode: z
    .string()
    .length(6)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
