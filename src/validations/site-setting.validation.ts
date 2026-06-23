import { z } from 'zod';

const isRelativeAssetPath = (value: string) => /^\/[^\s]*$/.test(value);
const isCssColor = (value: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value)
  || /^hsl(a)?\([^)]*\)$/i.test(value)
  || /^rgb(a)?\([^)]*\)$/i.test(value);

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
const nullableUrlString = z
  .union([z.string().trim().url(), z.literal('#'), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === '#') {
      return null;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    return value.trim() === '' ? null : value.trim();
  });
const nullableAssetUrlString = z
  .union([
    z.string().trim().url(),
    z.string().trim().refine(isRelativeAssetPath, {
      message: 'Must be a valid absolute URL or a root-relative asset path.',
    }),
    z.literal(''),
    z.null(),
  ])
  .optional();
const nullableColorString = z
  .union([
    z
      .string()
      .trim()
      .refine(isCssColor, 'Color must be a valid CSS color value.'),
    z.literal(''),
    z.null(),
  ])
  .optional();
const nullableEmailString = z
  .union([z.string().trim().email(), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    return value.trim() === '' ? null : value.trim().toLowerCase();
  });

const siteSettingBodySchema = z.preprocess(
  (input) => {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return input;
    }

    const value = input as Record<string, unknown>;

    return {
      ...value,
      email: value.email ?? value.contactEmail,
      facebook: value.facebook ?? value.facebookUrl,
      instagram: value.instagram ?? value.instagramUrl,
      linkedin: value.linkedin ?? value.linkedinUrl,
      youtube: value.youtube ?? value.youtubeUrl,
    };
  },
  z
    .object({
      logoLight: nullableAssetUrlString,
      logoDark: nullableAssetUrlString,
      favicon: nullableAssetUrlString,
      primaryColor: nullableColorString,
      secondaryColor: nullableColorString,
      accentColor: nullableColorString,
      textColor: nullableColorString,
      phone: nullableTrimmedString,
      email: nullableEmailString,
      address: nullableTrimmedString,
      facebook: nullableUrlString,
      instagram: nullableUrlString,
      linkedin: nullableUrlString,
      youtube: nullableUrlString,
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one site setting field is required.',
    }),
);

export const updateSiteSettingSchema = z.object({
  body: siteSettingBodySchema,
});
