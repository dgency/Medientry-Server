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

const phoneNumberSchema = z
  .string()
  .trim()
  .min(7, 'Phone number must be at least 7 characters long.')
  .max(25, 'Phone number must be at most 25 characters long.')
  .refine(
    (value) => /^[+]?[\d\s\-()]+$/.test(value) && value.replace(/\D/g, '').length >= 7,
    'Phone number must be a valid international phone number.',
  );

const baseConsultationLeadBodySchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long.'),
  userRole: z.string().trim().min(2, 'Role must be at least 2 characters long.'),
  whatsappNumber: phoneNumberSchema,
  phoneNumber: phoneNumberSchema,
  emailAddress: normalizeOptionalEmail,
  passingYear: z.string().trim().min(4, 'Passing year is required.'),
  neetScore: normalizeOptionalString,
  stateName: z.string().trim().min(2, 'State name must be at least 2 characters long.'),
  preferredCollege: normalizeOptionalString,
  message: normalizeOptionalString,
  sourcePage: normalizeOptionalString,
  submissionDate: z.coerce.date().optional(),
});

export const createConsultationLeadSchema = z.object({
  body: baseConsultationLeadBodySchema.extend({
    website: normalizeOptionalString,
  }),
});

export const consultationLeadIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
