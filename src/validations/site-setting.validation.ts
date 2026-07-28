import { z } from 'zod';
import { normalizeGtmId, validateGtmId } from '../utils/google-tag-manager';

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
const nullableExchangeRateSchema = z
  .union([z.coerce.number(), z.literal(''), z.null()])
  .transform((value, ctx) => {
    if (value === '' || value === null) {
      return null;
    }

    if (!Number.isFinite(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Exchange rate must be a finite number.',
      });
      return z.NEVER;
    }

    if (value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Exchange rate must be greater than 0.',
      });
      return z.NEVER;
    }

    return value;
  })
  .optional();
const nullableExchangeRateNoteString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== 'string') {
      return value ?? undefined;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  .refine((value) => value === undefined || value === null || value.length <= 1000, {
    message: 'Custom exchange-rate note must be 1000 characters or fewer.',
  });
const booleanLikeSchema = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value === true || value === 'true';
  });
const nullableGtmIdString = z
  .union([z.string(), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    const normalizedValue = normalizeGtmId(value);
    return normalizedValue ?? null;
  })
  .refine((value) => value === undefined || value === null || value.length <= 64, {
    message: 'GTM Container ID must be 64 characters or fewer.',
  })
  .refine((value) => value === undefined || value === null || validateGtmId(value), {
    message: 'GTM Container ID must look like GTM-ABC1234.',
  });
const nullableGtmCodeString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    return value.trim().length > 0 ? value.replace(/\r\n?/g, '\n') : null;
  })
  .refine((value) => value === undefined || value === null || value.length <= 20000, {
    message: 'GTM code must be 20000 characters or fewer.',
  });
const gtmModeSchema = z.enum(['container-id', 'custom-code']).optional();
const gtmEnvironmentSchema = z.enum(['production', 'all']).optional();
const normalizeRedirectPathValue = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '') || '/';
    return `${normalizedPath}${parsedUrl.search}`;
  } catch {
    if (!trimmedValue.startsWith('/')) {
      return null;
    }

    const [pathPart = '/', searchPart] = trimmedValue.split('?');
    const normalizedPath = pathPart.replace(/\/+$/, '') || '/';
    return searchPart ? `${normalizedPath}?${searchPart}` : normalizedPath;
  }
};
const normalizeRedirectDestinationValue = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
    return parsedUrl.toString();
  } catch {
    if (!trimmedValue.startsWith('/')) {
      return null;
    }

    const [pathPart = '/', searchPart] = trimmedValue.split('?');
    const normalizedPath = pathPart.replace(/\/+$/, '') || '/';
    return searchPart ? `${normalizedPath}?${searchPart}` : normalizedPath;
  }
};
const redirectRuleSchema = z
  .object({
    sourcePath: z.string().trim(),
    destination: z.string().trim(),
    permanent: booleanLikeSchema,
  })
  .transform((value, ctx) => {
    const normalizedSourcePath = normalizeRedirectPathValue(value.sourcePath);
    const normalizedDestination = normalizeRedirectDestinationValue(
      value.destination,
    );

    if (!normalizedSourcePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourcePath'],
        message: 'Source must be a root-relative path or full URL.',
      });
    }

    if (!normalizedDestination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination'],
        message: 'Destination must be a root-relative path or full URL.',
      });
    }

    if (
      normalizedSourcePath &&
      normalizedDestination &&
      normalizedSourcePath === normalizedDestination
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination'],
        message: 'Source and destination cannot be the same.',
      });
    }

    if (!normalizedSourcePath || !normalizedDestination) {
      return z.NEVER;
    }

    return {
      sourcePath: normalizedSourcePath,
      destination: normalizedDestination,
      permanent: value.permanent !== false,
    };
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
      customExchangeRateNote:
        value.customExchangeRateNote ?? value.feeNote,
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
      exchangeRateUsdToInr: nullableExchangeRateSchema,
      showExchangeRateNote: booleanLikeSchema,
      customExchangeRateNote: nullableExchangeRateNoteString,
      googleTagManagerEnabled: booleanLikeSchema,
      googleTagManagerMode: gtmModeSchema,
      googleTagManagerId: nullableGtmIdString,
      googleTagManagerHeadCode: nullableGtmCodeString,
      googleTagManagerBodyCode: nullableGtmCodeString,
      googleTagManagerEnvironment: gtmEnvironmentSchema,
      redirectRules: z.array(redirectRuleSchema).optional(),
    })
    .superRefine((value, ctx) => {
      const enabled = value.googleTagManagerEnabled === true;
      const mode = value.googleTagManagerMode ?? 'container-id';

      if (!enabled) {
        return;
      }

      if (mode === 'container-id' && !value.googleTagManagerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['googleTagManagerId'],
          message: 'A valid GTM Container ID is required when GTM is enabled in Container ID mode.',
        });
      }

      if (mode === 'custom-code' && !value.googleTagManagerHeadCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['googleTagManagerHeadCode'],
          message: 'Head code is required when GTM is enabled in Custom Code mode.',
        });
      }
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one site setting field is required.',
    }),
);

export const updateSiteSettingSchema = z.object({
  body: siteSettingBodySchema,
});
