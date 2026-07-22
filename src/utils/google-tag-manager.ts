export const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

export type GoogleTagManagerModeApi = 'container-id' | 'custom-code';
export type GoogleTagManagerEnvironmentApi = 'production' | 'all';

export const normalizeGtmId = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
};

export const validateGtmId = (value?: string | null) => {
  const normalizedValue = normalizeGtmId(value);
  return normalizedValue !== null && GTM_ID_PATTERN.test(normalizedValue);
};

export const normalizeGtmMode = (
  value?: string | null,
): GoogleTagManagerModeApi => (value === 'custom-code' ? 'custom-code' : 'container-id');

export const normalizeGtmEnvironment = (
  value?: string | null,
): GoogleTagManagerEnvironmentApi => (value === 'all' ? 'all' : 'production');

export const normalizeGtmCode = (value?: string | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().length > 0 ? value.replace(/\r\n?/g, '\n') : null;
};
