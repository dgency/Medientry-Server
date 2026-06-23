import { PageType, Prisma, PublicationStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { publicPageSelect } from '../utils/page-response';

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
    data.heroImage = normalizeNullableString(input.heroImage);
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
    data.ogImage = normalizeNullableString(input.ogImage);
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

export const listPages = async () => {
  return prisma.page.findMany({
    select: publicPageSelect,
    orderBy: [{ updatedAt: 'desc' }],
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

  return page;
};

export const createPage = async (input: CreatePageInput) => {
  await ensureSlugAvailable(input.slug);

  return prisma.page.create({
    data: buildPageData({
      ...input,
      pageType: input.pageType ?? PageType.CUSTOM,
    }) as Prisma.PageUncheckedCreateInput,
    select: publicPageSelect,
  });
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

  return prisma.page.update({
    where: { id },
    data: buildPageData(input) as Prisma.PageUncheckedUpdateInput,
    select: publicPageSelect,
  });
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
