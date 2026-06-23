import { SimpleStatus } from '@prisma/client';
import { z } from 'zod';

const nullableTrimmedString = z.string().trim().optional();
const nullableUrlString = z.union([z.string().trim().url(), z.literal('')]).optional();

const baseHomeReelBodySchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters long.'),
  thumbnail: nullableUrlString,
  wistiaVideoId: nullableTrimmedString,
  wistiaEmbedCode: nullableTrimmedString,
  sortOrder: z.coerce.number().int().min(0),
  status: z.nativeEnum(SimpleStatus),
});

export const createHomeReelSchema = z.object({
  body: baseHomeReelBodySchema,
});

export const updateHomeReelSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: baseHomeReelBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one home reel field is required.',
  }),
});

export const homeReelIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
