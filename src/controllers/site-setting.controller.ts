import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  getSiteSetting,
  updateSiteSetting,
} from '../services/site-setting.service';

export const getGlobalSiteSetting = asyncHandler(async (_req, res: Response) => {
  const siteSetting = await getSiteSetting();

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
