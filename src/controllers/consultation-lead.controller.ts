import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/api-error';
import { sendResponse } from '../utils/send-response';
import { signThankYouToken, verifyThankYouToken } from '../utils/thank-you-token';
import {
  createConsultationLead,
  deleteConsultationLead,
  getAdminConsultationLeadById,
  listConsultationLeads,
} from '../services/consultation-lead.service';

export const getConsultationLeads = asyncHandler(async (_req, res: Response) => {
  const leads = await listConsultationLeads();

  sendResponse(res, 200, {
    success: true,
    message: 'Consultation leads retrieved successfully.',
    data: leads,
  });
});

export const createPublicConsultationLead = asyncHandler(async (req, res: Response) => {
  const lead = await createConsultationLead(req.body);
  const submissionSource =
    req.body?.submissionSource === 'contact' ? 'contact' : 'consultation';
  const thankYouToken = signThankYouToken({
    leadId: lead.id,
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
      leadId: payload.sub,
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
