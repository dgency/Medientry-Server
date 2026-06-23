import { Router } from 'express';

import {
  createCmsStudyDestination,
  deleteCmsStudyDestination,
  getStudyDestinationByPublicSlug,
  getStudyDestinations,
  updateCmsStudyDestination,
} from '../controllers/study-destination.controller';
import { optionalAuth } from '../middlewares/optional-auth';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  createStudyDestinationSchema,
  studyDestinationIdParamSchema,
  studyDestinationSlugParamSchema,
  updateStudyDestinationSchema,
} from '../validations/study-destination.validation';

const router = Router();

router.get('/', optionalAuth, getStudyDestinations);
router.get(
  '/:slug',
  validateRequest(studyDestinationSlugParamSchema),
  getStudyDestinationByPublicSlug,
);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.post('/', validateRequest(createStudyDestinationSchema), createCmsStudyDestination);
router.put('/:id', validateRequest(updateStudyDestinationSchema), updateCmsStudyDestination);
router.delete('/:id', validateRequest(studyDestinationIdParamSchema), deleteCmsStudyDestination);

export const studyDestinationRouter = router;
