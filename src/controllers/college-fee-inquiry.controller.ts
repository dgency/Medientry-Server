import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  createCollegeFeeInquiry,
  deleteCollegeFeeInquiry,
  listCollegeFeeInquiries,
  updateCollegeFeeInquiry,
} from '../services/college-fee-inquiry.service';

export const getCollegeFeeInquiries = asyncHandler(async (_req, res: Response) => {
  const inquiries = await listCollegeFeeInquiries();

  sendResponse(res, 200, {
    success: true,
    message: 'College fee inquiries retrieved successfully.',
    data: inquiries,
  });
});

export const createPublicCollegeFeeInquiry = asyncHandler(async (req, res: Response) => {
  const inquiry = await createCollegeFeeInquiry(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'College fee inquiry submitted successfully.',
    data: inquiry,
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
