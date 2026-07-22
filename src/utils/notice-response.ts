import { Prisma } from '@prisma/client';

import { normalizeMediaContentValue, resolvePublicMediaUrl } from './media-path';

export const publicNoticeSelect = Prisma.validator<Prisma.NoticeSelect>()({
  id: true,
  title: true,
  slug: true,
  description: true,
  fileUrl: true,
  isPinned: true,
  pinnedOrder: true,
  publishedAt: true,
  status: true,
  seoTitle: true,
  seoDescription: true,
  seoKeywords: true,
  ogImage: true,
  canonicalUrl: true,
  createdAt: true,
  updatedAt: true,
});

type RawNotice = Prisma.NoticeGetPayload<{
  select: typeof publicNoticeSelect;
}>;

export type PublicNotice = Omit<RawNotice, 'description' | 'fileUrl' | 'ogImage'> & {
  description: string | null;
  content: string | null;
  fileUrl: string | null;
  ogImage: string | null;
  hasFile: boolean;
};

export const mapNoticeToApi = (notice: RawNotice): PublicNotice => {
  const resolvedFileUrl = resolvePublicMediaUrl(notice.fileUrl);

  return {
    ...notice,
    description: normalizeMediaContentValue(notice.description, 'description'),
    content: normalizeMediaContentValue(notice.description, 'content'),
    fileUrl: resolvedFileUrl,
    ogImage: resolvePublicMediaUrl(notice.ogImage),
    hasFile: Boolean(resolvedFileUrl),
  };
};
