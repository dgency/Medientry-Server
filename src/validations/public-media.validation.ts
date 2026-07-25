import { z } from 'zod';

export const publicMediaParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Media ID must be a valid UUID.'),
    filename: z.string().min(1).max(255).optional(),
  }),
});
