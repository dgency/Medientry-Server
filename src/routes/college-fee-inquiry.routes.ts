import { Router } from 'express';

import {
  createPublicCollegeFeeInquiry,
  deleteAdminCollegeFeeInquiry,
  getCollegeFeeInquiries,
  updateAdminCollegeFeeInquiry,
} from '../controllers/college-fee-inquiry.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  collegeFeeInquiryIdParamSchema,
  createCollegeFeeInquirySchema,
  updateCollegeFeeInquirySchema,
} from '../validations/college-fee-inquiry.validation';

const router = Router();

router.post(
  '/',
  validateRequest(createCollegeFeeInquirySchema),
  createPublicCollegeFeeInquiry,
);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.get('/', getCollegeFeeInquiries);
router.patch(
  '/:id',
  validateRequest(updateCollegeFeeInquirySchema),
  updateAdminCollegeFeeInquiry,
);
router.delete(
  '/:id',
  validateRequest(collegeFeeInquiryIdParamSchema),
  deleteAdminCollegeFeeInquiry,
);

export const collegeFeeInquiryRouter = router;
