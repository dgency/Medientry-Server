import { Prisma, PublicationStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { publicBlogSelect } from '../utils/blog-response';

type CreateBlogInput = {
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  content?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  category?: string;
  author?: string;
  isPinned: boolean;
  status: PublicationStatus;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
};

type UpdateBlogInput = Partial<CreateBlogInput>;

type ListBlogsOptions = {
  includeUnpublished?: boolean;
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
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
const normalizeCategory = (category?: string) => category?.trim();

const buildBlogData = (
  input: CreateBlogInput | UpdateBlogInput,
): Prisma.BlogUncheckedCreateInput | Prisma.BlogUncheckedUpdateInput => {
  const data: Prisma.BlogUncheckedCreateInput | Prisma.BlogUncheckedUpdateInput = {};

  if ('title' in input && input.title !== undefined) {
    data.title = input.title.trim();
  }

  if ('slug' in input && input.slug !== undefined) {
    data.slug = normalizeSlug(input.slug);
  }

  if ('excerpt' in input) {
    data.excerpt = normalizeNullableString(input.excerpt);
  }

  if ('featuredImage' in input) {
    data.featuredImage = normalizeNullableString(input.featuredImage);
  }

  if ('content' in input) {
    data.content = input.content ?? Prisma.JsonNull;
  }

  if ('category' in input) {
    data.category = normalizeNullableString(input.category);
  }

  if ('author' in input) {
    data.author = normalizeNullableString(input.author);
  }

  if ('isPinned' in input && input.isPinned !== undefined) {
    data.isPinned = input.isPinned;
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

  return data;
};

const ensureSlugAvailable = async (slug: string, excludeId?: string) => {
  const existingBlog = await prisma.blog.findUnique({
    where: { slug: normalizeSlug(slug) },
    select: { id: true },
  });

  if (existingBlog && existingBlog.id !== excludeId) {
    throw new ApiError(409, 'A blog with this slug already exists.');
  }
};

export const listBlogs = async ({
  includeUnpublished = false,
  search,
  category,
  page = 1,
  pageSize = 10,
}: ListBlogsOptions = {}) => {
  const normalizedPage = Math.max(1, page);
  const normalizedPageSize = Math.min(50, Math.max(1, pageSize));
  const normalizedSearch = search?.trim();
  const normalizedCategory = normalizeCategory(category);

  const where: Prisma.BlogWhereInput = {
    ...(includeUnpublished ? {} : { status: PublicationStatus.PUBLISHED }),
    ...(normalizedCategory
      ? {
          category: {
            equals: normalizedCategory,
            mode: 'insensitive',
          },
        }
      : {}),
    ...(normalizedSearch
      ? {
          OR: [
            { title: { contains: normalizedSearch, mode: 'insensitive' } },
            { excerpt: { contains: normalizedSearch, mode: 'insensitive' } },
            { category: { contains: normalizedSearch, mode: 'insensitive' } },
            { author: { contains: normalizedSearch, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      select: publicBlogSelect,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize,
    }),
    prisma.blog.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalPages: Math.max(1, Math.ceil(total / normalizedPageSize)),
      search: normalizedSearch ?? null,
      category: normalizedCategory ?? null,
    },
  };
};

export const getBlogBySlug = async (
  slug: string,
  includeUnpublished = false,
) => {
  const blog = await prisma.blog.findFirst({
    where: {
      slug: normalizeSlug(slug),
      ...(includeUnpublished ? {} : { status: PublicationStatus.PUBLISHED }),
    },
    select: publicBlogSelect,
  });

  if (!blog) {
    throw new ApiError(404, 'Blog not found.');
  }

  return blog;
};

export const createBlog = async (input: CreateBlogInput) => {
  await ensureSlugAvailable(input.slug);

  return prisma.blog.create({
    data: buildBlogData(input) as Prisma.BlogUncheckedCreateInput,
    select: publicBlogSelect,
  });
};

export const updateBlog = async (id: string, input: UpdateBlogInput) => {
  const existingBlog = await prisma.blog.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingBlog) {
    throw new ApiError(404, 'Blog not found.');
  }

  if (input.slug) {
    await ensureSlugAvailable(input.slug, id);
  }

  return prisma.blog.update({
    where: { id },
    data: buildBlogData(input) as Prisma.BlogUncheckedUpdateInput,
    select: publicBlogSelect,
  });
};

export const deleteBlog = async (id: string) => {
  const existingBlog = await prisma.blog.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingBlog) {
    throw new ApiError(404, 'Blog not found.');
  }

  await prisma.blog.delete({
    where: { id },
  });
};
