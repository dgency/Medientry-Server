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

export const getApiBaseUrl = () =>
  normalizeApiBaseUrl(
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    getBrowserFallbackApiUrl() ||
    '',
  );

export const getMediaBaseUrl = () => getApiBaseUrl().replace(/\/api\/?$/, '');

export function resolveCmsAssetUrl(value?: string | null): string {
  if (!value) {
    return '';
  }

  const clean = value.trim();

  if (!clean) {
    return '';
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  const mediaBase = getMediaBaseUrl();

  if (clean.startsWith('/uploads')) {
    return `${mediaBase}${clean}`;
  }

  if (clean.startsWith('uploads')) {
    return `${mediaBase}/${clean}`;
  }

  return clean;
}
