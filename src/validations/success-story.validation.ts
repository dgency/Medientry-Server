import { SimpleStatus } from '@prisma/client';
import { z } from 'zod';

const nullableTrimmedString = z.string().trim().optional();
const nullableUrlString = z.union([z.string().trim().url(), z.literal('')]).optional();

const baseSuccessStoryBodySchema = z.object({
  studentName: z.string().trim().min(2, 'Student name must be at least 2 characters long.'),
  roleType: z.string().trim().min(2, 'Role or type must be at least 2 characters long.'),
  country: nullableTrimmedString,
  city: nullableTrimmedString,
  university: z.string().trim().min(2, 'College name must be at least 2 characters long.'),
  batch: nullableTrimmedString,
  image: nullableUrlString,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  reviewText: z.string().trim().min(10, 'Short testimonial must be at least 10 characters long.'),
  fullStory: nullableTrimmedString,
  videoUrl: nullableUrlString,
  showOnHomepage: z.boolean(),
  status: z.nativeEnum(SimpleStatus),
  sortOrder: z.coerce.number().int().min(0),
});

export const createSuccessStorySchema = z.object({
  body: baseSuccessStoryBodySchema,
});

export const updateSuccessStorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: baseSuccessStoryBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one success story field is required.',
  }),
});

export const successStoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
