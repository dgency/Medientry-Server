import { env } from '../config/env';

const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);
const internalProjectHosts = new Set(['medientrybd.com', 'www.medientrybd.com']);
const protocolRelativePattern = /^\/\//;
const windowsPathPattern = /^(?:[a-z]:[\\/]|\\\\)/i;
const apiMediaPathPattern = /^\/?api\/media\//i;
const uploadsPathPattern = /^\/?uploads\//i;
const frontendAssetPathPattern =
  /^\/?(?:images|icons|home-page-icons)\//i;
const faviconPathPattern = /^\/?favicon(?:\.[a-z0-9]+)?$/i;
const mediaExtensionPattern =
  /\.(?:avif|gif|ico|jpe?g|pdf|png|svg|webp)(?:[?#].*)?$/i;
const embeddedUploadPathPattern = /(^|[\s"'(=])((?:\/?uploads\/)[^"'<>)\s]+)/gi;
const mediaFieldNamePattern =
  /(image|images|thumbnail|logo|favicon|icon|banner|background|photo|avatar|poster|cover|file|document|media|asset)/i;
const mediaKeyNames = new Set([
  'src',
  'url',
  'path',
  'fileUrl',
  'heroImage',
  'featuredImage',
  'ogImage',
  'backgroundImage',
  'imageSrc',
  'thumbnail',
  'favicon',
  'logo',
]);

const normalizePathSeparators = (value: string) => value.replace(/\\/g, '/');

const collapsePathSlashes = (value: string) => value.replace(/\/{2,}/g, '/');

const normalizeProjectRelativePath = (value: string) => {
  const normalizedValue = collapsePathSlashes(normalizePathSeparators(value)).trim();

  if (!normalizedValue) {
    return '';
  }

  const uploadsMatch = normalizedValue.match(/(?:^|\/)uploads\/(.+)$/i);

  if (uploadsMatch?.[1]) {
    return `/uploads/${uploadsMatch[1].replace(/^\/+/, '')}`;
  }

  const apiMediaMatch = normalizedValue.match(/(?:^|\/)(api\/media\/.+)$/i);

  if (apiMediaMatch?.[1]) {
    return `/${apiMediaMatch[1].replace(/^\/+/, '')}`;
  }

  const publicMatch = normalizedValue.match(/(?:^|\/)public\/(.+)$/i);

  if (publicMatch?.[1]) {
    return `/${publicMatch[1].replace(/^\/+/, '')}`;
  }

  if (normalizedValue.startsWith('/')) {
    return normalizedValue;
  }

  return `/${normalizedValue.replace(/^\/+/, '')}`;
};

const shouldNormalizeAbsoluteProjectUrl = (value: URL) => {
  const normalizedHost = value.hostname.trim().toLowerCase();

  return loopbackHosts.has(normalizedHost) || internalProjectHosts.has(normalizedHost);
};

const getConfiguredServerOrigin = () => {
  const configuredBaseUrl =
    env.SERVER_PUBLIC_URL?.trim() || env.PUBLIC_BASE_URL?.trim() || '';

  if (!configuredBaseUrl) {
    return null;
  }

  try {
    return new URL(configuredBaseUrl).origin;
  } catch {
    return null;
  }
};

const getConfiguredMediaOrigin = () => {
  const configuredBaseUrl =
    env.SERVER_PUBLIC_URL?.trim()
    || env.PUBLIC_BASE_URL?.trim()
    || '';

  if (!configuredBaseUrl) {
    return null;
  }

  try {
    return new URL(configuredBaseUrl).origin;
  } catch {
    return null;
  }
};

const looksLikeStandaloneMediaValue = (value: string, fieldName?: string | null) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  if (
    protocolRelativePattern.test(trimmedValue)
    || apiMediaPathPattern.test(trimmedValue)
    || uploadsPathPattern.test(trimmedValue)
    || frontendAssetPathPattern.test(trimmedValue)
    || faviconPathPattern.test(trimmedValue)
  ) {
    return true;
  }

  if (windowsPathPattern.test(trimmedValue) || /^blob:/i.test(trimmedValue) || /^data:/i.test(trimmedValue)) {
    return true;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    try {
      const parsedUrl = new URL(trimmedValue);
      const normalizedPath = normalizeProjectRelativePath(parsedUrl.pathname);

      return (
        uploadsPathPattern.test(normalizedPath)
        || apiMediaPathPattern.test(normalizedPath)
        || frontendAssetPathPattern.test(normalizedPath)
        || faviconPathPattern.test(normalizedPath)
        || mediaExtensionPattern.test(parsedUrl.pathname)
      );
    } catch {
      return mediaExtensionPattern.test(trimmedValue);
    }
  }

  if (mediaExtensionPattern.test(trimmedValue)) {
    return true;
  }

  if (!fieldName) {
    return false;
  }

  return mediaKeyNames.has(fieldName) || mediaFieldNamePattern.test(fieldName);
};

export const normalizeStoredMediaValue = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    try {
      const url = new URL(trimmedValue);
      const normalizedPath = normalizeProjectRelativePath(url.pathname);
      const looksLikeProjectAsset =
        normalizedPath.startsWith('/uploads/')
        || normalizedPath.startsWith('/api/media/')
        || normalizedPath.startsWith('/images/')
        || normalizedPath.startsWith('/favicon')
        || normalizedPath.startsWith('/home-page-icons/')
        || normalizedPath.startsWith('/icons/');

      if (looksLikeProjectAsset && shouldNormalizeAbsoluteProjectUrl(url)) {
        return `${normalizedPath}${url.search}`;
      }

      return url.toString();
    } catch {
      return trimmedValue;
    }
  }

  return normalizeProjectRelativePath(trimmedValue);
};

export const resolvePublicMediaUrl = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || /^blob:/i.test(trimmedValue) || /^data:/i.test(trimmedValue)) {
    return null;
  }

  if (windowsPathPattern.test(trimmedValue)) {
    return null;
  }

  if (protocolRelativePattern.test(trimmedValue)) {
    return `https:${trimmedValue}`;
  }

  const normalizedValue = normalizeStoredMediaValue(trimmedValue);

  if (!normalizedValue) {
    return null;
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  const configuredServerOrigin = getConfiguredServerOrigin();
  const configuredMediaOrigin = getConfiguredMediaOrigin();

  if (normalizedValue.startsWith('/uploads/')) {
    return configuredMediaOrigin
      ? `${configuredMediaOrigin}${normalizedValue}`
      : normalizedValue;
  }

  if (normalizedValue.startsWith('/api/media/')) {
    return configuredMediaOrigin
      ? `${configuredMediaOrigin}${normalizedValue}`
      : normalizedValue;
  }

  if (normalizedValue.startsWith('uploads/')) {
    const normalizedUploadsPath = `/${normalizedValue.replace(/^\/+/, '')}`;
    return configuredMediaOrigin
      ? `${configuredMediaOrigin}${normalizedUploadsPath}`
      : normalizedUploadsPath;
  }

  if (normalizedValue.startsWith('api/media/')) {
    const normalizedApiPath = `/${normalizedValue.replace(/^\/+/, '')}`;
    return configuredMediaOrigin
      ? `${configuredMediaOrigin}${normalizedApiPath}`
      : normalizedApiPath;
  }

  return normalizedValue;
};

export const replaceEmbeddedUploadPaths = (value: string) =>
  value.replace(embeddedUploadPathPattern, (match, prefix, assetPath) => {
    const resolvedUrl = resolvePublicMediaUrl(assetPath);
    return resolvedUrl ? `${prefix}${resolvedUrl}` : match;
  });

export const normalizeMediaContentValue = <T>(value: T, fieldName?: string | null): T => {
  if (typeof value === 'string') {
    if (looksLikeStandaloneMediaValue(value, fieldName)) {
      return (resolvePublicMediaUrl(value) ?? value.trim()) as T;
    }

    if (value.includes('uploads/')) {
      return replaceEmbeddedUploadPaths(value) as T;
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeMediaContentValue(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeMediaContentValue(item, key),
      ]),
    ) as T;
  }

  return value;
};
