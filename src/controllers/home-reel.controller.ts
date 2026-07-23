import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { isPaginatedResult, resolvePaginationInput } from '../utils/pagination';
import { sendResponse } from '../utils/send-response';
import {
  createHomeReel,
  deleteHomeReel,
  listHomeReels,
  listHomepageHomeReels,
  updateHomeReel,
} from '../services/home-reel.service';

export const getHomeReels = asyncHandler(async (req, res: Response) => {
  const homeReels = await listHomeReels({
    includeInactive: Boolean(req.user),
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    pagination: resolvePaginationInput({
      page: req.query.page,
      limit: req.query.limit,
    }),
  });

  sendResponse(res, 200, {
    success: true,
    message: 'Home reels retrieved successfully.',
    data: isPaginatedResult(homeReels) ? homeReels.items : homeReels,
    pagination: isPaginatedResult(homeReels) ? homeReels.pagination : undefined,
  });
});

export const getHomepageHomeReels = asyncHandler(async (_req, res: Response) => {
  const homeReels = await listHomepageHomeReels();

  sendResponse(res, 200, {
    success: true,
    message: 'Homepage home reels retrieved successfully.',
    data: homeReels,
  });
});

export const createCmsHomeReel = asyncHandler(async (req, res: Response) => {
  const homeReel = await createHomeReel(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'Home reel created successfully.',
    data: homeReel,
  });
});

export const updateCmsHomeReel = asyncHandler(async (req, res: Response) => {
  const homeReel = await updateHomeReel(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Home reel updated successfully.',
    data: homeReel,
  });
});

export const deleteCmsHomeReel = asyncHandler(async (req, res: Response) => {
  await deleteHomeReel(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Home reel deleted successfully.',
  });
});
