import { Router } from 'express';

import {
  createPublicSuccessStoryShare,
  createCmsSuccessStory,
  deleteCmsSuccessStory,
  getHomepageSuccessStories,
  getSuccessStories,
  updateCmsSuccessStory,
} from '../controllers/success-story.controller';
import { optionalAuth } from '../middlewares/optional-auth';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  createSuccessStorySchema,
  shareSuccessStorySchema,
  successStoryIdParamSchema,
  updateSuccessStorySchema,
} from '../validations/success-story.validation';

const router = Router();

router.get('/homepage', getHomepageSuccessStories);
router.get('/', optionalAuth, getSuccessStories);
router.post('/share', validateRequest(shareSuccessStorySchema), createPublicSuccessStoryShare);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.post('/', validateRequest(createSuccessStorySchema), createCmsSuccessStory);
router.put('/:id', validateRequest(updateSuccessStorySchema), updateCmsSuccessStory);
router.delete('/:id', validateRequest(successStoryIdParamSchema), deleteCmsSuccessStory);

export const successStoryRouter = router;
