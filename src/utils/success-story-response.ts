import { Prisma } from '@prisma/client';

import { normalizeMediaContentValue, resolvePublicMediaUrl } from './media-path';

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

type RawPublicSuccessStory = Prisma.SuccessStoryGetPayload<{
  select: typeof publicSuccessStorySelect;
}>;

export type PublicSuccessStory = Omit<RawPublicSuccessStory, 'image' | 'fullStory'> & {
  image: string | null;
  fullStory: string | null;
};

export const mapSuccessStoryToApi = (
  successStory: RawPublicSuccessStory,
): PublicSuccessStory => ({
  ...successStory,
  image: resolvePublicMediaUrl(successStory.image),
  fullStory: normalizeMediaContentValue(successStory.fullStory, 'fullStory'),
});
