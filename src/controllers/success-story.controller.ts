import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  createSuccessStory,
  deleteSuccessStory,
  listHomepageSuccessStories,
  listSuccessStories,
  updateSuccessStory,
} from '../services/success-story.service';

export const getSuccessStories = asyncHandler(async (req, res: Response) => {
  const successStories = await listSuccessStories(Boolean(req.user));

  sendResponse(res, 200, {
    success: true,
    message: 'Success stories retrieved successfully.',
    data: successStories,
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
