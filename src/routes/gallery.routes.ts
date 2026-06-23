import { Router } from 'express';

import {
  createCmsGalleryItem,
  deleteCmsGalleryItem,
  getGalleryItems,
  getHomepageGalleryItems,
  updateCmsGalleryItem,
} from '../controllers/gallery.controller';
import { optionalAuth } from '../middlewares/optional-auth';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  createGalleryItemSchema,
  galleryItemIdParamSchema,
  updateGalleryItemSchema,
} from '../validations/gallery.validation';

const router = Router();

router.get('/homepage', getHomepageGalleryItems);
router.get('/', optionalAuth, getGalleryItems);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.post('/', validateRequest(createGalleryItemSchema), createCmsGalleryItem);
router.put('/:id', validateRequest(updateGalleryItemSchema), updateCmsGalleryItem);
router.delete('/:id', validateRequest(galleryItemIdParamSchema), deleteCmsGalleryItem);

export const galleryRouter = router;
