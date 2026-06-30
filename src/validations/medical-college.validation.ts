import { PublicationStatus } from '@prisma/client';
import { z } from 'zod';

import { nullableAbsoluteUrlString, nullableAssetUrlString } from './asset-url.validation';

const nullableTrimmedString = z.string().trim().nullable().optional();
const nullableUuidString = z.union([z.string().uuid(), z.literal('')]).optional();
const nullableJsonSchema = z
  .record(z.string(), z.unknown())
  .or(z.array(z.unknown()))
  .or(z.null())
  .optional();

const nullableDecimalSchema = z
  .union([z.coerce.number().nonnegative(), z.literal(''), z.null()])
  .transform((value) => {
    if (value === '' || value === null) {
      return null;
    }

    return value;
  })
  .optional();

const seoKeywordsSchema = z.array(z.string().trim().min(1)).default([]);

const allowedStatusSchema = z.enum([
  PublicationStatus.DRAFT,
  PublicationStatus.PUBLISHED,
]);

const baseMedicalCollegeBodySchema = z.object({
  studyDestinationId: nullableUuidString.transform((value) => (value === '' ? null : value)),
  name: z.string().trim().min(2, 'Name must be at least 2 characters long.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters long.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens.'),
  country: z.string().trim().min(2, 'Country must be at least 2 characters long.'),
  city: nullableTrimmedString,
  image: nullableAssetUrlString,
  shortDescription: nullableTrimmedString,
  tuitionFee: nullableDecimalSchema,
  hostelFee: nullableDecimalSchema,
  totalFee: nullableDecimalSchema,
  ranking: nullableTrimmedString,
  eligibility: nullableTrimmedString,
  admissionProcess: nullableJsonSchema,
  facilities: nullableJsonSchema,
  gallery: nullableJsonSchema,
  contentBlocks: nullableJsonSchema,
  sortOrder: z.coerce.number().int().min(0),
  seoTitle: nullableTrimmedString,
  seoDescription: nullableTrimmedString,
  seoKeywords: seoKeywordsSchema,
  ogImage: nullableAssetUrlString,
  canonicalUrl: nullableAbsoluteUrlString,
  isFeatured: z.boolean(),
  status: allowedStatusSchema,
});

export const createMedicalCollegeSchema = z.object({
  body: baseMedicalCollegeBodySchema,
});

export const updateMedicalCollegeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: baseMedicalCollegeBodySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one medical college field is required.',
    }),
});

export const medicalCollegeIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const medicalCollegeSlugParamSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .trim()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
});
