import { PublicationStatus } from '@prisma/client';
import { z } from 'zod';

import { nullableAbsoluteUrlString, nullableAssetUrlString } from './asset-url.validation';

const nullableTrimmedString = z.string().trim().nullable().optional();
const nullableDateSchema = z.union([z.coerce.date(), z.null()]).optional();

const seoKeywordsSchema = z.array(z.string().trim().min(1)).default([]);

const allowedStatusSchema = z.enum([
  PublicationStatus.DRAFT,
  PublicationStatus.PUBLISHED,
]);

const baseNoticeBodySchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters long.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters long.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens.'),
  description: nullableTrimmedString,
  content: nullableTrimmedString,
  fileUrl: nullableAssetUrlString,
  isPinned: z.boolean(),
  publishedAt: nullableDateSchema,
  status: allowedStatusSchema,
  seoTitle: nullableTrimmedString,
  seoDescription: nullableTrimmedString,
  seoKeywords: seoKeywordsSchema,
  ogImage: nullableAssetUrlString,
  canonicalUrl: nullableAbsoluteUrlString,
});

export const createNoticeSchema = z.object({
  body: baseNoticeBodySchema,
});

export const updateNoticeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: baseNoticeBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one notice field is required.',
  }),
});

export const noticeIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const noticeSlugParamSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .trim()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
});
