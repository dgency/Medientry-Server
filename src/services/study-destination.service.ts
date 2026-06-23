import {
  Prisma,
  PublicationStatus,
  StudyDestinationTemplateType,
} from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { publicStudyDestinationSelect } from '../utils/study-destination-response';

type CreateStudyDestinationInput = {
  title: string;
  slug: string;
  country: string;
  shortDescription?: string;
  featuredImage?: string;
  content?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  isFeatured: boolean;
  showInMenu: boolean;
  sortOrder: number;
  status: PublicationStatus;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
};

type UpdateStudyDestinationInput = Partial<CreateStudyDestinationInput>;

type ListStudyDestinationsOptions = {
  includeUnpublished?: boolean;
  showInMenu?: boolean;
  status?: PublicationStatus;
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
const normalizeCountry = (country: string) => country.trim();

const resolveTemplateType = (input: {
  title?: string;
  slug?: string;
  country?: string;
}) => {
  const normalizedSlug = input.slug?.trim().toLowerCase() ?? '';
  const normalizedTitle = input.title?.trim().toLowerCase() ?? '';
  const normalizedCountry = input.country?.trim().toLowerCase() ?? '';

  const isBangladeshMbbsDestination =
    normalizedCountry === 'bangladesh' &&
    (normalizedSlug.includes('mbbs') || normalizedTitle.includes('mbbs'));

  return isBangladeshMbbsDestination
    ? StudyDestinationTemplateType.FIXED_FRONTEND_CONTENT
    : StudyDestinationTemplateType.DYNAMIC_TEMPLATE;
};

const buildStudyDestinationData = (
  input: CreateStudyDestinationInput | UpdateStudyDestinationInput,
  fallback?: {
    title: string;
    slug: string;
    country: string;
  },
): Prisma.StudyDestinationUncheckedCreateInput | Prisma.StudyDestinationUncheckedUpdateInput => {
  const data:
    | Prisma.StudyDestinationUncheckedCreateInput
    | Prisma.StudyDestinationUncheckedUpdateInput = {};

  const title = 'title' in input && input.title !== undefined ? input.title.trim() : fallback?.title;
  const slug = 'slug' in input && input.slug !== undefined ? normalizeSlug(input.slug) : fallback?.slug;
  const country =
    'country' in input && input.country !== undefined
      ? normalizeCountry(input.country)
      : fallback?.country;

  if ('title' in input && input.title !== undefined) {
    data.title = title;
  }

  if ('slug' in input && input.slug !== undefined) {
    data.slug = slug;
  }

  if ('country' in input && input.country !== undefined) {
    data.country = country;
  }

  if ('shortDescription' in input) {
    data.shortDescription = normalizeNullableString(input.shortDescription);
  }

  if ('featuredImage' in input) {
    data.featuredImage = normalizeNullableString(input.featuredImage);
  }

  if ('content' in input) {
    data.content = input.content ?? Prisma.JsonNull;
  }

  if ('isFeatured' in input && input.isFeatured !== undefined) {
    data.isFeatured = input.isFeatured;
  }

  if ('showInMenu' in input && input.showInMenu !== undefined) {
    data.showInMenu = input.showInMenu;
  }

  if ('sortOrder' in input && input.sortOrder !== undefined) {
    data.sortOrder = input.sortOrder;
  }

  if ('status' in input && input.status !== undefined) {
    data.status = input.status;
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

  if (title && slug && country) {
    data.templateType = resolveTemplateType({ title, slug, country });
  }

  return data;
};

const ensureSlugAvailable = async (slug: string, excludeId?: string) => {
  const existingDestination = await prisma.studyDestination.findUnique({
    where: { slug: normalizeSlug(slug) },
    select: { id: true },
  });

  if (existingDestination && existingDestination.id !== excludeId) {
    throw new ApiError(409, 'A study destination with this slug already exists.');
  }
};

export const listStudyDestinations = async ({
  includeUnpublished = false,
  showInMenu,
  status,
}: ListStudyDestinationsOptions = {}) => {
  const resolvedStatus =
    status ?? (includeUnpublished ? undefined : PublicationStatus.PUBLISHED);

  return prisma.studyDestination.findMany({
    where: {
      ...(resolvedStatus ? { status: resolvedStatus } : {}),
      ...(showInMenu !== undefined ? { showInMenu } : {}),
    },
    select: publicStudyDestinationSelect,
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
  });
};

export const getStudyDestinationBySlug = async (slug: string) => {
  const destination = await prisma.studyDestination.findFirst({
    where: {
      slug: normalizeSlug(slug),
      status: PublicationStatus.PUBLISHED,
    },
    select: publicStudyDestinationSelect,
  });

  if (!destination) {
    throw new ApiError(404, 'Published study destination not found.');
  }

  return destination;
};

export const createStudyDestination = async (input: CreateStudyDestinationInput) => {
  await ensureSlugAvailable(input.slug);

  return prisma.studyDestination.create({
    data: buildStudyDestinationData(input) as Prisma.StudyDestinationUncheckedCreateInput,
    select: publicStudyDestinationSelect,
  });
};

export const updateStudyDestination = async (
  id: string,
  input: UpdateStudyDestinationInput,
) => {
  const existingDestination = await prisma.studyDestination.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      country: true,
    },
  });

  if (!existingDestination) {
    throw new ApiError(404, 'Study destination not found.');
  }

  if (input.slug) {
    await ensureSlugAvailable(input.slug, id);
  }

  return prisma.studyDestination.update({
    where: { id },
    data: buildStudyDestinationData(input, {
      title: existingDestination.title,
      slug: existingDestination.slug,
      country: existingDestination.country,
    }) as Prisma.StudyDestinationUncheckedUpdateInput,
    select: publicStudyDestinationSelect,
  });
};

export const deleteStudyDestination = async (id: string) => {
  const existingDestination = await prisma.studyDestination.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingDestination) {
    throw new ApiError(404, 'Study destination not found.');
  }

  await prisma.studyDestination.delete({
    where: { id },
  });
};
