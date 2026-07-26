import { SimpleStatus } from '@prisma/client';
import { z } from 'zod';

import { nullableAssetUrlString, nullableAbsoluteUrlString } from './asset-url.validation';
import {
  isValidPublicPhoneNumber,
  normalizeOptionalPublicEmailAddress,
  normalizePublicPhoneNumber,
} from '../utils/public-form-validation';

const nullableTrimmedString = z.string().trim().nullable().optional();
const emailAddressSchema = z.string().trim().email('Please enter a valid email address.');

const normalizeOptionalString = z
  .union([z.string(), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  });

const normalizeRequiredEmail = z
  .string()
  .trim()
  .min(1, 'Email address is required.')
  .transform((value, context) => {
    const normalizedValue = normalizeOptionalPublicEmailAddress(value);

    if (!normalizedValue) {
      context.addIssue({
        code: 'custom',
        message: 'Email address is required.',
      });
      return z.NEVER;
    }

    const parsedEmail = emailAddressSchema.safeParse(normalizedValue);

    if (!parsedEmail.success) {
      context.addIssue({
        code: 'custom',
        message: 'Please enter a valid email address.',
      });
      return z.NEVER;
    }

    return parsedEmail.data;
  });

const normalizeOptionalPhone = z
  .union([z.string(), z.literal(''), z.null()])
  .optional()
  .transform((value, context) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return undefined;
    }

    if (!isValidPublicPhoneNumber(trimmed)) {
      context.addIssue({
        code: 'custom',
        message: 'Please enter a valid phone number.',
      });
      return z.NEVER;
    }

    return normalizePublicPhoneNumber(trimmed);
  });

const normalizeOptionalAbsoluteUrl = z
  .union([z.string(), z.literal(''), z.null()])
  .optional()
  .transform((value, context) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return undefined;
    }

    const parsedUrl = z.string().trim().url('Please enter a valid public image URL.').safeParse(trimmed);

    if (!parsedUrl.success) {
      context.addIssue({
        code: 'custom',
        message: 'Please enter a valid public image URL.',
      });
      return z.NEVER;
    }

    if (!['http:', 'https:'].includes(new URL(parsedUrl.data).protocol)) {
      context.addIssue({
        code: 'custom',
        message: 'Please enter a valid public image URL.',
      });
      return z.NEVER;
    }

    return parsedUrl.data;
  });

const baseSuccessStoryBodySchema = z.object({
  studentName: z.string().trim().min(2, 'Student name must be at least 2 characters long.'),
  roleType: z.string().trim().min(2, 'Role or type must be at least 2 characters long.'),
  country: nullableTrimmedString,
  city: nullableTrimmedString,
  university: z.string().trim().min(2, 'College name must be at least 2 characters long.'),
  batch: nullableTrimmedString,
  image: nullableAssetUrlString,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  reviewText: z.string().trim().min(10, 'Short testimonial must be at least 10 characters long.'),
  fullStory: nullableTrimmedString,
  videoUrl: nullableAbsoluteUrlString,
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

const shareSuccessStoryBodySchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters long.'),
  roleType: z.string().trim().min(2, 'Role / type must be at least 2 characters long.'),
  emailAddress: normalizeRequiredEmail,
  phoneNumber: normalizeOptionalPhone,
  university: z.string().trim().min(2, 'College name must be at least 2 characters long.'),
  batch: normalizeOptionalString,
  country: normalizeOptionalString,
  city: normalizeOptionalString,
  shareStory: z.string().trim().min(10, 'Share story must be at least 10 characters long.'),
  sourcePage: normalizeOptionalAbsoluteUrl,
  submissionDate: z.coerce.date().optional(),
  website: normalizeOptionalString,
});

export const shareSuccessStorySchema = z.object({
  body: shareSuccessStoryBodySchema,
});
