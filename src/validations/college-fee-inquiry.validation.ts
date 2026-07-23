import { z } from 'zod';

import {
  isValidPublicPhoneNumber,
  normalizeOptionalPublicEmailAddress,
  normalizePublicPhoneNumber,
} from '../utils/public-form-validation';
import { normalizeOptionalQueryString, paginationQueryFields } from './pagination.validation';

const normalizeOptionalString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  });

const createPhoneNumberSchema = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine(isValidPublicPhoneNumber, message)
    .transform(normalizePublicPhoneNumber);

const emailAddressSchema = z.string().trim().email('Please enter a valid email address.');

const normalizeOptionalEmail = z
  .union([z.string(), z.literal(''), z.null()])
  .optional()
  .transform((value, context) => {
    const normalizedValue = normalizeOptionalPublicEmailAddress(value);

    if (!normalizedValue) {
      return undefined;
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

const normalizeOptionalUuid = z
  .union([z.string().uuid(), z.literal(''), z.null()])
  .optional()
  .transform((value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined));

const baseCollegeFeeInquiryBodySchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long.'),
  phoneNumber: createPhoneNumberSchema('Please enter a valid phone number.'),
  emailAddress: normalizeOptionalEmail,
  country: normalizeOptionalString,
  preferredStudyDestination: normalizeOptionalString,
  interestedCollegeId: normalizeOptionalUuid,
  interestedCollegeName: z
    .string()
    .trim()
    .min(2, 'Interested college must be at least 2 characters long.'),
  message: normalizeOptionalString,
  source: normalizeOptionalString,
  sourcePage: normalizeOptionalString,
});

export const createCollegeFeeInquirySchema = z.object({
  body: baseCollegeFeeInquiryBodySchema.extend({
    website: normalizeOptionalString,
  }),
});

export const listCollegeFeeInquiryQuerySchema = z.object({
  query: z.object({
    search: normalizeOptionalQueryString,
    ...paginationQueryFields,
    status: z
      .preprocess((value) => {
        if (Array.isArray(value)) {
          return typeof value[0] === 'string' ? value[0] : undefined;
        }

        return typeof value === 'string' ? value : undefined;
      }, z.enum(['all', 'read', 'unread']).optional())
      .transform((value) => value ?? 'all'),
  }),
});

export const updateCollegeFeeInquirySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: baseCollegeFeeInquiryBodySchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one inquiry field is required.',
    }),
});

export const collegeFeeInquiryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
