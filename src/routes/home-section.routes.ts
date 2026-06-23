import { Router } from 'express';

import { getHomeSections, putHomeSection } from '../controllers/home-section.controller';
import { optionalAuth } from '../middlewares/optional-auth';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import { updateHomeSectionSchema } from '../validations/home-section.validation';

const router = Router();

router.get('/', optionalAuth, getHomeSections);
router.put(
  '/:sectionKey',
  requireAuth,
  requireRole(cmsEditorRoles),
  validateRequest(updateHomeSectionSchema),
  putHomeSection,
);

export const homeSectionRouter = router;
