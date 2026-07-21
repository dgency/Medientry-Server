import type { Response } from 'express';

import {
  deleteMediaAsset,
  listMediaItems,
  updateMediaAssetMetadata,
} from '../services/media.service';
import { mapMediaAssetToListItem } from '../utils/media-response';
import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';

export const getMediaItems = asyncHandler(async (req, res: Response) => {
  const result = await listMediaItems({
    page: Number(req.query.page ?? 1),
    pageSize: Number(req.query.pageSize ?? 30),
    search: String(req.query.search ?? ''),
    type: String(req.query.type ?? 'all') as Parameters<typeof listMediaItems>[0]['type'],
    sort: String(req.query.sort ?? 'newest') as Parameters<typeof listMediaItems>[0]['sort'],
    status: String(req.query.status ?? 'all') as Parameters<typeof listMediaItems>[0]['status'],
  });

  sendResponse(res, 200, {
    success: true,
    message: 'Media items retrieved successfully.',
    data: result,
  });
});

export const updateMediaItem = asyncHandler(async (req, res: Response) => {
  const mediaItem = await updateMediaAssetMetadata(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Media item updated successfully.',
    data: mapMediaAssetToListItem(mediaItem),
  });
});

export const deleteMediaItem = asyncHandler(async (req, res: Response) => {
  await deleteMediaAsset(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Media item deleted successfully.',
  });
});
