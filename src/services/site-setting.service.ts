import { prisma } from '../config/prisma';

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
} | null): SiteSettingApiShape => {
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
  };
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
