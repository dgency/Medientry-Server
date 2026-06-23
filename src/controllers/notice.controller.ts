import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  createNotice,
  deleteNotice,
  getNoticeBySlug,
  listNotices,
  updateNotice,
} from '../services/notice.service';

export const getNotices = asyncHandler(async (req, res: Response) => {
  const notices = await listNotices(Boolean(req.user));

  sendResponse(res, 200, {
    success: true,
    message: 'Notices retrieved successfully.',
    data: notices,
  });
});

export const getNoticeByPublicSlug = asyncHandler(async (req, res: Response) => {
  const notice = await getNoticeBySlug(String(req.params.slug), Boolean(req.user));

  sendResponse(res, 200, {
    success: true,
    message: 'Notice retrieved successfully.',
    data: notice,
  });
});

export const createCmsNotice = asyncHandler(async (req, res: Response) => {
  const notice = await createNotice(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'Notice created successfully.',
    data: notice,
  });
});

export const updateCmsNotice = asyncHandler(async (req, res: Response) => {
  const notice = await updateNotice(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Notice updated successfully.',
    data: notice,
  });
});

export const deleteCmsNotice = asyncHandler(async (req, res: Response) => {
  await deleteNotice(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Notice deleted successfully.',
  });
});
