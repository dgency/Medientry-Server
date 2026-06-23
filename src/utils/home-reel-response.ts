import { Prisma } from '@prisma/client';

export const publicHomeReelSelect =
  Prisma.validator<Prisma.HomeReelSelect>()({
    id: true,
    title: true,
    thumbnail: true,
    wistiaVideoId: true,
    wistiaEmbedCode: true,
    sortOrder: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  });

export type PublicHomeReel = Prisma.HomeReelGetPayload<{
  select: typeof publicHomeReelSelect;
}>;
