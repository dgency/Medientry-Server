import { Router } from 'express';

import { createUpload } from '../controllers/upload.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { uploadSingleFile } from '../middlewares/upload';
import { validateRequest } from '../middlewares/validate-request';
import { uploadSchema } from '../validations/upload.validation';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole(cmsEditorRoles),
  uploadSingleFile,
  validateRequest(uploadSchema),
  createUpload,
);

export const uploadRouter = router;
