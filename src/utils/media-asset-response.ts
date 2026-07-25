import { MediaKind, Prisma, SimpleStatus } from '@prisma/client';

import { buildMediaAssetPublicUrl } from '../services/storage.service';
import { resolvePublicMediaUrl } from './media-path';

const normalizeNullableString = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export const publicMediaAssetSelect =
  Prisma.validator<Prisma.MediaAssetSelect>()({
    id: true,
    title: true,
    altText: true,
    caption: true,
    seoTitle: true,
    seoDescription: true,
    filename: true,
    originalName: true,
    path: true,
    url: true,
    publicUrl: true,
    storageKey: true,
    storageType: true,
    mimeType: true,
    extension: true,
    fileType: true,
    size: true,
    width: true,
    height: true,
    duration: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  });

export type PublicMediaAssetRecord = Prisma.MediaAssetGetPayload<{
  select: typeof publicMediaAssetSelect;
}>;

export type PublicMediaAsset = {
  id: string;
  title: string | null;
  altText: string | null;
  caption: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  filename: string;
  originalName: string | null;
  path: string | null;
  url: string | null;
  publicUrl: string | null;
  storageKey: string | null;
  storageType: string;
  mimeType: string | null;
  extension: string | null;
  fileType: MediaKind;
  size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  status: SimpleStatus;
  createdAt: Date;
  updatedAt: Date;
};

export const resolveMediaAssetUrl = (
  asset?:
    | Pick<PublicMediaAsset, 'publicUrl' | 'url'>
    | Pick<PublicMediaAsset, 'filename' | 'id' | 'publicUrl' | 'storageKey' | 'storageType' | 'url'>
    | null,
) => {
  if (!asset) {
    return null;
  }

  if (
    'storageType' in asset &&
    asset.storageType &&
    'id' in asset &&
    asset.id &&
    'filename' in asset &&
    asset.filename
  ) {
    return buildMediaAssetPublicUrl(asset);
  }

  return resolvePublicMediaUrl(asset.publicUrl) ?? resolvePublicMediaUrl(asset.url);
};

const resolveSerializedMediaAssetUrl = (asset: PublicMediaAssetRecord) =>
  buildMediaAssetPublicUrl(asset);

export const serializeMediaAsset = (asset: PublicMediaAssetRecord): PublicMediaAsset => {
  const resolvedAssetUrl = resolveSerializedMediaAssetUrl(asset);

  return {
    id: asset.id,
    title: normalizeNullableString(asset.title),
    altText: normalizeNullableString(asset.altText),
    caption: normalizeNullableString(asset.caption),
    seoTitle: normalizeNullableString(asset.seoTitle),
    seoDescription: normalizeNullableString(asset.seoDescription),
    filename: asset.filename,
    originalName: normalizeNullableString(asset.originalName),
    path: normalizeNullableString(asset.path),
    url: resolvedAssetUrl,
    publicUrl: resolvedAssetUrl,
    storageKey: normalizeNullableString(asset.storageKey),
    storageType: asset.storageType,
    mimeType: normalizeNullableString(asset.mimeType),
    extension: normalizeNullableString(asset.extension),
    fileType: asset.fileType,
    size: asset.size ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    duration: asset.duration ?? null,
    status: asset.status,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
};
