import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/api-error';
import { resolvePaginationInput } from '../utils/pagination';
import { sendResponse } from '../utils/send-response';
import { signThankYouToken, verifyThankYouToken } from '../utils/thank-you-token';
import {
  createConsultationLead,
  deleteConsultationLead,
  getAdminConsultationLeadById,
  listConsultationLeads,
  markConsultationLeadAsRead,
  markConsultationLeadAsUnread,
} from '../services/consultation-lead.service';

export const getConsultationLeads = asyncHandler(async (req, res: Response) => {
  const result = await listConsultationLeads({
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    status: typeof req.query.status === 'string' ? (req.query.status as 'all' | 'read' | 'unread') : undefined,
    pagination: resolvePaginationInput({
      page: req.query.page,
      limit: req.query.limit,
      enabledByDefault: true,
    }),
  });

  sendResponse(res, 200, {
    success: true,
    message: 'Consultation leads retrieved successfully.',
    data: Array.isArray(result) ? result : result.items,
    pagination: Array.isArray(result) ? undefined : result.pagination,
  });
});

export const createPublicConsultationLead = asyncHandler(async (req, res: Response) => {
  const lead = await createConsultationLead(req.body);
  const submissionSource =
    req.body?.submissionSource === 'contact' ? 'contact' : 'consultation';
  const thankYouToken = signThankYouToken({
    submissionId: lead.id,
    source: submissionSource,
  });

  sendResponse(res, 201, {
    success: true,
    message: 'Consultation request submitted successfully.',
    data: {
      lead,
      thankYouToken,
    },
  });
});

export const getAdminConsultationLead = asyncHandler(async (req, res: Response) => {
  const lead = await getAdminConsultationLeadById(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Consultation lead retrieved successfully.',
    data: lead,
  });
});

export const verifyPublicThankYouToken = asyncHandler(async (req, res: Response) => {
  const token =
    typeof req.body?.token === 'string' ? req.body.token.trim() : '';

  if (!token) {
    throw new ApiError(400, 'Thank-you token is required.');
  }

  let payload;

  try {
    payload = verifyThankYouToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired thank-you token.');
  }

  sendResponse(res, 200, {
    success: true,
    message: 'Thank-you token verified successfully.',
    data: {
      submissionId: payload.sub,
      source: payload.source,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    },
  });
});

export const deleteAdminConsultationLead = asyncHandler(async (req, res: Response) => {
  await deleteConsultationLead(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Consultation lead deleted successfully.',
  });
});

export const markAdminConsultationLeadAsRead = asyncHandler(async (req, res: Response) => {
  const lead = await markConsultationLeadAsRead(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Consultation lead marked as read successfully.',
    data: lead,
  });
});

export const markAdminConsultationLeadAsUnread = asyncHandler(async (req, res: Response) => {
  const lead = await markConsultationLeadAsUnread(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Consultation lead marked as unread successfully.',
    data: lead,
  });
});
