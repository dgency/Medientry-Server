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
const nullablePositiveFiniteNumber = z
  .union([z.coerce.number(), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === '' || value === null) {
      return null;
    }

    return value;
  })
  .refine(
    (value) =>
      value === undefined
      || value === null
      || (Number.isFinite(value) && value > 0),
    {
      message: 'Exchange rate must be a positive number.',
    },
  );
const normalizedBoolean = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return value === 'true';
  });
const nullableCustomExchangeRateNote = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== 'string') {
      return value ?? undefined;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  .refine(
    (value) => value === undefined || value === null || value.length <= 1000,
    {
      message: 'Custom fee note must be 1000 characters or fewer.',
    },
  );

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
      exchangeRateUsdToInr: nullablePositiveFiniteNumber,
      showExchangeRateNote: normalizedBoolean,
      customExchangeRateNote: nullableCustomExchangeRateNote,
    })
    .refine(
      (value) =>
        value.showExchangeRateNote !== true
        || (typeof value.exchangeRateUsdToInr === 'number'
          && value.exchangeRateUsdToInr > 0),
      {
        path: ['exchangeRateUsdToInr'],
        message: 'Add a valid USD-to-INR exchange rate to enable the exchange-rate note.',
      },
    )
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one site setting field is required.',
    }),
);

export const updateSiteSettingSchema = z.object({
  body: siteSettingBodySchema,
});
