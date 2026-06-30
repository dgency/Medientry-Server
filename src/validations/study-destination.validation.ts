import { PublicationStatus } from '@prisma/client';
import { z } from 'zod';

import { nullableAbsoluteUrlString, nullableAssetUrlString } from './asset-url.validation';

const nullableTrimmedString = z.string().trim().nullable().optional();

const allowedStatusSchema = z.enum([
  PublicationStatus.DRAFT,
  PublicationStatus.PUBLISHED,
]);

const jsonContentSchema = z
  .record(z.string(), z.unknown())
  .or(z.array(z.unknown()))
  .optional();

const seoKeywordsSchema = z.array(z.string().trim().min(1)).default([]);

const baseStudyDestinationBodySchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters long.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters long.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens.'),
  country: z.string().trim().min(2, 'Country must be at least 2 characters long.'),
  shortDescription: nullableTrimmedString,
  featuredImage: nullableAssetUrlString,
  content: jsonContentSchema,
  isFeatured: z.boolean(),
  showInMenu: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  status: allowedStatusSchema,
  seoTitle: nullableTrimmedString,
  seoDescription: nullableTrimmedString,
  seoKeywords: seoKeywordsSchema,
  ogImage: nullableAssetUrlString,
  canonicalUrl: nullableAbsoluteUrlString,
});

export const createStudyDestinationSchema = z.object({
  body: baseStudyDestinationBodySchema,
});

export const updateStudyDestinationSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: baseStudyDestinationBodySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one study destination field is required.',
    }),
});

export const studyDestinationIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const studyDestinationSlugParamSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .trim()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
});
