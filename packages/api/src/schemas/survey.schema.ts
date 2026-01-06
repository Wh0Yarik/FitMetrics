import { z } from 'zod';

export const dailySurveySchema = z.object({
  date: z.string().min(1),
  weight: z.number().nullable().optional(),
  motivation: z.enum(['low', 'moderate', 'high']).nullable().optional(),
  sleep: z.enum(['0-4', '4-6', '6-8', '8+']).nullable().optional(),
  stress: z.enum(['low', 'moderate', 'high']).nullable().optional(),
  digestion: z.enum(['0', '1', '2+']).nullable().optional(),
  water: z.enum(['0-1', '1-2', '2-3', '2+']).nullable().optional(),
  hunger: z.enum(['no_appetite', 'moderate', 'constant']).nullable().optional(),
  libido: z.enum(['low', 'moderate', 'high']).nullable().optional(),
  comment: z.string().nullable().optional(),
});

export type DailySurveyInput = z.infer<typeof dailySurveySchema>;
