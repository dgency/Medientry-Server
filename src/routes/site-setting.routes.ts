import { Router } from 'express';

import {
  getGlobalSiteSetting,
  putGlobalSiteSetting,
} from '../controllers/site-setting.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import { updateSiteSettingSchema } from '../validations/site-setting.validation';

const router = Router();

router.get('/', getGlobalSiteSetting);
router.put(
  '/',
  requireAuth,
  requireRole(cmsEditorRoles),
  validateRequest(updateSiteSettingSchema),
  putGlobalSiteSetting,
);

export const siteSettingRouter = router;
