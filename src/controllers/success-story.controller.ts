import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { isPaginatedResult, resolvePaginationInput } from '../utils/pagination';
import { sendResponse } from '../utils/send-response';
import {
  createSuccessStory,
  deleteSuccessStory,
  listHomepageSuccessStories,
  listSuccessStories,
  updateSuccessStory,
} from '../services/success-story.service';

export const getSuccessStories = asyncHandler(async (req, res: Response) => {
  const successStories = await listSuccessStories({
    includeInactive: Boolean(req.user),
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    pagination: resolvePaginationInput({
      page: req.query.page,
      limit: req.query.limit,
    }),
  });

  sendResponse(res, 200, {
    success: true,
    message: 'Success stories retrieved successfully.',
    data: isPaginatedResult(successStories) ? successStories.items : successStories,
    pagination: isPaginatedResult(successStories) ? successStories.pagination : undefined,
  });
});

export const getHomepageSuccessStories = asyncHandler(async (_req, res: Response) => {
  const successStories = await listHomepageSuccessStories();

  sendResponse(res, 200, {
    success: true,
    message: 'Homepage success stories retrieved successfully.',
    data: successStories,
  });
});

export const createCmsSuccessStory = asyncHandler(async (req, res: Response) => {
  const successStory = await createSuccessStory(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'Success story created successfully.',
    data: successStory,
  });
});

export const updateCmsSuccessStory = asyncHandler(async (req, res: Response) => {
  const successStory = await updateSuccessStory(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Success story updated successfully.',
    data: successStory,
  });
});

export const deleteCmsSuccessStory = asyncHandler(async (req, res: Response) => {
  await deleteSuccessStory(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Success story deleted successfully.',
  });
});
