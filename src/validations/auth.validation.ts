import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    rememberMe: z.boolean().optional().default(false),
  }),
});
