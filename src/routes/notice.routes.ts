import { Router } from 'express';

import {
  createCmsNotice,
  deleteCmsNotice,
  getNoticeByPublicSlug,
  getNotices,
  updateCmsNotice,
} from '../controllers/notice.controller';
import { optionalAuth } from '../middlewares/optional-auth';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  createNoticeSchema,
  noticeIdParamSchema,
  noticeSlugParamSchema,
  updateNoticeSchema,
} from '../validations/notice.validation';

const router = Router();

router.get('/', optionalAuth, getNotices);
router.get('/:slug', optionalAuth, validateRequest(noticeSlugParamSchema), getNoticeByPublicSlug);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.post('/', validateRequest(createNoticeSchema), createCmsNotice);
router.put('/:id', validateRequest(updateNoticeSchema), updateCmsNotice);
router.delete('/:id', validateRequest(noticeIdParamSchema), deleteCmsNotice);

export const noticeRouter = router;
