import { Prisma } from '@prisma/client';

export const publicPageSelect = Prisma.validator<Prisma.PageSelect>()({
  id: true,
  title: true,
  slug: true,
  pageType: true,
  templateType: true,
  status: true,
  heroTitle: true,
  heroSubtitle: true,
  heroImage: true,
  content: true,
  seoTitle: true,
  seoDescription: true,
  seoKeywords: true,
  ogImage: true,
  canonicalUrl: true,
  createdAt: true,
  updatedAt: true,
});

export type PublicPage = Prisma.PageGetPayload<{
  select: typeof publicPageSelect;
}>;
