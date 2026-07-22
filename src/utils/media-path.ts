const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);
const internalProjectHosts = new Set(['medientrybd.com', 'www.medientrybd.com']);

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
