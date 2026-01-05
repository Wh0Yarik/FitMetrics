import { z } from 'zod';

export const diaryMealSchema = z.object({
  name: z.string().min(1),
  time: z.string().optional(),
  protein: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
});

export const diaryEntrySchema = z.object({
  date: z.string().min(1),
  meals: z.array(diaryMealSchema),
});

export type DiaryEntryInput = z.infer<typeof diaryEntrySchema>;
