import { Prisma } from '@prisma/client';

import { normalizeMediaContentValue, resolvePublicMediaUrl } from './media-path';

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

type RawPublicBlog = Prisma.BlogGetPayload<{
  select: typeof publicBlogSelect;
}>;

export type PublicBlog = Omit<RawPublicBlog, 'featuredImage' | 'content' | 'ogImage'> & {
  featuredImage: string | null;
  content: RawPublicBlog['content'];
  ogImage: string | null;
};

export const mapBlogToApi = (blog: RawPublicBlog): PublicBlog => ({
  ...blog,
  featuredImage: resolvePublicMediaUrl(blog.featuredImage),
  content: normalizeMediaContentValue(blog.content, 'content'),
  ogImage: resolvePublicMediaUrl(blog.ogImage),
});
