import { MediaKind, SimpleStatus } from '@prisma/client';
import { z } from 'zod';

const nullableLimitedString = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .nullable()
    .optional();

export const listMediaAssetsQuerySchema = z.object({
  query: z.object({
    fileType: z.union([z.literal('ALL'), z.nativeEnum(MediaKind)]).optional(),
    status: z.union([z.literal('ALL'), z.nativeEnum(SimpleStatus)]).optional(),
    search: z.string().trim().max(255, 'Search must be 255 characters or fewer.').optional(),
  }),
});

export const updateMediaAssetSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      title: nullableLimitedString(255, 'Title must be 255 characters or fewer.'),
      altText: nullableLimitedString(255, 'Alt text must be 255 characters or fewer.'),
      caption: nullableLimitedString(1000, 'Caption must be 1000 characters or fewer.'),
      seoTitle: nullableLimitedString(255, 'SEO title must be 255 characters or fewer.'),
      seoDescription: nullableLimitedString(1000, 'SEO description must be 1000 characters or fewer.'),
      status: z.nativeEnum(SimpleStatus).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one media asset field is required.',
    }),
});

export const mediaAssetIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const bulkDeleteMediaAssetsSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().uuid())
      .min(1, 'Select at least one media asset to delete.')
      .max(100, 'You can delete up to 100 media assets at once.'),
  }),
});

export const mediaAssetUsageSummarySchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().uuid())
      .min(1, 'Select at least one media asset.')
      .max(50, 'You can check up to 50 media assets at once.'),
  }),
});
