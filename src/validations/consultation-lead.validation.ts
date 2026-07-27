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

const createPhoneNumberSchema = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine(isValidPublicPhoneNumber, message)
    .transform(normalizePublicPhoneNumber);

const baseConsultationLeadBodySchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long.'),
  userRole: z.string().trim().min(2, 'Role must be at least 2 characters long.'),
  whatsappNumber: createPhoneNumberSchema('Please enter a valid WhatsApp number.'),
  phoneNumber: createPhoneNumberSchema('Please enter a valid phone number.'),
  emailAddress: normalizeOptionalEmail,
  passingYear: z.string().trim().min(4, 'Passing year is required.'),
  neetScore: normalizeOptionalString,
  stateName: z.string().trim().min(2, 'State name must be at least 2 characters long.'),
  preferredCollege: normalizeOptionalString,
  message: normalizeOptionalString,
  sourcePage: normalizeOptionalString,
  submissionDate: z.coerce.date().optional(),
  submissionSource: z.enum(['consultation', 'contact']).optional(),
  formVariant: z.enum(['default', 'mbbs-georgia']).optional(),
});

export const createConsultationLeadSchema = z.object({
  body: baseConsultationLeadBodySchema.extend({
    website: normalizeOptionalString,
  }),
});

export const verifyThankYouTokenSchema = z.object({
  body: z.object({
    token: z.string().trim().min(1, 'Token is required.'),
  }),
});

export const listConsultationLeadQuerySchema = z.object({
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

export const consultationLeadIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
