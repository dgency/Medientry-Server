import { SimpleStatus } from '@prisma/client';
import { z } from 'zod';

const mediaTypeFilters = ['all', 'image', 'svg', 'video', 'document', 'unknown'] as const;
const mediaSortValues = ['newest', 'oldest', 'name-asc', 'name-desc', 'largest', 'smallest'] as const;

export const listMediaSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(60).optional().default(30),
    search: z.string().trim().optional().default(''),
    type: z.enum(mediaTypeFilters).optional().default('all'),
    sort: z.enum(mediaSortValues).optional().default('newest'),
    status: z.enum([SimpleStatus.ACTIVE, SimpleStatus.INACTIVE, 'all']).optional().default('all'),
  }),
});

export const mediaAssetIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateMediaAssetSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().trim().min(1).optional().or(z.literal('')).transform((value) => value || null),
    altText: z.string().trim().optional().or(z.literal('')).transform((value) => value || null),
    caption: z.string().trim().optional().or(z.literal('')).transform((value) => value || null),
    status: z.enum([SimpleStatus.ACTIVE, SimpleStatus.INACTIVE]).optional(),
  }).refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'At least one media field is required.',
  }),
});

export type MediaTypeFilter = (typeof mediaTypeFilters)[number];
export type MediaSortValue = (typeof mediaSortValues)[number];
