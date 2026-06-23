import { Prisma } from '@prisma/client';

export const publicGalleryItemSelect =
  Prisma.validator<Prisma.GalleryItemSelect>()({
    id: true,
    title: true,
    type: true,
    url: true,
    thumbnail: true,
    category: true,
    sortOrder: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  });

export type PublicGalleryItem = Prisma.GalleryItemGetPayload<{
  select: typeof publicGalleryItemSelect;
}>;
