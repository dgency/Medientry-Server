import { normalizeStoredMediaValue } from './media-path';

const DEFAULT_API_PORT = '5000';
const DEFAULT_API_PATH = '/api';

const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    const normalizedPathname = url.pathname
      .replace(/\/+$/, '')
      .replace(/(?:\/api)+$/i, '');

    url.pathname = `${normalizedPathname || ''}${DEFAULT_API_PATH}`;
    url.search = '';
    url.hash = '';

    return url.toString().replace(/\/+$/, '');
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
};

const getBrowserFallbackApiUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const { hostname, protocol } = window.location;

  if (!hostname) {
    return null;
  }

  return `${protocol}//${hostname}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
};

const getBrowserFallbackSiteUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const { hostname, protocol } = window.location;

  if (!hostname) {
    return null;
  }

  return `${protocol}//${hostname}:3000`;
};

export const getApiBaseUrl = () =>
  normalizeApiBaseUrl(
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    getBrowserFallbackApiUrl() ||
    '',
  );

export const getMediaBaseUrl = () =>
  (
    import.meta.env.VITE_MEDIA_BASE_URL?.trim() ||
    import.meta.env.VITE_SPACES_PUBLIC_BASE_URL?.trim() ||
    getApiBaseUrl().replace(/\/api\/?$/, '')
  ).replace(/\/$/, '');
export const getSiteBaseUrl = () =>
  (import.meta.env.VITE_CLIENT_URL?.trim() || getBrowserFallbackSiteUrl() || '').replace(
    /\/$/,
    '',
  );

export function resolveCmsAssetUrl(value?: string | null): string {
  const clean = normalizeStoredMediaValue(value);

  if (!clean) {
    return '';
  }

  if (/^blob:/i.test(clean) || /^data:/i.test(clean)) {
    return clean;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  const apiBase = getApiBaseUrl().replace(/\/api\/?$/, '');
  const mediaBase = getMediaBaseUrl();

  if (clean.startsWith('/api/media')) {
    return apiBase ? `${apiBase}${clean}` : clean;
  }

  if (clean.startsWith('api/media')) {
    return apiBase ? `${apiBase}/${clean}` : `/${clean}`;
  }

  if (clean.startsWith('/uploads')) {
    return `${mediaBase}${clean}`;
  }

  if (clean.startsWith('uploads')) {
    return `${mediaBase}/${clean}`;
  }

  if (clean.startsWith('/')) {
    const siteBase = getSiteBaseUrl();
    return siteBase ? `${siteBase}${clean}` : clean;
  }

  return clean;
}
