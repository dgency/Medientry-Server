import { Prisma, PublicationStatus, SimpleStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import {
  getHomeSectionLookupKeys,
  type HomeSectionKey,
  HOME_SECTION_KEYS,
} from '../utils/home-section';
import { publicBlogSelect } from '../utils/blog-response';
import {
  mapMedicalCollegeToApi,
  publicMedicalCollegeSelect,
} from '../utils/medical-college-response';
import { mapNoticeToApi, publicNoticeSelect } from '../utils/notice-response';
import { publicStudyDestinationSelect } from '../utils/study-destination-response';
import { publicSuccessStorySelect } from '../utils/success-story-response';

type StoredHomeSectionSetting = {
  id: string;
  sectionKey: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  content: unknown;
  selectedItemIds: unknown;
  itemLimit: number | null;
  isEnabled: boolean;
};

type HomeSectionContentInput = {
  primaryButtonText?: string;
  primaryButtonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  backgroundImage?: string;
};

type UpdateHomeSectionInput = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  content?: HomeSectionContentInput;
  selectedItemIds?: string[];
  itemLimit?: number | null;
  isEnabled?: boolean;
};

type ResolvedHomeSection = {
  sectionKey: HomeSectionKey;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown> | null;
  selectedItemIds: string[];
  itemLimit: number | null;
  isEnabled: boolean;
  items: unknown[];
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeSectionContent = (value?: HomeSectionContentInput | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = {
    primaryButtonText: normalizeNullableString(value.primaryButtonText),
    primaryButtonUrl: normalizeNullableString(value.primaryButtonUrl),
    secondaryButtonText: normalizeNullableString(value.secondaryButtonText),
    secondaryButtonUrl: normalizeNullableString(value.secondaryButtonUrl),
    backgroundImage: normalizeNullableString(value.backgroundImage),
  };

  return Object.values(normalized).some((item) => item !== null)
    ? normalized
    : null;
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const dedupeIds = (ids?: string[]) => {
  if (!ids) {
    return undefined;
  }

  return [...new Set(ids)];
};

const applySelectedOrder = <T extends { id: string }>(items: T[], selectedItemIds: string[]) => {
  if (selectedItemIds.length === 0) {
    return items;
  }

  const selectedIdOrder = new Map(selectedItemIds.map((id, index) => [id, index]));

  return [...items].sort((a, b) => {
    const aIndex = selectedIdOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = selectedIdOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
};

const applyItemLimit = <T>(items: T[], itemLimit: number | null) => {
  if (!itemLimit || itemLimit <= 0) {
    return items;
  }

  return items.slice(0, itemLimit);
};

const findStoredSectionRecord = (
  sectionKey: HomeSectionKey,
  settings: StoredHomeSectionSetting[],
) => {
  const lookupKeys = getHomeSectionLookupKeys(sectionKey);

  return settings.find((item) => item.sectionKey === sectionKey)
    ?? settings.find((item) => lookupKeys.includes(item.sectionKey));
};

const buildSectionConfig = (
  sectionKey: HomeSectionKey,
  storedSetting?: StoredHomeSectionSetting,
) => {
  return {
    sectionKey,
    eyebrow: storedSetting?.eyebrow ?? null,
    title: storedSetting?.title ?? null,
    subtitle: storedSetting?.subtitle ?? null,
    content: isRecord(storedSetting?.content) ? storedSetting.content : null,
    selectedItemIds: isStringArray(storedSetting?.selectedItemIds)
      ? storedSetting.selectedItemIds
      : [],
    itemLimit: storedSetting?.itemLimit ?? null,
    isEnabled: storedSetting?.isEnabled ?? true,
  };
};

const validateSelectedItemIds = async (
  sectionKey: HomeSectionKey,
  selectedItemIds?: string[],
) => {
  const ids = dedupeIds(selectedItemIds);

  if (!ids || ids.length === 0) {
    return ids ?? [];
  }

  let matchedCount = 0;

  switch (sectionKey) {
    case 'choose_your_path':
      matchedCount = await prisma.studyDestination.count({
        where: { id: { in: ids } },
      });
      break;
    case 'featured_medical_colleges':
      matchedCount = await prisma.medicalCollege.count({
        where: { id: { in: ids } },
      });
      break;
    case 'success_stories':
      matchedCount = await prisma.successStory.count({
        where: { id: { in: ids } },
      });
      break;
    case 'latest_blogs':
      matchedCount = await prisma.blog.count({
        where: { id: { in: ids } },
      });
      break;
    case 'notices':
      matchedCount = await prisma.notice.count({
        where: { id: { in: ids } },
      });
      break;
    case 'homepage_cta':
      return [];
    default:
      matchedCount = 0;
  }

  if (matchedCount !== ids.length) {
    throw new ApiError(400, 'One or more selected items are invalid for this section.');
  }

  return ids;
};

const resolveChooseYourPathItems = async (
  selectedItemIds: string[],
  itemLimit: number | null,
  includeUnpublished: boolean,
) => {
  const studyDestinations = await prisma.studyDestination.findMany({
    where: {
      ...(includeUnpublished ? {} : { status: PublicationStatus.PUBLISHED }),
      ...(selectedItemIds.length > 0 ? { id: { in: selectedItemIds } } : {}),
    },
    select: publicStudyDestinationSelect,
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
  });

  return applyItemLimit(applySelectedOrder(studyDestinations, selectedItemIds), itemLimit);
};

const resolveFeaturedMedicalCollegeItems = async (
  selectedItemIds: string[],
  itemLimit: number | null,
  includeUnpublished: boolean,
) => {
  const shouldUseManualSelection = selectedItemIds.length > 0;

  const medicalColleges = await prisma.medicalCollege.findMany({
    where: {
      ...(includeUnpublished ? {} : { status: PublicationStatus.PUBLISHED }),
      ...(shouldUseManualSelection
        ? { id: { in: selectedItemIds } }
        : { isFeatured: true }),
    },
    select: publicMedicalCollegeSelect,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return applyItemLimit(
    applySelectedOrder(medicalColleges, selectedItemIds),
    itemLimit,
  ).map(mapMedicalCollegeToApi);
};

const resolveSuccessStoryItems = async (
  selectedItemIds: string[],
  itemLimit: number | null,
  includeInactive: boolean,
) => {
  const successStories = await prisma.successStory.findMany({
    where: {
      ...(includeInactive
        ? {}
        : {
            status: SimpleStatus.ACTIVE,
            showOnHomepage: true,
          }),
      ...(selectedItemIds.length > 0 ? { id: { in: selectedItemIds } } : {}),
    },
    select: publicSuccessStorySelect,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return applyItemLimit(applySelectedOrder(successStories, selectedItemIds), itemLimit);
};

const resolveLatestBlogItems = async (
  selectedItemIds: string[],
  itemLimit: number | null,
  includeUnpublished: boolean,
) => {
  const blogs = await prisma.blog.findMany({
    where: {
      ...(includeUnpublished ? {} : { status: PublicationStatus.PUBLISHED }),
      ...(selectedItemIds.length > 0 ? { id: { in: selectedItemIds } } : {}),
    },
    select: publicBlogSelect,
    orderBy: [{ createdAt: 'desc' }],
  });

  return applyItemLimit(applySelectedOrder(blogs, selectedItemIds), itemLimit);
};

const resolveNoticeItems = async (
  selectedItemIds: string[],
  itemLimit: number | null,
  includeUnpublished: boolean,
) => {
  const notices = await prisma.notice.findMany({
    where: {
      ...(includeUnpublished ? {} : { status: PublicationStatus.PUBLISHED }),
      ...(selectedItemIds.length > 0 ? { id: { in: selectedItemIds } } : {}),
    },
    select: publicNoticeSelect,
    orderBy: [
      { isPinned: 'desc' },
      { pinnedOrder: 'asc' },
      { publishedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const selectedIdOrder = new Map(selectedItemIds.map((id, index) => [id, index]));
  const orderedNotices =
    selectedItemIds.length === 0
      ? notices
      : [...notices].sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }

          if (a.isPinned && b.isPinned) {
            return (a.pinnedOrder ?? Number.MAX_SAFE_INTEGER)
              - (b.pinnedOrder ?? Number.MAX_SAFE_INTEGER);
          }

          const aIndex = selectedIdOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const bIndex = selectedIdOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
          return aIndex - bIndex;
        });

  return applyItemLimit(orderedNotices, itemLimit).map(mapNoticeToApi);
};

const resolveSectionItems = async (
  sectionKey: HomeSectionKey,
  config: Pick<ResolvedHomeSection, 'selectedItemIds' | 'itemLimit'>,
  includeHiddenContent: boolean,
) => {
  switch (sectionKey) {
    case 'choose_your_path':
      return resolveChooseYourPathItems(
        config.selectedItemIds,
        config.itemLimit,
        includeHiddenContent,
      );
    case 'featured_medical_colleges':
      return resolveFeaturedMedicalCollegeItems(
        config.selectedItemIds,
        config.itemLimit,
        includeHiddenContent,
      );
    case 'success_stories':
      return resolveSuccessStoryItems(
        config.selectedItemIds,
        config.itemLimit,
        includeHiddenContent,
      );
    case 'latest_blogs':
      return resolveLatestBlogItems(
        config.selectedItemIds,
        config.itemLimit,
        includeHiddenContent,
      );
    case 'notices':
      return resolveNoticeItems(
        config.selectedItemIds,
        config.itemLimit,
        includeHiddenContent,
      );
    case 'homepage_cta':
      return [];
    default:
      return [];
  }
};

const getStoredHomeSections = async () => {
  const allLookupKeys = HOME_SECTION_KEYS.flatMap((sectionKey) =>
    getHomeSectionLookupKeys(sectionKey),
  );

  const settings = await prisma.homeSectionSetting.findMany({
    where: {
      sectionKey: {
        in: allLookupKeys,
      },
    },
    select: {
      id: true,
      sectionKey: true,
      eyebrow: true,
      title: true,
      subtitle: true,
      content: true,
      selectedItemIds: true,
      itemLimit: true,
      isEnabled: true,
    },
  });

  return settings as StoredHomeSectionSetting[];
};

const resolveHomeSection = async (
  sectionKey: HomeSectionKey,
  storedSetting: StoredHomeSectionSetting | undefined,
  includeHiddenContent: boolean,
) => {
  const config = buildSectionConfig(sectionKey, storedSetting);
  const items = await resolveSectionItems(sectionKey, config, includeHiddenContent);

  return {
    ...config,
    items,
  };
};

export const listHomeSections = async (includeDisabledAndHiddenContent = false) => {
  const storedSettings = await getStoredHomeSections();

  const sections = await Promise.all(
    HOME_SECTION_KEYS.map((sectionKey) =>
      resolveHomeSection(
        sectionKey,
        findStoredSectionRecord(sectionKey, storedSettings),
        includeDisabledAndHiddenContent,
      ),
    ),
  );

  return includeDisabledAndHiddenContent
    ? sections
    : sections.filter((section) => section.isEnabled);
};

export const updateHomeSection = async (
  sectionKey: HomeSectionKey,
  input: UpdateHomeSectionInput,
) => {
  const selectedItemIds = await validateSelectedItemIds(sectionKey, input.selectedItemIds);

  const data: Prisma.HomeSectionSettingUncheckedUpdateInput = {};

  if ('eyebrow' in input) {
    data.eyebrow = normalizeNullableString(input.eyebrow);
  }

  if ('title' in input) {
    data.title = normalizeNullableString(input.title);
  }

  if ('subtitle' in input) {
    data.subtitle = normalizeNullableString(input.subtitle);
  }

  if ('content' in input) {
    const normalizedContent = normalizeSectionContent(input.content);
    data.content = normalizedContent ?? Prisma.JsonNull;
  }

  if ('selectedItemIds' in input) {
    data.selectedItemIds = selectedItemIds;
  }

  if ('itemLimit' in input) {
    data.itemLimit = input.itemLimit ?? null;
  }

  if ('isEnabled' in input && input.isEnabled !== undefined) {
    data.isEnabled = input.isEnabled;
  }

  await prisma.$transaction(async (tx) => {
    const existingSetting = await tx.homeSectionSetting.findFirst({
      where: {
        sectionKey: {
          in: getHomeSectionLookupKeys(sectionKey),
        },
      },
      orderBy: {
        sectionKey: 'asc',
      },
    });

    if (!existingSetting) {
      await tx.homeSectionSetting.create({
        data: {
          ...(data as Omit<Prisma.HomeSectionSettingUncheckedCreateInput, 'sectionKey'>),
          sectionKey,
        },
      });

      return;
    }

    await tx.homeSectionSetting.update({
      where: {
        id: existingSetting.id,
      },
      data: {
        sectionKey,
        ...(data as Prisma.HomeSectionSettingUncheckedUpdateInput),
      },
    });
  });

  const storedSettings = await getStoredHomeSections();
  return resolveHomeSection(
    sectionKey,
    findStoredSectionRecord(sectionKey, storedSettings),
    true,
  );
};
