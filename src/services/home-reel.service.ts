import { Prisma, SimpleStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { publicHomeReelSelect } from '../utils/home-reel-response';
import { getYouTubeVideoDetails } from '../utils/youtube';

type CreateHomeReelInput = {
  title: string;
  videoUrl: string;
  sortOrder: number;
  status: SimpleStatus;
};

type UpdateHomeReelInput = Partial<CreateHomeReelInput>;

const buildHomeReelData = (
  input: CreateHomeReelInput | UpdateHomeReelInput,
): Prisma.HomeReelUncheckedCreateInput | Prisma.HomeReelUncheckedUpdateInput => {
  const data:
    | Prisma.HomeReelUncheckedCreateInput
    | Prisma.HomeReelUncheckedUpdateInput = {};

  if ('title' in input && input.title !== undefined) {
    data.title = input.title.trim();
  }

  if ('videoUrl' in input && input.videoUrl !== undefined) {
    const videoDetails = getYouTubeVideoDetails(input.videoUrl);

    if (!videoDetails) {
      throw new ApiError(400, 'Please enter a valid YouTube video or YouTube Shorts URL.');
    }

    data.videoUrl = videoDetails.normalizedUrl;
    data.youtubeVideoId = videoDetails.videoId;
  }

  if ('sortOrder' in input && input.sortOrder !== undefined) {
    data.sortOrder = input.sortOrder;
  }

  if ('status' in input && input.status !== undefined) {
    data.status = input.status;
  }

  return data;
};

export const listHomeReels = async (includeInactive = false) => {
  return prisma.homeReel.findMany({
    where: includeInactive ? undefined : { status: SimpleStatus.ACTIVE },
    select: publicHomeReelSelect,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
};

export const listHomepageHomeReels = async () => {
  return prisma.homeReel.findMany({
    where: {
      status: SimpleStatus.ACTIVE,
      videoUrl: { not: null },
      youtubeVideoId: { not: null },
    },
    select: publicHomeReelSelect,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
};

export const createHomeReel = async (input: CreateHomeReelInput) => {
  return prisma.homeReel.create({
    data: buildHomeReelData(input) as Prisma.HomeReelUncheckedCreateInput,
    select: publicHomeReelSelect,
  });
};

export const updateHomeReel = async (id: string, input: UpdateHomeReelInput) => {
  const existingHomeReel = await prisma.homeReel.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingHomeReel) {
    throw new ApiError(404, 'Home reel not found.');
  }

  return prisma.homeReel.update({
    where: { id },
    data: buildHomeReelData(input) as Prisma.HomeReelUncheckedUpdateInput,
    select: publicHomeReelSelect,
  });
};

export const deleteHomeReel = async (id: string) => {
  const existingHomeReel = await prisma.homeReel.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingHomeReel) {
    throw new ApiError(404, 'Home reel not found.');
  }

  await prisma.homeReel.delete({
    where: { id },
  });
};
