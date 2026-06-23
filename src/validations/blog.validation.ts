import { PublicationStatus } from '@prisma/client';
import { z } from 'zod';

const nullableTrimmedString = z.string().trim().optional();
const nullableUrlString = z.union([z.string().trim().url(), z.literal('')]).optional();
const nullableJsonSchema = z
  .record(z.string(), z.unknown())
  .or(z.array(z.unknown()))
  .or(z.null())
  .optional();

const seoKeywordsSchema = z.array(z.string().trim().min(1)).default([]);

const allowedStatusSchema = z.enum([
  PublicationStatus.DRAFT,
  PublicationStatus.PUBLISHED,
]);

const baseBlogBodySchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters long.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters long.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens.'),
  excerpt: nullableTrimmedString,
  featuredImage: nullableUrlString,
  content: nullableJsonSchema,
  category: nullableTrimmedString,
  author: nullableTrimmedString,
  isPinned: z.boolean(),
  status: allowedStatusSchema,
  seoTitle: nullableTrimmedString,
  seoDescription: nullableTrimmedString,
  seoKeywords: seoKeywordsSchema,
  ogImage: nullableUrlString,
  canonicalUrl: nullableUrlString,
});

export const createBlogSchema = z.object({
  body: baseBlogBodySchema,
});

export const updateBlogSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: baseBlogBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one blog field is required.',
  }),
});

export const blogIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const blogSlugParamSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .trim()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
});

export const listBlogsQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
});
