import type { Request } from 'express';

export type CapturedRequestClientInfo = {
  ipAddress?: string;
  ipLocation?: string;
  userAgent?: string;
  deviceType?: string;
  deviceLabel?: string;
};

const getHeaderValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const normalizeIpAddress = (value?: string | null) => {
  const candidate = value?.split(',')[0]?.trim();

  if (!candidate) {
    return undefined;
  }

  if (candidate.startsWith('::ffff:')) {
    return candidate.slice(7);
  }

  if (candidate === '::1') {
    return '127.0.0.1';
  }

  return candidate;
};

const normalizeLocationPart = (value?: string | null) => {
  const normalizedValue = value?.trim();

  if (!normalizedValue || normalizedValue.toUpperCase() === 'XX') {
    return undefined;
  }

  return normalizedValue;
};

const detectDeviceType = (userAgent: string) => {
  const normalizedUserAgent = userAgent.toLowerCase();

  if (/(bot|crawler|spider|slurp|bingpreview|headless)/i.test(normalizedUserAgent)) {
    return 'Bot';
  }

  if (
    /(ipad|tablet|playbook|silk|kindle|sm-t|lenovo tab|tab)/i.test(
      normalizedUserAgent,
    )
  ) {
    return 'Tablet';
  }

  if (
    /(mobi|iphone|ipod|android|blackberry|iemobile|opera mini|phone)/i.test(
      normalizedUserAgent,
    )
  ) {
    return 'Mobile';
  }

  return 'Desktop';
};

const detectOperatingSystem = (userAgent: string) => {
  if (/windows nt/i.test(userAgent)) {
    return 'Windows';
  }

  if (/(iphone|ipad|ipod)/i.test(userAgent)) {
    return 'iOS';
  }

  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  if (/mac os x|macintosh/i.test(userAgent)) {
    return 'macOS';
  }

  if (/linux/i.test(userAgent)) {
    return 'Linux';
  }

  return undefined;
};

const detectBrowser = (userAgent: string) => {
  if (/edg\//i.test(userAgent)) {
    return 'Edge';
  }

  if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) {
    return 'Opera';
  }

  if (/samsungbrowser\//i.test(userAgent)) {
    return 'Samsung Internet';
  }

  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) {
    return 'Chrome';
  }

  if (/firefox\//i.test(userAgent)) {
    return 'Firefox';
  }

  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
    return 'Safari';
  }

  return undefined;
};

const buildDeviceLabel = (deviceType?: string, operatingSystem?: string, browser?: string) => {
  const parts = [deviceType, operatingSystem, browser].filter(
    (value, index, values): value is string =>
      Boolean(value) && values.indexOf(value) === index,
  );

  return parts.length > 0 ? parts.join(' • ') : undefined;
};

export const captureRequestClientInfo = (req: Request): CapturedRequestClientInfo => {
  const ipAddress = normalizeIpAddress(
    getHeaderValue(req.headers['cf-connecting-ip']) ??
      getHeaderValue(req.headers['x-real-ip']) ??
      getHeaderValue(req.headers['x-forwarded-for']) ??
      req.ip ??
      req.socket.remoteAddress,
  );

  const userAgent = getHeaderValue(req.headers['user-agent'])?.trim() || undefined;
  const deviceType = userAgent ? detectDeviceType(userAgent) : undefined;
  const operatingSystem = userAgent ? detectOperatingSystem(userAgent) : undefined;
  const browser = userAgent ? detectBrowser(userAgent) : undefined;

  const city = normalizeLocationPart(
    getHeaderValue(req.headers['x-vercel-ip-city']) ??
      getHeaderValue(req.headers['x-appengine-city']),
  );
  const region = normalizeLocationPart(
    getHeaderValue(req.headers['x-vercel-ip-country-region']) ??
      getHeaderValue(req.headers['x-appengine-region']),
  );
  const country = normalizeLocationPart(
    getHeaderValue(req.headers['x-vercel-ip-country']) ??
      getHeaderValue(req.headers['cf-ipcountry']) ??
      getHeaderValue(req.headers['cloudfront-viewer-country']) ??
      getHeaderValue(req.headers['x-appengine-country']),
  );

  const ipLocationParts = [city, region, country].filter(
    (value, index, values): value is string =>
      Boolean(value) && values.indexOf(value) === index,
  );

  return {
    ipAddress,
    ipLocation: ipLocationParts.length > 0 ? ipLocationParts.join(', ') : undefined,
    userAgent,
    deviceType,
    deviceLabel: buildDeviceLabel(deviceType, operatingSystem, browser),
  };
};
