import { UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';

const emailSchema = z.string().email().transform((email) => email.toLowerCase().trim());

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters long.'),
    email: emailSchema,
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    role: z.nativeEnum(UserRole).default(UserRole.ADMIN),
    status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  }),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, 'Name must be at least 2 characters long.').optional(),
      email: emailSchema.optional(),
      password: z.string().min(8, 'Password must be at least 8 characters long.').optional(),
      role: z.nativeEnum(UserRole).optional(),
      status: z.nativeEnum(UserStatus).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required to update the user.',
    }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
