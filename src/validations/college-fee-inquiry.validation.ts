import { z } from 'zod';

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

const phoneNumberSchema = z
  .string()
  .trim()
  .min(7, 'Phone number must be at least 7 characters long.')
  .max(25, 'Phone number must be at most 25 characters long.')
  .refine(
    (value) => /^[+]?[\d\s\-()]+$/.test(value) && value.replace(/\D/g, '').length >= 7,
    'Phone number must be a valid international phone number.',
  );

const normalizeOptionalEmail = z
  .union([z.string().trim().email(), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim().toLowerCase();
    return trimmed ? trimmed : undefined;
  });

const normalizeOptionalUuid = z
  .union([z.string().uuid(), z.literal(''), z.null()])
  .optional()
  .transform((value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined));

const baseCollegeFeeInquiryBodySchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long.'),
  phoneNumber: phoneNumberSchema,
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
