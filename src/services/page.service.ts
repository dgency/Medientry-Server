import { PageType, Prisma, PublicationStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import {
  buildPaginatedResult,
  type PaginatedResult,
  type PaginationInput,
} from '../utils/pagination';
import { normalizeStoredMediaValue } from '../utils/media-path';
import { mapPageToApi, publicPageSelect } from '../utils/page-response';

type CreatePageInput = {
  title: string;
  slug: string;
  pageType?: PageType;
  templateType: Prisma.PageCreateInput['templateType'];
  status: PublicationStatus;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  content?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
};

type UpdatePageInput = Partial<CreatePageInput>;

type PageListItem = ReturnType<typeof mapPageToApi>;

type ListPagesOptions = {
  search?: string;
  pagination?: PaginationInput | null;
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

const buildPageSearchWhere = (search?: string): Prisma.PageWhereInput => {
  const normalizedSearch = search?.trim();

  if (!normalizedSearch) {
    return {};
  }

  return {
    OR: [
      { title: { contains: normalizedSearch, mode: 'insensitive' } },
      { slug: { contains: normalizedSearch, mode: 'insensitive' } },
      { heroTitle: { contains: normalizedSearch, mode: 'insensitive' } },
      { heroSubtitle: { contains: normalizedSearch, mode: 'insensitive' } },
      { seoTitle: { contains: normalizedSearch, mode: 'insensitive' } },
      { seoDescription: { contains: normalizedSearch, mode: 'insensitive' } },
    ],
  };
};

const buildPageData = (input: CreatePageInput | UpdatePageInput): Prisma.PageUncheckedCreateInput | Prisma.PageUncheckedUpdateInput => {
  const data: Prisma.PageUncheckedCreateInput | Prisma.PageUncheckedUpdateInput = {};

  if ('title' in input && input.title !== undefined) {
    data.title = input.title.trim();
  }

  if ('slug' in input && input.slug !== undefined) {
    data.slug = normalizeSlug(input.slug);
  }

  if ('pageType' in input) {
    data.pageType = input.pageType ?? PageType.CUSTOM;
  }

  if ('templateType' in input && input.templateType !== undefined) {
    data.templateType = input.templateType;
  }

  if ('status' in input && input.status !== undefined) {
    data.status = input.status;
  }

  if ('heroTitle' in input) {
    data.heroTitle = normalizeNullableString(input.heroTitle);
  }

  if ('heroSubtitle' in input) {
    data.heroSubtitle = normalizeNullableString(input.heroSubtitle);
  }

  if ('heroImage' in input) {
    data.heroImage = normalizeStoredMediaValue(input.heroImage) ?? normalizeNullableString(input.heroImage);
  }

  if ('content' in input) {
    data.content = input.content ?? Prisma.JsonNull;
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
    data.ogImage = normalizeStoredMediaValue(input.ogImage) ?? normalizeNullableString(input.ogImage);
  }

  if ('canonicalUrl' in input) {
    data.canonicalUrl = normalizeNullableString(input.canonicalUrl);
  }

  return data;
};

const ensureSlugAvailable = async (slug: string, excludeId?: string) => {
  const existingPage = await prisma.page.findUnique({
    where: { slug: normalizeSlug(slug) },
    select: { id: true },
  });

  if (existingPage && existingPage.id !== excludeId) {
    throw new ApiError(409, 'A page with this slug already exists.');
  }
};

export const listPages = async ({
  search,
  pagination,
}: ListPagesOptions = {}): Promise<PageListItem[] | PaginatedResult<PageListItem>> => {
  const where = buildPageSearchWhere(search);

  if (!pagination) {
    const pages = await prisma.page.findMany({
      where,
      select: publicPageSelect,
      orderBy: [{ updatedAt: 'desc' }],
    });

    return pages.map(mapPageToApi);
  }

  const [totalItems, pages] = await Promise.all([
    prisma.page.count({ where }),
    prisma.page.findMany({
      where,
      select: publicPageSelect,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
  ]);

  return buildPaginatedResult({
    items: pages.map(mapPageToApi),
    page: pagination.page,
    limit: pagination.limit,
    totalItems,
  });
};

export const getPageBySlug = async (slug: string) => {
  const page = await prisma.page.findFirst({
    where: {
      slug: normalizeSlug(slug),
      status: PublicationStatus.PUBLISHED,
    },
    select: publicPageSelect,
  });

  if (!page) {
    throw new ApiError(404, 'Published page not found.');
  }

  return mapPageToApi(page);
};

export const createPage = async (input: CreatePageInput) => {
  await ensureSlugAvailable(input.slug);

  const page = await prisma.page.create({
    data: buildPageData({
      ...input,
      pageType: input.pageType ?? PageType.CUSTOM,
    }) as Prisma.PageUncheckedCreateInput,
    select: publicPageSelect,
  });

  return mapPageToApi(page);
};

export const updatePage = async (id: string, input: UpdatePageInput) => {
  const existingPage = await prisma.page.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });

  if (!existingPage) {
    throw new ApiError(404, 'Page not found.');
  }

  if (input.slug) {
    await ensureSlugAvailable(input.slug, id);
  }

  const page = await prisma.page.update({
    where: { id },
    data: buildPageData(input) as Prisma.PageUncheckedUpdateInput,
    select: publicPageSelect,
  });

  return mapPageToApi(page);
};

export const deletePage = async (id: string) => {
  const existingPage = await prisma.page.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingPage) {
    throw new ApiError(404, 'Page not found.');
  }

  await prisma.page.delete({
    where: { id },
  });
};
