import { Prisma } from '@prisma/client';

import { normalizeMediaContentValue, resolvePublicMediaUrl } from './media-path';

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

type RawPublicStudyDestination = Prisma.StudyDestinationGetPayload<{
  select: typeof publicStudyDestinationSelect;
}>;

export type PublicStudyDestination = Omit<
  RawPublicStudyDestination,
  'featuredImage' | 'content' | 'ogImage'
> & {
  featuredImage: string | null;
  content: RawPublicStudyDestination['content'];
  ogImage: string | null;
};

export const mapStudyDestinationToApi = (
  destination: RawPublicStudyDestination,
): PublicStudyDestination => ({
  ...destination,
  featuredImage: resolvePublicMediaUrl(destination.featuredImage),
  content: normalizeMediaContentValue(destination.content, 'content'),
  ogImage: resolvePublicMediaUrl(destination.ogImage),
});
