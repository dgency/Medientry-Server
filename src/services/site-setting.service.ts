import {
  GoogleTagManagerEnvironment,
  GoogleTagManagerMode,
  Prisma,
} from '@prisma/client';

import { prisma } from '../config/prisma';
import {
  normalizeGtmCode,
  normalizeGtmEnvironment,
  normalizeGtmId,
  normalizeGtmMode,
} from '../utils/google-tag-manager';
import { resolvePublicMediaUrl } from '../utils/media-path';

export type SiteSettingApiShape = {
  logoLight: string | null;
  logoDark: string | null;
  favicon: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  textColor: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  exchangeRateUsdToInr: number | null;
  showExchangeRateNote: boolean;
  customExchangeRateNote: string | null;
  exchangeRateUpdatedAt: string | null;
  googleTagManagerEnabled: boolean;
  googleTagManagerMode: 'container-id' | 'custom-code';
  googleTagManagerId: string | null;
  googleTagManagerHeadCode: string | null;
  googleTagManagerBodyCode: string | null;
  googleTagManagerEnvironment: 'production' | 'all';
};

type UpdateSiteSettingInput = Partial<SiteSettingApiShape>;

type SocialLinksShape = {
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
};

const normalizeNullableString = (value?: string | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const normalizeNullableSocialLink = (value?: string | null) => {
  const normalizedValue = normalizeNullableString(value);

  if (normalizedValue === undefined || normalizedValue === '#') {
    return null;
  }

  return normalizedValue;
};

const resolveUpdatedValue = (
  nextValue: string | null | undefined,
  currentValue: string | null | undefined,
) => {
  if (nextValue === undefined) {
    return currentValue ?? null;
  }

  return nextValue;
};

const resolveUpdatedBoolean = (
  nextValue: boolean | undefined,
  currentValue: boolean | undefined,
) => {
  if (nextValue === undefined) {
    return currentValue ?? false;
  }

  return nextValue;
};

const decimalToNumber = (value: Prisma.Decimal | null | undefined) => {
  if (!value) {
    return null;
  }

  return Number(value.toString());
};

const getSiteSettingRecord = async () => {
  const existing = await prisma.siteSetting.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.siteSetting.create({
    data: {},
  });
};

export const getDefaultSiteSetting = (): SiteSettingApiShape => ({
  logoLight: null,
  logoDark: null,
  favicon: null,
  primaryColor: null,
  secondaryColor: null,
  accentColor: null,
  textColor: null,
  phone: null,
  email: null,
  address: null,
  facebook: null,
  instagram: null,
  linkedin: null,
  youtube: null,
  exchangeRateUsdToInr: null,
  showExchangeRateNote: false,
  customExchangeRateNote: null,
  exchangeRateUpdatedAt: null,
  googleTagManagerEnabled: false,
  googleTagManagerMode: 'container-id',
  googleTagManagerId: null,
  googleTagManagerHeadCode: null,
  googleTagManagerBodyCode: null,
  googleTagManagerEnvironment: 'production',
});

const mapSiteSettingToApi = (siteSetting: {
  logoLight: string | null;
  logoDark: string | null;
  favicon: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  textColor: string | null;
  phone: string | null;
  contactEmail: string | null;
  address: string | null;
  socialLinks: unknown;
  exchangeRateUsdToInr: Prisma.Decimal | null;
  showExchangeRateNote: boolean;
  customExchangeRateNote: string | null;
  exchangeRateUpdatedAt: Date | null;
  googleTagManagerEnabled: boolean;
  googleTagManagerMode: GoogleTagManagerMode;
  googleTagManagerId: string | null;
  googleTagManagerHeadCode: string | null;
  googleTagManagerBodyCode: string | null;
  googleTagManagerEnvironment: GoogleTagManagerEnvironment;
} | null): SiteSettingApiShape => {
  const socialLinks =
    typeof siteSetting?.socialLinks === 'object' && siteSetting.socialLinks !== null
      ? (siteSetting.socialLinks as SocialLinksShape)
      : {};

  return {
    ...getDefaultSiteSetting(),
    logoLight: resolvePublicMediaUrl(siteSetting?.logoLight) ?? null,
    logoDark: resolvePublicMediaUrl(siteSetting?.logoDark) ?? null,
    favicon: resolvePublicMediaUrl(siteSetting?.favicon) ?? null,
    primaryColor: siteSetting?.primaryColor ?? null,
    secondaryColor: siteSetting?.secondaryColor ?? null,
    accentColor: siteSetting?.accentColor ?? null,
    textColor: siteSetting?.textColor ?? null,
    phone: siteSetting?.phone ?? null,
    email: siteSetting?.contactEmail ?? null,
    address: siteSetting?.address ?? null,
    facebook: normalizeNullableSocialLink(socialLinks.facebook),
    instagram: normalizeNullableSocialLink(socialLinks.instagram),
    linkedin: normalizeNullableSocialLink(socialLinks.linkedin),
    youtube: normalizeNullableSocialLink(socialLinks.youtube),
    exchangeRateUsdToInr: decimalToNumber(siteSetting?.exchangeRateUsdToInr),
    showExchangeRateNote: siteSetting?.showExchangeRateNote ?? false,
    customExchangeRateNote: normalizeNullableString(siteSetting?.customExchangeRateNote) ?? null,
    exchangeRateUpdatedAt: siteSetting?.exchangeRateUpdatedAt?.toISOString() ?? null,
    googleTagManagerEnabled: siteSetting?.googleTagManagerEnabled ?? false,
    googleTagManagerMode:
      siteSetting?.googleTagManagerMode === GoogleTagManagerMode.CUSTOM_CODE
        ? 'custom-code'
        : 'container-id',
    googleTagManagerId: normalizeGtmId(siteSetting?.googleTagManagerId) ?? null,
    googleTagManagerHeadCode: siteSetting?.googleTagManagerHeadCode ?? null,
    googleTagManagerBodyCode: siteSetting?.googleTagManagerBodyCode ?? null,
    googleTagManagerEnvironment:
      siteSetting?.googleTagManagerEnvironment === GoogleTagManagerEnvironment.ALL
        ? 'all'
        : 'production',
  };
};

export const getSiteSetting = async () => {
  const siteSetting = await getSiteSettingRecord();

  return mapSiteSettingToApi(siteSetting);
};

export const updateSiteSetting = async (input: UpdateSiteSettingInput) => {
  const existing = await getSiteSettingRecord();
  const socialLinks = existing.socialLinks as SocialLinksShape | null;
  const normalizedEmail = normalizeNullableString(input.email);
  const normalizedExchangeRate = input.exchangeRateUsdToInr;
  const normalizedCustomExchangeRateNote = normalizeNullableString(
    input.customExchangeRateNote,
  );
  const normalizedGoogleTagManagerId = normalizeGtmId(input.googleTagManagerId);
  const normalizedGoogleTagManagerHeadCode = normalizeGtmCode(
    input.googleTagManagerHeadCode,
  );
  const normalizedGoogleTagManagerBodyCode = normalizeGtmCode(
    input.googleTagManagerBodyCode,
  );
  const nextExchangeRateUsdToInr =
    normalizedExchangeRate === undefined
      ? decimalToNumber(existing.exchangeRateUsdToInr)
      : normalizedExchangeRate;
  const nextShowExchangeRateNote = resolveUpdatedBoolean(
    input.showExchangeRateNote,
    existing.showExchangeRateNote,
  );
  const nextCustomExchangeRateNote = resolveUpdatedValue(
    normalizedCustomExchangeRateNote,
    existing.customExchangeRateNote,
  );
  const exchangeRateSettingsChanged =
    normalizedExchangeRate !== undefined
    || input.showExchangeRateNote !== undefined
    || normalizedCustomExchangeRateNote !== undefined
      ? nextExchangeRateUsdToInr !== decimalToNumber(existing.exchangeRateUsdToInr)
        || nextShowExchangeRateNote !== existing.showExchangeRateNote
        || nextCustomExchangeRateNote !== (existing.customExchangeRateNote ?? null)
      : false;

  const nextSocialLinks: SocialLinksShape = {
    facebook: resolveUpdatedValue(
      normalizeNullableSocialLink(input.facebook),
      socialLinks?.facebook,
    ),
    instagram: resolveUpdatedValue(
      normalizeNullableSocialLink(input.instagram),
      socialLinks?.instagram,
    ),
    linkedin: resolveUpdatedValue(
      normalizeNullableSocialLink(input.linkedin),
      socialLinks?.linkedin,
    ),
    youtube: resolveUpdatedValue(
      normalizeNullableSocialLink(input.youtube),
      socialLinks?.youtube,
    ),
  };

  const data = {
    logoLight: normalizeNullableString(input.logoLight),
    logoDark: normalizeNullableString(input.logoDark),
    favicon: normalizeNullableString(input.favicon),
    primaryColor: normalizeNullableString(input.primaryColor),
    secondaryColor: normalizeNullableString(input.secondaryColor),
    accentColor: normalizeNullableString(input.accentColor),
    textColor: normalizeNullableString(input.textColor),
    phone: normalizeNullableString(input.phone),
    contactEmail:
      normalizedEmail === undefined
        ? undefined
        : normalizedEmail === null
          ? null
          : normalizedEmail.toLowerCase(),
    address: normalizeNullableString(input.address),
    socialLinks: nextSocialLinks,
    exchangeRateUsdToInr:
      normalizedExchangeRate === undefined
        ? undefined
        : normalizedExchangeRate,
    showExchangeRateNote:
      input.showExchangeRateNote === undefined
        ? undefined
        : nextShowExchangeRateNote,
    customExchangeRateNote: normalizedCustomExchangeRateNote,
    exchangeRateUpdatedAt: exchangeRateSettingsChanged
      ? new Date()
      : undefined,
    googleTagManagerEnabled:
      input.googleTagManagerEnabled === undefined
        ? undefined
        : input.googleTagManagerEnabled === true,
    googleTagManagerMode:
      input.googleTagManagerMode === undefined
        ? undefined
        : normalizeGtmMode(input.googleTagManagerMode) === 'custom-code'
          ? GoogleTagManagerMode.CUSTOM_CODE
          : GoogleTagManagerMode.CONTAINER_ID,
    googleTagManagerId:
      input.googleTagManagerId === undefined
        ? undefined
        : normalizedGoogleTagManagerId,
    googleTagManagerHeadCode: normalizedGoogleTagManagerHeadCode,
    googleTagManagerBodyCode: normalizedGoogleTagManagerBodyCode,
    googleTagManagerEnvironment:
      input.googleTagManagerEnvironment === undefined
        ? undefined
        : normalizeGtmEnvironment(input.googleTagManagerEnvironment) === 'all'
          ? GoogleTagManagerEnvironment.ALL
          : GoogleTagManagerEnvironment.PRODUCTION,
  };

  const siteSetting = await prisma.siteSetting.update({
    where: { id: existing.id },
    data,
  });

  return mapSiteSettingToApi(siteSetting);
};
