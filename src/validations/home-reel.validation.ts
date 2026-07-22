import { SimpleStatus } from '@prisma/client';
import { z } from 'zod';

import { nullableAssetUrlString } from './asset-url.validation';
import { extractYouTubeVideoId } from '../utils/youtube';

const imageThumbnailPattern = /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i;

const isSupportedThumbnailAsset = (value: string) => {
  try {
    const normalizedValue = value.trim();
    const parsedUrl = normalizedValue.startsWith('/')
      ? new URL(normalizedValue, 'https://medientry.local')
      : new URL(normalizedValue);

    return imageThumbnailPattern.test(parsedUrl.pathname);
  } catch {
    return false;
  }
};

const youtubeVideoUrlSchema = z
  .string()
  .trim()
  .min(1, 'YouTube Video URL is required.')
  .refine((value) => extractYouTubeVideoId(value) !== null, {
    message: 'Please enter a valid YouTube video or YouTube Shorts URL.',
  });

const homeReelThumbnailSchema = nullableAssetUrlString.refine(
  (value) => value === undefined || value === null || value === '' || isSupportedThumbnailAsset(value),
  {
    message: 'Please select a valid image thumbnail.',
  },
);

const baseHomeReelBodySchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters long.'),
  videoUrl: youtubeVideoUrlSchema,
  thumbnail: homeReelThumbnailSchema,
  sortOrder: z.coerce.number().int().min(0),
  status: z.nativeEnum(SimpleStatus),
});

export const createHomeReelSchema = z.object({
  body: baseHomeReelBodySchema,
});

export const updateHomeReelSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: baseHomeReelBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one home reel field is required.',
  }),
});

export const homeReelIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
