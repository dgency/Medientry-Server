import { Prisma } from '@prisma/client';

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

export type PublicNotice = Omit<RawNotice, 'description'> & {
  description: string | null;
  content: string | null;
  hasFile: boolean;
};

export const mapNoticeToApi = (notice: RawNotice): PublicNotice => {
  return {
    ...notice,
    description: notice.description,
    content: notice.description,
    hasFile: Boolean(notice.fileUrl),
  };
};
