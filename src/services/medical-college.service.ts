import { Prisma, PublicationStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { type CollegeFeeItemInput } from '../utils/college-fee';
import { normalizeFeeItemsForWrite } from '../utils/college-fee-persistence';
import {
  FEATURED_MEDICAL_COLLEGES_SECTION_KEY,
  getHomeSectionLookupKeys,
} from '../utils/home-section';
import {
  mapMedicalCollegeToApi,
  publicMedicalCollegeSelect,
} from '../utils/medical-college-response';
import {
  buildPaginatedResult,
  paginateArray,
  type PaginationInput,
} from '../utils/pagination';

type CreateMedicalCollegeInput = {
  studyDestinationId?: string | null;
  name: string;
  slug: string;
  country: string;
  city?: string;
  image?: string;
  shortDescription?: string;
  tuitionFee?: number | null;
  hostelFee?: number | null;
  totalFee?: number | null;
  feeStructure?: CollegeFeeItemInput[];
  ranking?: string;
  eligibility?: string;
  admissionProcess?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  facilities?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  gallery?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  contentBlocks?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  isFeatured: boolean;
  status: PublicationStatus;
};

type UpdateMedicalCollegeInput = Partial<CreateMedicalCollegeInput>;

type ListMedicalCollegesOptions = {
  includeUnpublished?: boolean;
  featuredOnly?: boolean;
  sectionKey?: string;
  limit?: number;
  search?: string;
  pagination?: PaginationInput | null;
};

type HomeSectionSettingShape = {
  selectedItemIds?: unknown;
  itemLimit?: number | null;
  isEnabled?: boolean;
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

const normalizeSlug = (slug: string) => slug.trim().toLowerCase();
const normalizeRequiredString = (value: string) => value.trim();

const buildMedicalCollegeSearchWhere = (search?: string): Prisma.MedicalCollegeWhereInput => {
  const normalizedSearch = search?.trim();

  if (!normalizedSearch) {
    return {};
  }

  return {
    OR: [
      { name: { contains: normalizedSearch, mode: 'insensitive' } },
      { slug: { contains: normalizedSearch, mode: 'insensitive' } },
      { country: { contains: normalizedSearch, mode: 'insensitive' } },
      { city: { contains: normalizedSearch, mode: 'insensitive' } },
      { shortDescription: { contains: normalizedSearch, mode: 'insensitive' } },
      { seoTitle: { contains: normalizedSearch, mode: 'insensitive' } },
      { seoDescription: { contains: normalizedSearch, mode: 'insensitive' } },
    ],
  };
};

const normalizeNullableDecimal = (value?: number | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return value;
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
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

const buildMedicalCollegeData = (
  input: CreateMedicalCollegeInput | UpdateMedicalCollegeInput,
): Prisma.MedicalCollegeUncheckedCreateInput | Prisma.MedicalCollegeUncheckedUpdateInput => {
  const data:
    | Prisma.MedicalCollegeUncheckedCreateInput
    | Prisma.MedicalCollegeUncheckedUpdateInput = {};

  if ('studyDestinationId' in input) {
    data.studyDestinationId = input.studyDestinationId ?? null;
  }

  if ('name' in input && input.name !== undefined) {
    data.name = normalizeRequiredString(input.name);
  }

  if ('slug' in input && input.slug !== undefined) {
    data.slug = normalizeSlug(input.slug);
  }

  if ('country' in input && input.country !== undefined) {
    data.country = normalizeRequiredString(input.country);
  }

  if ('city' in input) {
    data.city = normalizeNullableString(input.city);
  }

  if ('image' in input) {
    data.featuredImage = normalizeNullableString(input.image);
  }

  if ('shortDescription' in input) {
    data.shortDescription = normalizeNullableString(input.shortDescription);
  }

  if ('tuitionFee' in input) {
    data.tuitionFee = normalizeNullableDecimal(input.tuitionFee);
  }

  if ('hostelFee' in input) {
    data.hostelFee = normalizeNullableDecimal(input.hostelFee);
  }

  if ('totalFee' in input) {
    data.totalFee = normalizeNullableDecimal(input.totalFee);
  }

  if ('ranking' in input) {
    data.ranking = normalizeNullableString(input.ranking);
  }

  if ('eligibility' in input) {
    data.eligibility = normalizeNullableString(input.eligibility);
  }

  if ('admissionProcess' in input) {
    data.admissionProcess = input.admissionProcess ?? Prisma.JsonNull;
  }

  if ('facilities' in input) {
    data.facilities = input.facilities ?? Prisma.JsonNull;
  }

  if ('gallery' in input) {
    data.gallery = input.gallery ?? Prisma.JsonNull;
  }

  if ('contentBlocks' in input) {
    data.content = input.contentBlocks ?? Prisma.JsonNull;
  }

  if ('sortOrder' in input && input.sortOrder !== undefined) {
    data.sortOrder = input.sortOrder;
  }

  if ('seoTitle' in input) {
    data.seoTitle = normalizeNullableString(input.seoTitle);
  }

  if ('seoDescription' in input) {
    data.seoDescription = normalizeNullableString(input.seoDescription);
  }

  if ('seoKeywords' in input && input.seoKeywords !== undefined) {
    data.seoKeywords = input.seoKeywords;
  }

  if ('ogImage' in input) {
    data.ogImage = normalizeNullableString(input.ogImage);
  }

  if ('canonicalUrl' in input) {
    data.canonicalUrl = normalizeNullableString(input.canonicalUrl);
  }

  if ('isFeatured' in input && input.isFeatured !== undefined) {
    data.isFeatured = input.isFeatured;
  }

  if ('status' in input && input.status !== undefined) {
    data.status = input.status;
  }

  return data;
};

const ensureSlugAvailable = async (slug: string, excludeId?: string) => {
  const existingMedicalCollege = await prisma.medicalCollege.findUnique({
    where: { slug: normalizeSlug(slug) },
    select: { id: true },
  });

  if (existingMedicalCollege && existingMedicalCollege.id !== excludeId) {
    throw new ApiError(409, 'A medical college with this slug already exists.');
  }
};

const ensureStudyDestinationExists = async (studyDestinationId?: string | null) => {
  if (!studyDestinationId) {
    return;
  }

  const destination = await prisma.studyDestination.findUnique({
    where: { id: studyDestinationId },
    select: { id: true },
  });

  if (!destination) {
    throw new ApiError(400, 'Invalid study destination selected.');
  }
};

const getHomeSectionConfig = async (sectionKey?: string) => {
  if (!sectionKey) {
    return null;
  }

  const lookupKeys =
    sectionKey === FEATURED_MEDICAL_COLLEGES_SECTION_KEY
      ? getHomeSectionLookupKeys(FEATURED_MEDICAL_COLLEGES_SECTION_KEY)
      : [sectionKey];

  const homeSectionSetting = await prisma.homeSectionSetting.findFirst({
    where: { sectionKey: { in: lookupKeys } },
    orderBy: {
      sectionKey: 'asc',
    },
  });

  return homeSectionSetting as HomeSectionSettingShape | null;
};

export const listMedicalColleges = async ({
  includeUnpublished = false,
  featuredOnly = false,
  sectionKey,
  limit,
  search,
  pagination,
}: ListMedicalCollegesOptions = {}) => {
  const homeSectionSetting = await getHomeSectionConfig(sectionKey);
  const selectedItemIds = isStringArray(homeSectionSetting?.selectedItemIds)
    ? homeSectionSetting.selectedItemIds
    : [];

  const sectionEnabled = homeSectionSetting?.isEnabled ?? true;

  if (sectionKey && !sectionEnabled) {
    return [];
  }

  const shouldUseManualSelection = selectedItemIds.length > 0;

  const where: Prisma.MedicalCollegeWhereInput = {
    ...(includeUnpublished ? {} : { status: PublicationStatus.PUBLISHED }),
    ...(shouldUseManualSelection ? { id: { in: selectedItemIds } } : {}),
    ...(featuredOnly && !shouldUseManualSelection ? { isFeatured: true } : {}),
    ...buildMedicalCollegeSearchWhere(search),
  };

  if (pagination && !shouldUseManualSelection) {
    const [totalItems, rawMedicalColleges] = await Promise.all([
      prisma.medicalCollege.count({ where }),
      prisma.medicalCollege.findMany({
        where,
        select: publicMedicalCollegeSelect,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
    ]);

    return buildPaginatedResult({
      items: rawMedicalColleges.map((medicalCollege) =>
        mapMedicalCollegeToApi(medicalCollege, {
          includeInactiveFeeItems: includeUnpublished,
        }),
      ),
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
    });
  }

  const rawMedicalColleges = await prisma.medicalCollege.findMany({
    where,
    select: publicMedicalCollegeSelect,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  const orderedMedicalColleges = applySelectedOrder(rawMedicalColleges, selectedItemIds);

  const resolvedLimit =
    limit ??
    homeSectionSetting?.itemLimit ??
    undefined;

  const slicedMedicalColleges =
    resolvedLimit && resolvedLimit > 0
      ? orderedMedicalColleges.slice(0, resolvedLimit)
      : orderedMedicalColleges;

  const mappedMedicalColleges = slicedMedicalColleges.map((medicalCollege) =>
    mapMedicalCollegeToApi(medicalCollege, {
      includeInactiveFeeItems: includeUnpublished,
    }),
  );

  return paginateArray(mappedMedicalColleges, pagination ?? null);
};

export const getFeaturedMedicalCollegesForHomepage = async () =>
  listMedicalColleges({
    featuredOnly: true,
    sectionKey: FEATURED_MEDICAL_COLLEGES_SECTION_KEY,
  });

export const getMedicalCollegeBySlug = async (
  slug: string,
  includeUnpublished = false,
) => {
  const medicalCollege = await prisma.medicalCollege.findFirst({
    where: {
      slug: normalizeSlug(slug),
      ...(includeUnpublished ? {} : { status: PublicationStatus.PUBLISHED }),
    },
    select: publicMedicalCollegeSelect,
  });

  if (!medicalCollege) {
    throw new ApiError(404, 'Medical college not found.');
  }

  return mapMedicalCollegeToApi(medicalCollege, {
    includeInactiveFeeItems: includeUnpublished,
  });
};

export const createMedicalCollege = async (input: CreateMedicalCollegeInput) => {
  await ensureSlugAvailable(input.slug);
  await ensureStudyDestinationExists(input.studyDestinationId);

  const medicalCollege = await prisma.$transaction(async (tx) => {
    const createdMedicalCollege = await tx.medicalCollege.create({
      data: buildMedicalCollegeData(input) as Prisma.MedicalCollegeUncheckedCreateInput,
      select: { id: true },
    });

    if (input.feeStructure) {
      const feeItems = normalizeFeeItemsForWrite(input.feeStructure);

      if (feeItems.length > 0) {
        await tx.collegeFeeItem.createMany({
          data: feeItems.map((item) => ({
            ...item,
            medicalCollegeId: createdMedicalCollege.id,
          })),
        });
      }
    }

    return tx.medicalCollege.findUniqueOrThrow({
      where: { id: createdMedicalCollege.id },
      select: publicMedicalCollegeSelect,
    });
  });

  return mapMedicalCollegeToApi(medicalCollege, {
    includeInactiveFeeItems: true,
  });
};

export const updateMedicalCollege = async (
  id: string,
  input: UpdateMedicalCollegeInput,
) => {
  const existingMedicalCollege = await prisma.medicalCollege.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingMedicalCollege) {
    throw new ApiError(404, 'Medical college not found.');
  }

  if (input.slug) {
    await ensureSlugAvailable(input.slug, id);
  }

  await ensureStudyDestinationExists(input.studyDestinationId);

  const medicalCollege = await prisma.$transaction(async (tx) => {
    await tx.medicalCollege.update({
      where: { id },
      data: buildMedicalCollegeData(input) as Prisma.MedicalCollegeUncheckedUpdateInput,
      select: { id: true },
    });

    if (input.feeStructure) {
      const feeItems = normalizeFeeItemsForWrite(input.feeStructure);

      await tx.collegeFeeItem.deleteMany({
        where: { medicalCollegeId: id },
      });

      if (feeItems.length > 0) {
        await tx.collegeFeeItem.createMany({
          data: feeItems.map((item) => ({
            ...item,
            medicalCollegeId: id,
          })),
        });
      }
    }

    return tx.medicalCollege.findUniqueOrThrow({
      where: { id },
      select: publicMedicalCollegeSelect,
    });
  });

  return mapMedicalCollegeToApi(medicalCollege, {
    includeInactiveFeeItems: true,
  });
};

export const deleteMedicalCollege = async (id: string) => {
  const existingMedicalCollege = await prisma.medicalCollege.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingMedicalCollege) {
    throw new ApiError(404, 'Medical college not found.');
  }

  await prisma.medicalCollege.delete({
    where: { id },
  });
};

export const featuredMedicalCollegesSectionKey = FEATURED_MEDICAL_COLLEGES_SECTION_KEY;
