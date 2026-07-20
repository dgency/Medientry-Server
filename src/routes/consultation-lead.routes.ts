import { Router } from 'express';

import {
  createPublicConsultationLead,
  deleteAdminConsultationLead,
  getAdminConsultationLead,
  getConsultationLeads,
  verifyPublicThankYouToken,
} from '../controllers/consultation-lead.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  consultationLeadIdParamSchema,
  createConsultationLeadSchema,
  verifyThankYouTokenSchema,
} from '../validations/consultation-lead.validation';

const router = Router();

router.post('/', validateRequest(createConsultationLeadSchema), createPublicConsultationLead);
router.post(
  '/thank-you/verify',
  validateRequest(verifyThankYouTokenSchema),
  verifyPublicThankYouToken,
);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.get('/', getConsultationLeads);
router.get('/:id', validateRequest(consultationLeadIdParamSchema), getAdminConsultationLead);
router.delete('/:id', validateRequest(consultationLeadIdParamSchema), deleteAdminConsultationLead);

export const consultationLeadRouter = router;
