import { prisma } from '../config/prisma';
import {
  type ExchangeRateSettings,
  getDefaultExchangeRateSettings,
} from '../utils/exchange-rate';

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
};

type UpdateSiteSettingInput = Partial<SiteSettingApiShape>;

type SocialLinksShape = {
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
};

type SiteSettingRecord = {
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
  exchangeRateUsdToInr: { toString(): string } | null;
  showExchangeRateNote: boolean;
  customExchangeRateNote: string | null;
  exchangeRateUpdatedAt: Date | null;
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

const resolveOptionalValue = <T>(nextValue: T | undefined, currentValue: T) =>
  nextValue === undefined ? currentValue : nextValue;

const decimalToNumber = (value: { toString(): string } | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
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
  ...getDefaultExchangeRateSettings(),
});

const mapSiteSettingToApi = (siteSetting: SiteSettingRecord | null): SiteSettingApiShape => {
  const socialLinks =
    typeof siteSetting?.socialLinks === 'object' && siteSetting.socialLinks !== null
      ? (siteSetting.socialLinks as SocialLinksShape)
      : {};

  return {
    ...getDefaultSiteSetting(),
    logoLight: siteSetting?.logoLight ?? null,
    logoDark: siteSetting?.logoDark ?? null,
    favicon: siteSetting?.favicon ?? null,
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
    customExchangeRateNote: siteSetting?.customExchangeRateNote ?? null,
    exchangeRateUpdatedAt: siteSetting?.exchangeRateUpdatedAt?.toISOString() ?? null,
  };
};

const mapSiteSettingToExchangeRateSettings = (
  siteSetting: Pick<
    SiteSettingRecord,
    | 'exchangeRateUsdToInr'
    | 'showExchangeRateNote'
    | 'customExchangeRateNote'
    | 'exchangeRateUpdatedAt'
  > | null,
): ExchangeRateSettings => ({
  ...getDefaultExchangeRateSettings(),
  exchangeRateUsdToInr: decimalToNumber(siteSetting?.exchangeRateUsdToInr),
  showExchangeRateNote: siteSetting?.showExchangeRateNote ?? false,
  customExchangeRateNote: siteSetting?.customExchangeRateNote ?? null,
  exchangeRateUpdatedAt: siteSetting?.exchangeRateUpdatedAt?.toISOString() ?? null,
});

export const getSiteExchangeRateSettings = async (): Promise<ExchangeRateSettings> => {
  const siteSetting = await prisma.siteSetting.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      exchangeRateUsdToInr: true,
      showExchangeRateNote: true,
      customExchangeRateNote: true,
      exchangeRateUpdatedAt: true,
    },
  });

  return mapSiteSettingToExchangeRateSettings(siteSetting);
};

export const getSiteSetting = async () => {
  const siteSetting = await prisma.siteSetting.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
  });

  return mapSiteSettingToApi(siteSetting);
};

export const updateSiteSetting = async (input: UpdateSiteSettingInput) => {
  const existing = await prisma.siteSetting.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
  });

  const socialLinks = existing?.socialLinks as SocialLinksShape | null;
  const normalizedEmail = normalizeNullableString(input.email);

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

  const normalizedExchangeRate =
    input.exchangeRateUsdToInr === undefined ? undefined : input.exchangeRateUsdToInr;
  const normalizedShowExchangeRateNote =
    input.showExchangeRateNote === undefined ? undefined : input.showExchangeRateNote === true;
  const normalizedCustomExchangeRateNote = normalizeNullableString(
    input.customExchangeRateNote,
  );
  const currentExchangeRate = decimalToNumber(existing?.exchangeRateUsdToInr);
  const currentShowExchangeRateNote = existing?.showExchangeRateNote ?? false;
  const currentCustomExchangeRateNote = existing?.customExchangeRateNote ?? null;
  const exchangeRateSettingsChanged =
    (normalizedExchangeRate !== undefined
      && normalizedExchangeRate !== currentExchangeRate)
    || (normalizedShowExchangeRateNote !== undefined
      && normalizedShowExchangeRateNote !== currentShowExchangeRateNote)
    || (normalizedCustomExchangeRateNote !== undefined
      && normalizedCustomExchangeRateNote !== currentCustomExchangeRateNote);

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
    exchangeRateUsdToInr: normalizedExchangeRate,
    showExchangeRateNote: resolveOptionalValue(
      normalizedShowExchangeRateNote,
      currentShowExchangeRateNote,
    ),
    customExchangeRateNote: resolveOptionalValue(
      normalizedCustomExchangeRateNote,
      currentCustomExchangeRateNote,
    ),
    exchangeRateUpdatedAt: exchangeRateSettingsChanged
      ? new Date()
      : existing?.exchangeRateUpdatedAt ?? null,
  };

  const siteSetting = existing
    ? await prisma.siteSetting.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.siteSetting.create({
        data,
      });

  return mapSiteSettingToApi(siteSetting);
};
