import { GalleryItemType, SimpleStatus } from '@prisma/client';
import { z } from 'zod';

import { nullableAssetUrlString } from './asset-url.validation';

const nullableTrimmedString = z.string().trim().nullable().optional();
const nullableLimitedString = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .nullable()
    .optional();

const baseGalleryItemBodySchema = z.object({
  mediaAssetId: z.string().uuid().nullable().optional(),
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters long.')
    .nullable()
    .optional(),
  type: z.nativeEnum(GalleryItemType),
  url: nullableAssetUrlString,
  thumbnail: nullableAssetUrlString,
  category: nullableTrimmedString,
  altText: nullableLimitedString(255, 'Alt text must be 255 characters or fewer.'),
  seoTitle: nullableLimitedString(255, 'SEO title must be 255 characters or fewer.'),
  seoDescription: nullableLimitedString(1000, 'SEO description must be 1000 characters or fewer.'),
  sortOrder: z.coerce.number().int().min(0),
  status: z.nativeEnum(SimpleStatus),
});

export const createGalleryItemSchema = z.object({
  body: baseGalleryItemBodySchema.superRefine((value, context) => {
    const hasTitle = Boolean(value.title?.trim());
    const hasMediaAssetId = Boolean(value.mediaAssetId);
    const hasLegacyUrl = Boolean(value.url?.trim());

    if (!hasTitle && !hasMediaAssetId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'Provide a title or select an uploaded media library asset.',
      });
    }

    if (value.type === GalleryItemType.IMAGE && !hasMediaAssetId && !hasLegacyUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'Select an uploaded media library image or provide a legacy image URL.',
      });
    }

    if (value.type === GalleryItemType.VIDEO && !hasLegacyUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'Video URL is required for gallery video items.',
      });
    }
  }),
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
