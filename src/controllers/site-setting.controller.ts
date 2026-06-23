import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  getDefaultSiteSetting,
  getSiteSetting,
  updateSiteSetting,
} from '../services/site-setting.service';

export const getGlobalSiteSetting = asyncHandler(async (_req, res: Response) => {
  let siteSetting = getDefaultSiteSetting();

  try {
    siteSetting = await getSiteSetting();
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown site settings error.';
    console.warn(
      `[site-settings] Falling back to default public site settings because the API store is unavailable (${reason}).`,
    );
  }

  sendResponse(res, 200, {
    success: true,
    message: 'Site settings retrieved successfully.',
    data: siteSetting,
  });
});

export const putGlobalSiteSetting = asyncHandler(async (req, res: Response) => {
  const siteSetting = await updateSiteSetting(req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Site settings updated successfully.',
    data: siteSetting,
  });
});
