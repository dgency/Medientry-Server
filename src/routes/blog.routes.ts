import { Router } from 'express';

import {
  createCmsBlog,
  deleteCmsBlog,
  getBlogByPublicSlug,
  getBlogs,
  updateCmsBlog,
} from '../controllers/blog.controller';
import { optionalAuth } from '../middlewares/optional-auth';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  blogIdParamSchema,
  blogSlugParamSchema,
  createBlogSchema,
  listBlogsQuerySchema,
  updateBlogSchema,
} from '../validations/blog.validation';

const router = Router();

router.get('/', optionalAuth, validateRequest(listBlogsQuerySchema), getBlogs);
router.get('/:slug', optionalAuth, validateRequest(blogSlugParamSchema), getBlogByPublicSlug);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.post('/', validateRequest(createBlogSchema), createCmsBlog);
router.put('/:id', validateRequest(updateBlogSchema), updateCmsBlog);
router.delete('/:id', validateRequest(blogIdParamSchema), deleteCmsBlog);

export const blogRouter = router;
