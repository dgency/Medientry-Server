import { MediaKind, Prisma, SimpleStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import {
  publicMediaAssetSelect,
  serializeMediaAsset,
} from '../utils/media-asset-response';

type ListMediaAssetsInput = {
  fileType?: MediaKind | 'ALL';
  status?: SimpleStatus | 'ALL';
  search?: string;
};

type UpdateMediaAssetInput = {
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: SimpleStatus;
};

const normalizeNullableString = (value?: string | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export const listMediaAssets = async ({
  fileType,
  status,
  search,
}: ListMediaAssetsInput = {}) => {
  const normalizedSearch = normalizeNullableString(search);
  const where: Prisma.MediaAssetWhereInput = {};

  if (fileType && fileType !== 'ALL') {
    where.fileType = fileType;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (normalizedSearch) {
    where.OR = [
      { title: { contains: normalizedSearch, mode: 'insensitive' } },
      { originalName: { contains: normalizedSearch, mode: 'insensitive' } },
      { filename: { contains: normalizedSearch, mode: 'insensitive' } },
      { altText: { contains: normalizedSearch, mode: 'insensitive' } },
      { caption: { contains: normalizedSearch, mode: 'insensitive' } },
      { seoTitle: { contains: normalizedSearch, mode: 'insensitive' } },
      { seoDescription: { contains: normalizedSearch, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.mediaAsset.findMany({
    where,
    select: publicMediaAssetSelect,
    orderBy: [{ createdAt: 'desc' }, { filename: 'asc' }],
  });

  return items.map((item) => serializeMediaAsset(item));
};

export const updateMediaAsset = async (id: string, input: UpdateMediaAssetInput) => {
  const existingMediaAsset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingMediaAsset) {
    throw new ApiError(404, 'Media asset not found.');
  }

  const updatedAsset = await prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: normalizeNullableString(input.title) } : {}),
      ...(input.altText !== undefined ? { altText: normalizeNullableString(input.altText) } : {}),
      ...(input.caption !== undefined ? { caption: normalizeNullableString(input.caption) } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: normalizeNullableString(input.seoTitle) } : {}),
      ...(input.seoDescription !== undefined
        ? { seoDescription: normalizeNullableString(input.seoDescription) }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    select: publicMediaAssetSelect,
  });

  return serializeMediaAsset(updatedAsset);
};
