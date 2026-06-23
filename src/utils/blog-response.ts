import { Prisma } from '@prisma/client';

export const publicBlogSelect = Prisma.validator<Prisma.BlogSelect>()({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  content: true,
  category: true,
  author: true,
  isPinned: true,
  status: true,
  seoTitle: true,
  seoDescription: true,
  seoKeywords: true,
  ogImage: true,
  canonicalUrl: true,
  createdAt: true,
  updatedAt: true,
});

export type PublicBlog = Prisma.BlogGetPayload<{
  select: typeof publicBlogSelect;
}>;
