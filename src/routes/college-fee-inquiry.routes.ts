import { Router } from 'express';

import {
  createPublicCollegeFeeInquiry,
  deleteAdminCollegeFeeInquiry,
  getAdminCollegeFeeInquiry,
  getCollegeFeeInquiries,
  markAdminCollegeFeeInquiryAsRead,
  markAdminCollegeFeeInquiryAsUnread,
  updateAdminCollegeFeeInquiry,
} from '../controllers/college-fee-inquiry.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  collegeFeeInquiryIdParamSchema,
  createCollegeFeeInquirySchema,
  listCollegeFeeInquiryQuerySchema,
  updateCollegeFeeInquirySchema,
} from '../validations/college-fee-inquiry.validation';

const router = Router();

router.post(
  '/',
  validateRequest(createCollegeFeeInquirySchema),
  createPublicCollegeFeeInquiry,
);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.get(
  '/',
  validateRequest(listCollegeFeeInquiryQuerySchema),
  getCollegeFeeInquiries,
);
router.get(
  '/:id',
  validateRequest(collegeFeeInquiryIdParamSchema),
  getAdminCollegeFeeInquiry,
);
router.patch(
  '/:id',
  validateRequest(updateCollegeFeeInquirySchema),
  updateAdminCollegeFeeInquiry,
);
router.patch(
  '/:id/read',
  validateRequest(collegeFeeInquiryIdParamSchema),
  markAdminCollegeFeeInquiryAsRead,
);
router.patch(
  '/:id/unread',
  validateRequest(collegeFeeInquiryIdParamSchema),
  markAdminCollegeFeeInquiryAsUnread,
);
router.delete(
  '/:id',
  validateRequest(collegeFeeInquiryIdParamSchema),
  deleteAdminCollegeFeeInquiry,
);

export const collegeFeeInquiryRouter = router;
