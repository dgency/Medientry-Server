const DEFAULT_API_PORT = '5000';
const DEFAULT_API_PATH = '/api';

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
  (
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    getBrowserFallbackApiUrl() ||
    ''
  ).replace(/\/+$/, '');

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
