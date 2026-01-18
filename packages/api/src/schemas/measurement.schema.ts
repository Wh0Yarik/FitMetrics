import { z } from 'zod';

export const measurementEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  chest: z.number().nullable().optional(),
  waist: z.number().nullable().optional(),
  hips: z.number().nullable().optional(),
  leftArm: z.number().nullable().optional(),
  rightArm: z.number().nullable().optional(),
  leftLeg: z.number().nullable().optional(),
  rightLeg: z.number().nullable().optional(),
});

export type MeasurementEntryInput = z.infer<typeof measurementEntrySchema>;
