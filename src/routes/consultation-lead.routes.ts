import { Router } from 'express';

import {
  createPublicConsultationLead,
  deleteAdminConsultationLead,
  getConsultationLeads,
} from '../controllers/consultation-lead.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  consultationLeadIdParamSchema,
  createConsultationLeadSchema,
} from '../validations/consultation-lead.validation';

const router = Router();

router.post('/', validateRequest(createConsultationLeadSchema), createPublicConsultationLead);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.get('/', getConsultationLeads);
router.delete('/:id', validateRequest(consultationLeadIdParamSchema), deleteAdminConsultationLead);

export const consultationLeadRouter = router;
