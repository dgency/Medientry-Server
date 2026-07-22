import { GalleryItemType, Prisma, SimpleStatus } from '@prisma/client';

import {
  publicMediaAssetSelect,
  resolveMediaAssetUrl,
  serializeMediaAsset,
  type PublicMediaAsset,
} from './media-asset-response';
import { resolvePublicMediaUrl } from './media-path';

const normalizeNullableString = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export const publicGalleryItemSelect =
  Prisma.validator<Prisma.GalleryItemSelect>()({
    id: true,
    mediaAssetId: true,
    title: true,
    type: true,
    url: true,
    thumbnail: true,
    category: true,
    altText: true,
    seoTitle: true,
    seoDescription: true,
    sortOrder: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    mediaAsset: {
      select: publicMediaAssetSelect,
    },
  });

export type PublicGalleryItemRecord = Prisma.GalleryItemGetPayload<{
  select: typeof publicGalleryItemSelect;
}>;

export type PublicGalleryItem = {
  id: string;
  mediaAssetId: string | null;
  title: string;
  type: GalleryItemType;
  url: string;
  thumbnail: string | null;
  category: string | null;
  altText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sortOrder: number;
  status: SimpleStatus;
  createdAt: Date;
  updatedAt: Date;
  mediaAsset: PublicMediaAsset | null;
};

const resolveGalleryLegacyUrl = (item: Pick<PublicGalleryItemRecord, 'url' | 'thumbnail'>) =>
  resolvePublicMediaUrl(item.url) ?? resolvePublicMediaUrl(item.thumbnail);

export const serializeGalleryItem = (
  item: PublicGalleryItemRecord,
  {
    preferAssetThumbnail = true,
  }: {
    preferAssetThumbnail?: boolean;
  } = {},
): PublicGalleryItem => {
  const assetUrl = resolveMediaAssetUrl(item.mediaAsset);
  const legacyUrl = resolveGalleryLegacyUrl(item);
  const resolvedUrl = assetUrl ?? legacyUrl ?? '';
  const legacyThumbnail = resolvePublicMediaUrl(item.thumbnail);
  const resolvedThumbnail =
    (preferAssetThumbnail ? assetUrl : null)
    ?? legacyThumbnail
    ?? (item.type === GalleryItemType.IMAGE ? resolvedUrl || null : null);

  return {
    id: item.id,
    mediaAssetId: item.mediaAssetId ?? null,
    title: item.title,
    type: item.type,
    url: resolvedUrl,
    thumbnail: resolvedThumbnail,
    category: normalizeNullableString(item.category),
    altText: normalizeNullableString(item.altText) ?? normalizeNullableString(item.mediaAsset?.altText),
    seoTitle: normalizeNullableString(item.seoTitle) ?? normalizeNullableString(item.mediaAsset?.seoTitle),
    seoDescription:
      normalizeNullableString(item.seoDescription)
      ?? normalizeNullableString(item.mediaAsset?.seoDescription)
      ?? normalizeNullableString(item.mediaAsset?.caption),
    sortOrder: item.sortOrder,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    mediaAsset: item.mediaAsset ? serializeMediaAsset(item.mediaAsset) : null,
  };
};
