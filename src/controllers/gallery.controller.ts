import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  createGalleryItem,
  deleteGalleryItem,
  listGalleryItems,
  listHomepageGalleryItems,
  updateGalleryItem,
} from '../services/gallery.service';

export const getGalleryItems = asyncHandler(async (req, res: Response) => {
  const galleryItems = await listGalleryItems(Boolean(req.user));

  sendResponse(res, 200, {
    success: true,
    message: 'Gallery items retrieved successfully.',
    data: galleryItems,
  });
});

export const getHomepageGalleryItems = asyncHandler(async (_req, res: Response) => {
  const galleryItems = await listHomepageGalleryItems();

  sendResponse(res, 200, {
    success: true,
    message: 'Homepage gallery items retrieved successfully.',
    data: galleryItems,
  });
});

export const createCmsGalleryItem = asyncHandler(async (req, res: Response) => {
  const galleryItem = await createGalleryItem(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'Gallery item created successfully.',
    data: galleryItem,
  });
});

export const updateCmsGalleryItem = asyncHandler(async (req, res: Response) => {
  const galleryItem = await updateGalleryItem(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Gallery item updated successfully.',
    data: galleryItem,
  });
});

export const deleteCmsGalleryItem = asyncHandler(async (req, res: Response) => {
  await deleteGalleryItem(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Gallery item deleted successfully.',
  });
});
