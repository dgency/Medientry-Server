import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  createPage,
  deletePage,
  getPageBySlug,
  listPages,
  updatePage,
} from '../services/page.service';

export const getPages = asyncHandler(async (_req, res: Response) => {
  const pages = await listPages();

  sendResponse(res, 200, {
    success: true,
    message: 'Pages retrieved successfully.',
    data: pages,
  });
});

export const getPageByPublicSlug = asyncHandler(async (req, res: Response) => {
  const page = await getPageBySlug(String(req.params.slug));

  sendResponse(res, 200, {
    success: true,
    message: 'Page retrieved successfully.',
    data: page,
  });
});

export const createCmsPage = asyncHandler(async (req, res: Response) => {
  const page = await createPage(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'Page created successfully.',
    data: page,
  });
});

export const updateCmsPage = asyncHandler(async (req, res: Response) => {
  const page = await updatePage(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Page updated successfully.',
    data: page,
  });
});

export const deleteCmsPage = asyncHandler(async (req, res: Response) => {
  await deletePage(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Page deleted successfully.',
  });
});
