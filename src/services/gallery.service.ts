import { GalleryItemType, Prisma, SimpleStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { publicGalleryItemSelect } from '../utils/gallery-response';

type CreateGalleryItemInput = {
  title: string;
  type: GalleryItemType;
  url: string;
  thumbnail?: string;
  category?: string;
  sortOrder: number;
  status: SimpleStatus;
};

type UpdateGalleryItemInput = Partial<CreateGalleryItemInput>;

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

const buildGalleryItemData = (
  input: CreateGalleryItemInput | UpdateGalleryItemInput,
): Prisma.GalleryItemUncheckedCreateInput | Prisma.GalleryItemUncheckedUpdateInput => {
  const data:
    | Prisma.GalleryItemUncheckedCreateInput
    | Prisma.GalleryItemUncheckedUpdateInput = {};

  if ('title' in input && input.title !== undefined) {
    data.title = input.title.trim();
  }

  if ('type' in input && input.type !== undefined) {
    data.type = input.type;
  }

  if ('url' in input && input.url !== undefined) {
    data.url = input.url.trim();
  }

  if ('thumbnail' in input) {
    data.thumbnail = normalizeNullableString(input.thumbnail);
  }

  if ('category' in input) {
    data.category = normalizeNullableString(input.category);
  }

  if ('sortOrder' in input && input.sortOrder !== undefined) {
    data.sortOrder = input.sortOrder;
  }

  if ('status' in input && input.status !== undefined) {
    data.status = input.status;
  }

  return data;
};

export const listGalleryItems = async (includeInactive = false) => {
  return prisma.galleryItem.findMany({
    where: includeInactive ? undefined : { status: SimpleStatus.ACTIVE },
    select: publicGalleryItemSelect,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
};

export const listHomepageGalleryItems = async () => {
  return prisma.galleryItem.findMany({
    where: {
      status: SimpleStatus.ACTIVE,
      type: GalleryItemType.IMAGE,
    },
    select: publicGalleryItemSelect,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 7,
  });
};

export const createGalleryItem = async (input: CreateGalleryItemInput) => {
  return prisma.galleryItem.create({
    data: buildGalleryItemData(input) as Prisma.GalleryItemUncheckedCreateInput,
    select: publicGalleryItemSelect,
  });
};

export const updateGalleryItem = async (id: string, input: UpdateGalleryItemInput) => {
  const existingGalleryItem = await prisma.galleryItem.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingGalleryItem) {
    throw new ApiError(404, 'Gallery item not found.');
  }

  return prisma.galleryItem.update({
    where: { id },
    data: buildGalleryItemData(input) as Prisma.GalleryItemUncheckedUpdateInput,
    select: publicGalleryItemSelect,
  });
};

export const deleteGalleryItem = async (id: string) => {
  const existingGalleryItem = await prisma.galleryItem.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingGalleryItem) {
    throw new ApiError(404, 'Gallery item not found.');
  }

  await prisma.galleryItem.delete({
    where: { id },
  });
};
