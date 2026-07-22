import type { Response } from 'express';

import { listMediaAssets, updateMediaAsset } from '../services/media-asset.service';
import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';

export const getMediaAssets = asyncHandler(async (req, res: Response) => {
  const mediaAssets = await listMediaAssets({
    fileType: typeof req.query.fileType === 'string' ? (req.query.fileType as never) : undefined,
    status: typeof req.query.status === 'string' ? (req.query.status as never) : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
  });

  sendResponse(res, 200, {
    success: true,
    message: 'Media assets retrieved successfully.',
    data: mediaAssets,
  });
});

export const updateCmsMediaAsset = asyncHandler(async (req, res: Response) => {
  const mediaAsset = await updateMediaAsset(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Media asset updated successfully.',
    data: mediaAsset,
  });
});
