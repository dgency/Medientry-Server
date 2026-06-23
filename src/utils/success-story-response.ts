import { Prisma } from '@prisma/client';

export const publicSuccessStorySelect =
  Prisma.validator<Prisma.SuccessStorySelect>()({
    id: true,
    studentName: true,
    roleType: true,
    country: true,
    city: true,
    university: true,
    batch: true,
    image: true,
    rating: true,
    reviewText: true,
    fullStory: true,
    videoUrl: true,
    showOnHomepage: true,
    status: true,
    sortOrder: true,
    createdAt: true,
    updatedAt: true,
  });

export type PublicSuccessStory = Prisma.SuccessStoryGetPayload<{
  select: typeof publicSuccessStorySelect;
}>;
