import { z } from 'zod';

export const presignSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  folder: z.string().min(1).optional(),
});

export type PresignInput = z.infer<typeof presignSchema>;
