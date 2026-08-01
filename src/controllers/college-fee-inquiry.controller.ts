import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { resolvePaginationInput } from '../utils/pagination';
import { sendResponse } from '../utils/send-response';
import { signThankYouToken } from '../utils/thank-you-token';
import {
  createCollegeFeeInquiry,
  deleteCollegeFeeInquiry,
  getAdminCollegeFeeInquiryById,
  listCollegeFeeInquiries,
  markCollegeFeeInquiryAsRead,
  markCollegeFeeInquiryAsUnread,
  updateCollegeFeeInquiry,
} from '../services/college-fee-inquiry.service';

export const getCollegeFeeInquiries = asyncHandler(async (req, res: Response) => {
  const result = await listCollegeFeeInquiries({
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    status: typeof req.query.status === 'string' ? req.query.status as 'all' | 'read' | 'unread' : undefined,
    pagination: resolvePaginationInput({
      page: req.query.page,
      limit: req.query.limit,
      enabledByDefault: true,
    }),
  });

  sendResponse(res, 200, {
    success: true,
    message: 'College fee inquiries retrieved successfully.',
    data: Array.isArray(result) ? result : result.items,
    pagination: Array.isArray(result) ? undefined : result.pagination,
  });
});

export const getAdminCollegeFeeInquiry = asyncHandler(async (req, res: Response) => {
  const inquiry = await getAdminCollegeFeeInquiryById(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'College fee inquiry retrieved successfully.',
    data: inquiry,
  });
});

export const createPublicCollegeFeeInquiry = asyncHandler(async (req, res: Response) => {
  const inquiry = await createCollegeFeeInquiry(req.body);
  const thankYouToken = signThankYouToken({
    submissionId: inquiry.id,
    source: 'college-fee-inquiry',
  });

  sendResponse(res, 201, {
    success: true,
    message: 'College fee inquiry submitted successfully.',
    data: {
      inquiry,
      thankYouToken,
    },
  });
});

export const updateAdminCollegeFeeInquiry = asyncHandler(async (req, res: Response) => {
  const inquiry = await updateCollegeFeeInquiry(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'College fee inquiry updated successfully.',
    data: inquiry,
  });
});

export const deleteAdminCollegeFeeInquiry = asyncHandler(async (req, res: Response) => {
  await deleteCollegeFeeInquiry(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'College fee inquiry deleted successfully.',
  });
});

export const markAdminCollegeFeeInquiryAsRead = asyncHandler(async (req, res: Response) => {
  const inquiry = await markCollegeFeeInquiryAsRead(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'College fee inquiry marked as read successfully.',
    data: inquiry,
  });
});

export const markAdminCollegeFeeInquiryAsUnread = asyncHandler(async (req, res: Response) => {
  const inquiry = await markCollegeFeeInquiryAsUnread(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'College fee inquiry marked as unread successfully.',
    data: inquiry,
  });
});
