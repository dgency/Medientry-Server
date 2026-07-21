import path from 'node:path';
import { MediaKind } from '@prisma/client';

type MediaBaseUrls = {
  backendBaseUrl: string;
  frontendBaseUrl: string;
};

const imageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);
const videoMimeTypes = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
]);
const documentMimeTypes = new Set([
  'application/pdf',
]);

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'ico']);
const videoExtensions = new Set(['mp4', 'webm', 'ogg', 'mov', 'm4v']);
const documentExtensions = new Set(['pdf']);
const frontendPublicPrefixes = ['/images/', '/home-page-icons/', '/favicon', '/icons.svg'];

export const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const stripLocalFilesystemPrefix = (value: string) => {
  const normalized = value.replace(/\\/g, '/');
  const uploadsMatch = normalized.match(/(?:^|\/)uploads\/(.+)$/i);

  if (uploadsMatch?.[1]) {
    return `/uploads/${uploadsMatch[1]}`;
  }

  const publicMatch = normalized.match(/(?:^|\/)public\/(.+)$/i);

  if (publicMatch?.[1]) {
    return `/${publicMatch[1].replace(/^\/+/, '')}`;
  }

  return normalized;
};

export const normalizeStoredMediaValue = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (isAbsoluteHttpUrl(trimmedValue)) {
    return trimmedValue;
  }

  const normalizedValue = stripLocalFilesystemPrefix(trimmedValue)
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/');

  if (/^public\//i.test(normalizedValue)) {
    return `/${normalizedValue.replace(/^public\/+/i, '')}`;
  }

  if (/^\/?uploads\//i.test(normalizedValue)) {
    return `/${normalizedValue.replace(/^\/+/, '').replace(/^uploads\/+/i, 'uploads/')}`;
  }

  if (/^uploads\//i.test(normalizedValue)) {
    return `/${normalizedValue}`;
  }

  if (/^\/+images\//i.test(normalizedValue)) {
    return normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`;
  }

  if (/^images\//i.test(normalizedValue)) {
    return `/${normalizedValue}`;
  }

  if (normalizedValue.startsWith('/')) {
    return normalizedValue;
  }

  return normalizedValue;
};

const buildAbsoluteUrl = (baseUrl: string, normalizedPath: string) =>
  new URL(normalizedPath.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`).toString();

export const buildPublicMediaUrl = (
  value: string | null | undefined,
  { backendBaseUrl, frontendBaseUrl }: MediaBaseUrls,
) => {
  const normalizedValue = normalizeStoredMediaValue(value);

  if (!normalizedValue) {
    return null;
  }

  if (isAbsoluteHttpUrl(normalizedValue)) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith('/uploads/')) {
    return buildAbsoluteUrl(backendBaseUrl, normalizedValue);
  }

  if (frontendPublicPrefixes.some((prefix) => normalizedValue.startsWith(prefix))) {
    return buildAbsoluteUrl(frontendBaseUrl || backendBaseUrl, normalizedValue);
  }

  if (normalizedValue.startsWith('/')) {
    return buildAbsoluteUrl(frontendBaseUrl || backendBaseUrl, normalizedValue);
  }

  return buildAbsoluteUrl(backendBaseUrl, normalizedValue);
};

export const getFileExtension = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const sanitizedValue = value.split('?')[0].split('#')[0];
  const extension = path.extname(sanitizedValue).replace(/^\./, '').trim().toLowerCase();

  return extension || null;
};

export const detectMediaKind = (
  mimeType?: string | null,
  extensionOrPath?: string | null,
): MediaKind => {
  const normalizedMimeType = mimeType?.trim().toLowerCase() ?? '';
  const normalizedExtension =
    getFileExtension(extensionOrPath) ??
    extensionOrPath?.trim().toLowerCase().replace(/^\./, '') ??
    '';

  if (normalizedMimeType === 'image/svg+xml' || normalizedExtension === 'svg') {
    return MediaKind.SVG;
  }

  if (imageMimeTypes.has(normalizedMimeType) || imageExtensions.has(normalizedExtension)) {
    return MediaKind.IMAGE;
  }

  if (videoMimeTypes.has(normalizedMimeType) || videoExtensions.has(normalizedExtension)) {
    return MediaKind.VIDEO;
  }

  if (documentMimeTypes.has(normalizedMimeType) || documentExtensions.has(normalizedExtension)) {
    return MediaKind.DOCUMENT;
  }

  return MediaKind.UNKNOWN;
};

export const mediaKindToClientKind = (value: MediaKind) => value.toLowerCase();
