import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  createConsultationLead,
  deleteConsultationLead,
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

  sendResponse(res, 201, {
    success: true,
    message: 'Consultation request submitted successfully.',
    data: lead,
  });
});

export const deleteAdminConsultationLead = asyncHandler(async (req, res: Response) => {
  await deleteConsultationLead(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Consultation lead deleted successfully.',
  });
});
