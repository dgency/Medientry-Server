import { GalleryItemType, SimpleStatus } from '@prisma/client';
import { z } from 'zod';

import { assetUrlString, nullableAssetUrlString } from './asset-url.validation';

const nullableTrimmedString = z.string().trim().nullable().optional();

const baseGalleryItemBodySchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters long.'),
  type: z.nativeEnum(GalleryItemType),
  url: assetUrlString,
  thumbnail: nullableAssetUrlString,
  category: nullableTrimmedString,
  sortOrder: z.coerce.number().int().min(0),
  status: z.nativeEnum(SimpleStatus),
});

export const createGalleryItemSchema = z.object({
  body: baseGalleryItemBodySchema,
});

export const updateGalleryItemSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: baseGalleryItemBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one gallery item field is required.',
  }),
});

export const galleryItemIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
