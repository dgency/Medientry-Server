import type { Response } from 'express';

import {
  getMediaAssetUsageSummaries,
  bulkDeleteMediaAssets,
  deleteMediaAsset,
  listMediaAssets,
  updateMediaAsset,
} from '../services/media-asset.service';
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

export const getCmsMediaAssetUsageSummaries = asyncHandler(async (req, res: Response) => {
  const summaries = await getMediaAssetUsageSummaries(req.body.ids);

  sendResponse(res, 200, {
    success: true,
    message: 'Media asset usage retrieved successfully.',
    data: summaries,
  });
});

export const deleteCmsMediaAsset = asyncHandler(async (req, res: Response) => {
  const deletedMediaAsset = await deleteMediaAsset(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Media asset deleted successfully.',
    data: deletedMediaAsset,
  });
});

export const bulkDeleteCmsMediaAssets = asyncHandler(async (req, res: Response) => {
  const result = await bulkDeleteMediaAssets(req.body.ids);

  sendResponse(res, 200, {
    success: true,
    message:
      result.deletedCount === 1
        ? '1 media asset deleted successfully.'
        : `${result.deletedCount} media assets deleted successfully.`,
    data: result,
  });
});
