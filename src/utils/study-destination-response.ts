import { Prisma } from '@prisma/client';

export const publicStudyDestinationSelect =
  Prisma.validator<Prisma.StudyDestinationSelect>()({
    id: true,
    title: true,
    slug: true,
    country: true,
    shortDescription: true,
    featuredImage: true,
    content: true,
    isFeatured: true,
    showInMenu: true,
    sortOrder: true,
    status: true,
    templateType: true,
    seoTitle: true,
    seoDescription: true,
    seoKeywords: true,
    ogImage: true,
    canonicalUrl: true,
    createdAt: true,
    updatedAt: true,
  });

export type PublicStudyDestination = Prisma.StudyDestinationGetPayload<{
  select: typeof publicStudyDestinationSelect;
}>;
