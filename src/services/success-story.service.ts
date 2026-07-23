import { Prisma, SimpleStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import {
  getHomeSectionLookupKeys,
  SUCCESS_STORIES_SECTION_KEY,
} from '../utils/home-section';
import {
  buildPaginatedResult,
  type PaginatedResult,
  type PaginationInput,
} from '../utils/pagination';
import {
  mapSuccessStoryToApi,
  publicSuccessStorySelect,
} from '../utils/success-story-response';

type CreateSuccessStoryInput = {
  studentName: string;
  roleType: string;
  country?: string;
  city?: string;
  university?: string;
  batch?: string;
  image?: string;
  rating?: number;
  reviewText?: string;
  fullStory?: string;
  videoUrl?: string;
  showOnHomepage: boolean;
  status: SimpleStatus;
  sortOrder: number;
};

type UpdateSuccessStoryInput = Partial<CreateSuccessStoryInput>;

type ListSuccessStoriesOptions = {
  includeInactive?: boolean;
  search?: string;
  pagination?: PaginationInput | null;
};

type SuccessStoryListItem = ReturnType<typeof mapSuccessStoryToApi>;

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

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const applyItemLimit = <T,>(items: T[], itemLimit: number | null) => {
  if (!itemLimit || itemLimit <= 0) {
    return items;
  }

  return items.slice(0, itemLimit);
};

const buildSuccessStoryData = (
  input: CreateSuccessStoryInput | UpdateSuccessStoryInput,
): Prisma.SuccessStoryUncheckedCreateInput | Prisma.SuccessStoryUncheckedUpdateInput => {
  const data:
    | Prisma.SuccessStoryUncheckedCreateInput
    | Prisma.SuccessStoryUncheckedUpdateInput = {};

  if ('studentName' in input && input.studentName !== undefined) {
    data.studentName = input.studentName.trim();
  }

  if ('roleType' in input && input.roleType !== undefined) {
    data.roleType = input.roleType.trim();
  }

  if ('country' in input) {
    data.country = normalizeNullableString(input.country);
  }

  if ('city' in input) {
    data.city = normalizeNullableString(input.city);
  }

  if ('university' in input) {
    data.university = normalizeNullableString(input.university);
  }

  if ('batch' in input) {
    data.batch = normalizeNullableString(input.batch);
  }

  if ('image' in input) {
    data.image = normalizeNullableString(input.image);
  }

  if ('rating' in input && input.rating !== undefined) {
    data.rating = input.rating;
  }

  if ('reviewText' in input) {
    data.reviewText = normalizeNullableString(input.reviewText);
  }

  if ('fullStory' in input) {
    data.fullStory = normalizeNullableString(input.fullStory);
  }

  if ('videoUrl' in input) {
    data.videoUrl = normalizeNullableString(input.videoUrl);
  }

  if ('showOnHomepage' in input && input.showOnHomepage !== undefined) {
    data.showOnHomepage = input.showOnHomepage;
  }

  if ('status' in input && input.status !== undefined) {
    data.status = input.status;
  }

  if ('sortOrder' in input && input.sortOrder !== undefined) {
    data.sortOrder = input.sortOrder;
  }

  return data;
};

export const listSuccessStories = async ({
  includeInactive = false,
  search,
  pagination,
}: ListSuccessStoriesOptions = {}): Promise<
  SuccessStoryListItem[] | PaginatedResult<SuccessStoryListItem>
> => {
  const normalizedSearch = search?.trim();
  const where: Prisma.SuccessStoryWhereInput = {
    ...(includeInactive ? {} : { status: SimpleStatus.ACTIVE }),
    ...(normalizedSearch
      ? {
          OR: [
            { studentName: { contains: normalizedSearch, mode: 'insensitive' } },
            { roleType: { contains: normalizedSearch, mode: 'insensitive' } },
            { university: { contains: normalizedSearch, mode: 'insensitive' } },
            { batch: { contains: normalizedSearch, mode: 'insensitive' } },
            { city: { contains: normalizedSearch, mode: 'insensitive' } },
            { country: { contains: normalizedSearch, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  if (!pagination) {
    const stories = await prisma.successStory.findMany({
      where,
      select: publicSuccessStorySelect,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return stories.map(mapSuccessStoryToApi);
  }

  const [totalItems, stories] = await Promise.all([
    prisma.successStory.count({ where }),
    prisma.successStory.findMany({
      where,
      select: publicSuccessStorySelect,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
  ]);

  return buildPaginatedResult({
    items: stories.map(mapSuccessStoryToApi),
    page: pagination.page,
    limit: pagination.limit,
    totalItems,
  });
};

export const listHomepageSuccessStories = async () => {
  const sectionSetting = await prisma.homeSectionSetting.findFirst({
    where: {
      sectionKey: {
        in: getHomeSectionLookupKeys(SUCCESS_STORIES_SECTION_KEY),
      },
    },
    orderBy: {
      sectionKey: 'asc',
    },
    select: {
      selectedItemIds: true,
      itemLimit: true,
      isEnabled: true,
    },
  });

  if (sectionSetting?.isEnabled === false) {
    return [];
  }

  const selectedItemIds = isStringArray(sectionSetting?.selectedItemIds)
    ? sectionSetting.selectedItemIds
    : [];

  const stories = await prisma.successStory.findMany({
    where: {
      status: SimpleStatus.ACTIVE,
      showOnHomepage: true,
      ...(selectedItemIds.length > 0 ? { id: { in: selectedItemIds } } : {}),
    },
    select: publicSuccessStorySelect,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  const orderedStories =
    selectedItemIds.length === 0
      ? stories
      : [...stories].sort((a, b) => {
          const aIndex = selectedItemIds.indexOf(a.id);
          const bIndex = selectedItemIds.indexOf(b.id);
          return aIndex - bIndex;
        });

  return applyItemLimit(orderedStories, sectionSetting?.itemLimit ?? null).map(
    mapSuccessStoryToApi,
  );
};

export const createSuccessStory = async (input: CreateSuccessStoryInput) => {
  const story = await prisma.successStory.create({
    data: buildSuccessStoryData(input) as Prisma.SuccessStoryUncheckedCreateInput,
    select: publicSuccessStorySelect,
  });

  return mapSuccessStoryToApi(story);
};

export const updateSuccessStory = async (id: string, input: UpdateSuccessStoryInput) => {
  const existingSuccessStory = await prisma.successStory.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingSuccessStory) {
    throw new ApiError(404, 'Success story not found.');
  }

  const story = await prisma.successStory.update({
    where: { id },
    data: buildSuccessStoryData(input) as Prisma.SuccessStoryUncheckedUpdateInput,
    select: publicSuccessStorySelect,
  });

  return mapSuccessStoryToApi(story);
};

export const deleteSuccessStory = async (id: string) => {
  const existingSuccessStory = await prisma.successStory.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingSuccessStory) {
    throw new ApiError(404, 'Success story not found.');
  }

  await prisma.successStory.delete({
    where: { id },
  });
};
