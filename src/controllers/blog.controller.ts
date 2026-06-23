import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  createBlog,
  deleteBlog,
  getBlogBySlug,
  listBlogs,
  updateBlog,
} from '../services/blog.service';

const parsePositiveIntegerQuery = (value: unknown, fallback: number) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getBlogs = asyncHandler(async (req, res: Response) => {
  const result = await listBlogs({
    includeUnpublished: Boolean(req.user),
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    category:
      typeof req.query.category === 'string' ? req.query.category : undefined,
    page: parsePositiveIntegerQuery(req.query.page, 1),
    pageSize: parsePositiveIntegerQuery(req.query.pageSize, 10),
  });

  sendResponse(res, 200, {
    success: true,
    message: 'Blogs retrieved successfully.',
    data: result,
  });
});

export const getBlogByPublicSlug = asyncHandler(async (req, res: Response) => {
  const blog = await getBlogBySlug(String(req.params.slug), Boolean(req.user));

  sendResponse(res, 200, {
    success: true,
    message: 'Blog retrieved successfully.',
    data: blog,
  });
});

export const createCmsBlog = asyncHandler(async (req, res: Response) => {
  const blog = await createBlog(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'Blog created successfully.',
    data: blog,
  });
});

export const updateCmsBlog = asyncHandler(async (req, res: Response) => {
  const blog = await updateBlog(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Blog updated successfully.',
    data: blog,
  });
});

export const deleteCmsBlog = asyncHandler(async (req, res: Response) => {
  await deleteBlog(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Blog deleted successfully.',
  });
});
