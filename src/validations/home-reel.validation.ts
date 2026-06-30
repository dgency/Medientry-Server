import { SimpleStatus } from '@prisma/client';
import { z } from 'zod';

import { nullableAssetUrlString } from './asset-url.validation';

const nullableTrimmedString = z.string().trim().nullable().optional();

const baseHomeReelBodySchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters long.'),
  thumbnail: nullableAssetUrlString,
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
