import { Router } from 'express';

import {
  createCmsHomeReel,
  deleteCmsHomeReel,
  getHomeReels,
  getHomepageHomeReels,
  updateCmsHomeReel,
} from '../controllers/home-reel.controller';
import { optionalAuth } from '../middlewares/optional-auth';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  createHomeReelSchema,
  homeReelIdParamSchema,
  updateHomeReelSchema,
} from '../validations/home-reel.validation';

const router = Router();

router.get('/homepage', getHomepageHomeReels);
router.get('/', optionalAuth, getHomeReels);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.post('/', validateRequest(createHomeReelSchema), createCmsHomeReel);
router.put('/:id', validateRequest(updateHomeReelSchema), updateCmsHomeReel);
router.delete('/:id', validateRequest(homeReelIdParamSchema), deleteCmsHomeReel);

export const homeReelRouter = router;
