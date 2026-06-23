import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export { resolveCmsAssetUrl } from './media';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatLabel = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const toJsonTextareaValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
};

export const parseJsonTextareaValue = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  return JSON.parse(value);
};

export const toKeywordsValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
};

export const parseKeywordsValue = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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

export const getSiteBaseUrl = () =>
  (import.meta.env.VITE_CLIENT_URL?.trim() || getBrowserFallbackSiteUrl() || '').replace(
    /\/$/,
    '',
  );
