import { Router } from 'express';

import {
  createCmsPage,
  deleteCmsPage,
  getPageByPublicSlug,
  getPages,
  updateCmsPage,
} from '../controllers/page.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  createPageSchema,
  pageIdParamSchema,
  pageSlugParamSchema,
  updatePageSchema,
} from '../validations/page.validation';

const router = Router();

router.get('/:slug', validateRequest(pageSlugParamSchema), getPageByPublicSlug);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.get('/', getPages);
router.post('/', validateRequest(createPageSchema), createCmsPage);
router.put('/:id', validateRequest(updatePageSchema), updateCmsPage);
router.delete('/:id', validateRequest(pageIdParamSchema), deleteCmsPage);

export const pageRouter = router;
