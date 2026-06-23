import { PageTemplateType, PageType, PublicationStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

const nullableTrimmedString = z.string().trim().optional();
const nullableUrlString = z.union([z.string().trim().url(), z.literal('')]).optional();

const allowedPageStatus = z.enum([
  PublicationStatus.DRAFT,
  PublicationStatus.PUBLISHED,
]);

const jsonContentSchema = z
  .record(z.string(), z.unknown())
  .or(z.array(z.unknown()))
  .optional();

const seoKeywordsSchema = z.array(z.string().trim().min(1)).default([]);

const basePageBodySchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters long.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters long.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens.'),
  pageType: z.nativeEnum(PageType).optional(),
  templateType: z.nativeEnum(PageTemplateType),
  status: allowedPageStatus,
  heroTitle: nullableTrimmedString,
  heroSubtitle: nullableTrimmedString,
  heroImage: nullableUrlString,
  content: jsonContentSchema,
  seoTitle: nullableTrimmedString,
  seoDescription: nullableTrimmedString,
  seoKeywords: seoKeywordsSchema,
  ogImage: nullableUrlString,
  canonicalUrl: nullableUrlString,
});

export const createPageSchema = z.object({
  body: basePageBodySchema,
});

export const updatePageSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: basePageBodySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one page field is required.',
    }),
});

export const pageIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const pageSlugParamSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .trim()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
});
