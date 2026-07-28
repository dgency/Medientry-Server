import { Prisma } from '@prisma/client';

import { normalizeMediaContentValue, resolvePublicMediaUrl } from './media-path';

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

type RawPublicPage = Prisma.PageGetPayload<{
  select: typeof publicPageSelect;
}>;

export type PublicPage = Omit<RawPublicPage, 'heroImage' | 'content' | 'ogImage'> & {
  heroImage: string | null;
  content: RawPublicPage['content'];
  ogImage: string | null;
};

export const mapPageToApi = (page: RawPublicPage): PublicPage => ({
  ...page,
  heroImage: resolvePublicMediaUrl(page.heroImage),
  content: normalizeMediaContentValue(page.content, 'content'),
  ogImage: resolvePublicMediaUrl(page.ogImage) ?? resolvePublicMediaUrl(page.heroImage),
});
