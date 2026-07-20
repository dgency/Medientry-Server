import { Prisma } from '@prisma/client';

export const publicHomeReelSelect =
  Prisma.validator<Prisma.HomeReelSelect>()({
    id: true,
    title: true,
    videoUrl: true,
    youtubeVideoId: true,
    thumbnail: true,
    sortOrder: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  });

export type PublicHomeReel = Prisma.HomeReelGetPayload<{
  select: typeof publicHomeReelSelect;
}>;
