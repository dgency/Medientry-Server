import { env } from '../config/env';

const localhostHostnames = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

const normalizeBaseUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : '';
};

const getConfiguredPublicSiteBaseUrl = () =>
  normalizeBaseUrl(env.EMAIL_PUBLIC_SITE_URL ?? env.CLIENT_URL);

const isLocalHostname = (hostname: string) => {
  const normalizedHostname = hostname.trim().toLowerCase();

  return (
    localhostHostnames.has(normalizedHostname) ||
    normalizedHostname.endsWith('.local') ||
    normalizedHostname.endsWith('.localhost')
  );
};

const replaceOrigin = (url: URL, nextOrigin: URL) =>
  new URL(`${url.pathname}${url.search}${url.hash}`, nextOrigin).toString();

export const resolvePublicWebsiteUrl = (value?: string | null) => {
  const trimmedValue = value?.trim();
  const publicBaseUrl = getConfiguredPublicSiteBaseUrl();

  if (!trimmedValue) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    try {
      const parsedUrl = new URL(trimmedValue);

      if (!isLocalHostname(parsedUrl.hostname) || !publicBaseUrl) {
        return parsedUrl.toString();
      }

      return replaceOrigin(parsedUrl, new URL(publicBaseUrl));
    } catch {
      return undefined;
    }
  }

  if (!publicBaseUrl) {
    return undefined;
  }

  try {
    return new URL(trimmedValue.replace(/^\/+/, ''), `${publicBaseUrl}/`).toString();
  } catch {
    return undefined;
  }
};

export const buildPublicWebsiteAssetUrl = (assetPath: string) => {
  const publicBaseUrl = getConfiguredPublicSiteBaseUrl();

  if (!publicBaseUrl) {
    return undefined;
  }

  try {
    return new URL(assetPath.replace(/^\/+/, ''), `${publicBaseUrl}/`).toString();
  } catch {
    return undefined;
  }
};
