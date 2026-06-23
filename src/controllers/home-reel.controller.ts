import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  createHomeReel,
  deleteHomeReel,
  listHomeReels,
  listHomepageHomeReels,
  updateHomeReel,
} from '../services/home-reel.service';

export const getHomeReels = asyncHandler(async (req, res: Response) => {
  const homeReels = await listHomeReels(Boolean(req.user));

  sendResponse(res, 200, {
    success: true,
    message: 'Home reels retrieved successfully.',
    data: homeReels,
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
