import { z } from 'zod';

import { HOME_SECTION_KEYS } from '../utils/home-section';

const nullableTrimmedString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== 'string') {
      return value ?? undefined;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
const nullableLinkString = z
  .union([z.string(), z.null()])
  .optional()
  .refine(
    (value) =>
      value == null
      || value === ''
      || /^https?:\/\//i.test(value)
      || value.startsWith('/')
      || value.startsWith('uploads/'),
    'Must be a valid absolute URL or relative path.',
  )
  .transform((value) => {
    if (typeof value !== 'string') {
      return value ?? undefined;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
const homeSectionContentSchema = z
  .object({
    primaryButtonText: nullableTrimmedString,
    primaryButtonUrl: nullableLinkString,
    secondaryButtonText: nullableTrimmedString,
    secondaryButtonUrl: nullableLinkString,
    backgroundImage: nullableLinkString,
  })
  .optional();

export const homeSectionKeyParamSchema = z.object({
  params: z.object({
    sectionKey: z.enum(HOME_SECTION_KEYS),
  }),
});

export const updateHomeSectionSchema = z.object({
  params: z.object({
    sectionKey: z.enum(HOME_SECTION_KEYS),
  }),
  body: z
    .object({
      eyebrow: nullableTrimmedString,
      title: nullableTrimmedString,
      subtitle: nullableTrimmedString,
      content: homeSectionContentSchema,
      selectedItemIds: z.array(z.string().uuid()).max(50).optional(),
      itemLimit: z.union([z.coerce.number().int().min(1), z.null()]).optional(),
      isEnabled: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one home section field is required.',
    }),
});
