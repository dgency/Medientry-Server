import { Prisma, PublicationStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { mapNoticeToApi, publicNoticeSelect } from '../utils/notice-response';

type CreateNoticeInput = {
  title: string;
  slug: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  isPinned: boolean;
  publishedAt?: Date | null;
  status: PublicationStatus;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
};

type UpdateNoticeInput = Partial<CreateNoticeInput>;

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

const resolveNoticeBody = (input: { description?: string; content?: string }) => {
  if (input.content !== undefined) {
    return normalizeNullableString(input.content);
  }

  return normalizeNullableString(input.description);
};

const ensureSlugAvailable = async (slug: string, excludeId?: string) => {
  const existingNotice = await prisma.notice.findUnique({
    where: { slug: normalizeSlug(slug) },
    select: { id: true },
  });

  if (existingNotice && existingNotice.id !== excludeId) {
    throw new ApiError(409, 'A notice with this slug already exists.');
  }
};

const resequencePinnedNotices = async (
  tx: Prisma.TransactionClient,
  excludeNoticeId?: string,
) => {
  const pinnedNotices = await tx.notice.findMany({
    where: {
      isPinned: true,
      ...(excludeNoticeId ? { id: { not: excludeNoticeId } } : {}),
    },
    orderBy: [{ pinnedOrder: 'asc' }, { updatedAt: 'asc' }],
    select: { id: true },
  });

  await Promise.all(
    pinnedNotices.map((notice, index) =>
      tx.notice.update({
        where: { id: notice.id },
        data: { pinnedOrder: index + 1 },
      }),
    ),
  );
};

const assignPinnedSlot = async (
  tx: Prisma.TransactionClient,
  noticeId?: string,
) => {
  const pinnedNotices = await tx.notice.findMany({
    where: {
      isPinned: true,
      ...(noticeId ? { id: { not: noticeId } } : {}),
    },
    orderBy: [{ pinnedOrder: 'asc' }, { updatedAt: 'asc' }],
    select: { pinnedOrder: true },
  });

  if (pinnedNotices.length >= 2) {
    throw new ApiError(400, 'Only 2 notices can be pinned at a time.');
  }

  const usedOrders = new Set(
    pinnedNotices
      .map((notice) => notice.pinnedOrder)
      .filter((value): value is number => value !== null),
  );

  return usedOrders.has(1) ? 2 : 1;
};

const buildNoticeData = async (
  tx: Prisma.TransactionClient,
  input: CreateNoticeInput | UpdateNoticeInput,
  existingNotice?: {
    id: string;
    isPinned: boolean;
    pinnedOrder: number | null;
    publishedAt: Date | null;
    status: PublicationStatus;
  },
): Promise<Prisma.NoticeUncheckedCreateInput | Prisma.NoticeUncheckedUpdateInput> => {
  const data: Prisma.NoticeUncheckedCreateInput | Prisma.NoticeUncheckedUpdateInput = {};

  if ('title' in input && input.title !== undefined) {
    data.title = input.title.trim();
  }

  if ('slug' in input && input.slug !== undefined) {
    data.slug = normalizeSlug(input.slug);
  }

  if ('description' in input || 'content' in input) {
    data.description = resolveNoticeBody(input);
  }

  if ('fileUrl' in input) {
    data.fileUrl = normalizeNullableString(input.fileUrl);
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

  const nextStatus =
    'status' in input && input.status !== undefined
      ? input.status
      : existingNotice?.status;

  if (nextStatus !== undefined) {
    data.status = nextStatus;
  }

  const explicitPublishedAt =
    'publishedAt' in input ? input.publishedAt ?? null : undefined;

  if (nextStatus === PublicationStatus.PUBLISHED) {
    data.publishedAt =
      explicitPublishedAt === undefined
        ? existingNotice?.publishedAt ?? new Date()
        : explicitPublishedAt ?? new Date();
  } else if ('publishedAt' in input || nextStatus === PublicationStatus.DRAFT) {
    data.publishedAt = explicitPublishedAt ?? null;
  }

  if ('isPinned' in input && input.isPinned !== undefined) {
    if (input.isPinned) {
      data.isPinned = true;

      if (existingNotice?.isPinned && existingNotice.pinnedOrder) {
        data.pinnedOrder = existingNotice.pinnedOrder;
      } else {
        data.pinnedOrder = await assignPinnedSlot(tx, existingNotice?.id);
      }
    } else {
      data.isPinned = false;
      data.pinnedOrder = null;
    }
  }

  return data;
};

export const listNotices = async (includeUnpublished = false) => {
  const notices = await prisma.notice.findMany({
    where: includeUnpublished ? undefined : { status: PublicationStatus.PUBLISHED },
    select: publicNoticeSelect,
    orderBy: [
      { isPinned: 'desc' },
      { pinnedOrder: 'asc' },
      { publishedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return notices.map(mapNoticeToApi);
};

export const getNoticeBySlug = async (
  slug: string,
  includeUnpublished = false,
) => {
  const notice = await prisma.notice.findFirst({
    where: {
      slug: normalizeSlug(slug),
      ...(includeUnpublished ? {} : { status: PublicationStatus.PUBLISHED }),
    },
    select: publicNoticeSelect,
  });

  if (!notice) {
    throw new ApiError(404, 'Notice not found.');
  }

  return mapNoticeToApi(notice);
};

export const createNotice = async (input: CreateNoticeInput) => {
  await ensureSlugAvailable(input.slug);

  const notice = await prisma.$transaction(async (tx) => {
    const data = await buildNoticeData(tx, input);

    const createdNotice = await tx.notice.create({
      data: data as Prisma.NoticeUncheckedCreateInput,
      select: publicNoticeSelect,
    });

    await resequencePinnedNotices(tx);

    const refreshedNotice = await tx.notice.findUniqueOrThrow({
      where: { id: createdNotice.id },
      select: publicNoticeSelect,
    });

    return refreshedNotice;
  });

  return mapNoticeToApi(notice);
};

export const updateNotice = async (id: string, input: UpdateNoticeInput) => {
  const existingNotice = await prisma.notice.findUnique({
    where: { id },
    select: {
      id: true,
      isPinned: true,
      pinnedOrder: true,
      publishedAt: true,
      status: true,
    },
  });

  if (!existingNotice) {
    throw new ApiError(404, 'Notice not found.');
  }

  if (input.slug) {
    await ensureSlugAvailable(input.slug, id);
  }

  const notice = await prisma.$transaction(async (tx) => {
    const data = await buildNoticeData(tx, input, existingNotice);

    const updatedNotice = await tx.notice.update({
      where: { id },
      data: data as Prisma.NoticeUncheckedUpdateInput,
      select: publicNoticeSelect,
    });

    await resequencePinnedNotices(tx);

    const refreshedNotice = await tx.notice.findUniqueOrThrow({
      where: { id: updatedNotice.id },
      select: publicNoticeSelect,
    });

    return refreshedNotice;
  });

  return mapNoticeToApi(notice);
};

export const deleteNotice = async (id: string) => {
  const existingNotice = await prisma.notice.findUnique({
    where: { id },
    select: { id: true, isPinned: true },
  });

  if (!existingNotice) {
    throw new ApiError(404, 'Notice not found.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.notice.delete({
      where: { id },
    });

    if (existingNotice.isPinned) {
      await resequencePinnedNotices(tx, id);
    }
  });
};
