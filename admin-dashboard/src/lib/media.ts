const DEFAULT_API_PORT = '5000';
const DEFAULT_API_PATH = '/api';
const DEFAULT_SITE_PORT = '3000';
const frontendPublicPrefixes = ['/images/', '/home-page-icons/', '/favicon', '/icons.svg'];

export type MediaKind = 'image' | 'svg' | 'video' | 'document' | 'unknown';

export type MediaSelection = {
  id: string;
  url: string;
  storedValue: string | null;
  title?: string | null;
  filename: string;
  mimeType: string | null;
  kind: MediaKind;
  source: 'media' | 'gallery-legacy';
  thumbnailUrl?: string | null;
};

export type MediaListItem = MediaSelection & {
  altText?: string | null;
  caption?: string | null;
  originalName?: string | null;
  path?: string | null;
  publicUrl?: string | null;
  storageKey?: string | null;
  extension?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const warnInDevelopment = (message: string, details?: unknown) => {
  if (import.meta.env.DEV) {
    console.warn(message, details);
  }
};

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

  return `${protocol}//${hostname}:${DEFAULT_SITE_PORT}`;
};

const normalizeStoredMediaValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  const normalizedValue = trimmedValue
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/');

  const uploadsMatch = normalizedValue.match(/(?:^|\/)uploads\/(.+)$/i);

  if (uploadsMatch?.[1]) {
    return `/uploads/${uploadsMatch[1]}`;
  }

  const publicMatch = normalizedValue.match(/(?:^|\/)public\/(.+)$/i);

  if (publicMatch?.[1]) {
    return `/${publicMatch[1].replace(/^\/+/, '')}`;
  }

  if (/^\/?images\//i.test(normalizedValue)) {
    return normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`;
  }

  if (normalizedValue.startsWith('/')) {
    return normalizedValue;
  }

  return normalizedValue;
};

const buildAbsoluteUrl = (baseUrl: string, value: string) =>
  new URL(value.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`).toString();

export const getApiBaseUrl = () =>
  normalizeApiBaseUrl(
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    getBrowserFallbackApiUrl() ||
    '',
  );

export const getMediaBaseUrl = () => getApiBaseUrl().replace(/\/api\/?$/, '');

export const getSiteBaseUrl = () =>
  (import.meta.env.VITE_CLIENT_URL?.trim() || getBrowserFallbackSiteUrl() || '').replace(/\/+$/, '');

export const getFileExtension = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const match = value.split('?')[0].split('#')[0].match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? null;
};

export const detectMediaKind = (mimeType?: string | null, value?: string | null): MediaKind => {
  const normalizedMimeType = mimeType?.trim().toLowerCase() ?? '';
  const extension = getFileExtension(value);

  if (normalizedMimeType === 'image/svg+xml' || extension === 'svg') {
    return 'svg';
  }

  if (normalizedMimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'ico'].includes(extension ?? '')) {
    return 'image';
  }

  if (normalizedMimeType.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(extension ?? '')) {
    return 'video';
  }

  if (normalizedMimeType === 'application/pdf' || extension === 'pdf') {
    return 'document';
  }

  return 'unknown';
};

export function resolveCmsAssetUrl(value?: string | null): string {
  const normalizedValue = normalizeStoredMediaValue(value);

  if (!normalizedValue) {
    return '';
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  const mediaBase = getMediaBaseUrl();
  const siteBase = getSiteBaseUrl();
  if (normalizedValue.startsWith('/uploads/')) {
    if (!mediaBase) {
      warnInDevelopment('[media] Missing media base URL for upload asset.', { value });
      return normalizedValue;
    }

    return `${mediaBase}${normalizedValue}`;
  }

  if (frontendPublicPrefixes.some((prefix) => normalizedValue.startsWith(prefix)) || normalizedValue.startsWith('/')) {
    if (siteBase) {
      return buildAbsoluteUrl(siteBase, normalizedValue);
    }

    if (mediaBase) {
      return `${mediaBase}${normalizedValue}`;
    }

    return normalizedValue;
  }

  if (normalizedValue.startsWith('uploads/')) {
    if (!mediaBase) {
      warnInDevelopment('[media] Missing media base URL for upload asset.', { value });
      return `/${normalizedValue}`;
    }

    return `${mediaBase}/${normalizedValue}`;
  }

  warnInDevelopment('[media] Unrecognized media value format.', {
    value,
    normalizedValue,
  });
  return normalizedValue;
}
