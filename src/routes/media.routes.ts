import { Router } from 'express';

import { deleteMediaItem, getMediaItems, updateMediaItem } from '../controllers/media.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import { listMediaSchema, mediaAssetIdParamSchema, updateMediaAssetSchema } from '../validations/media.validation';

const router = Router();

router.use(requireAuth, requireRole(cmsEditorRoles));

router.get('/', validateRequest(listMediaSchema), getMediaItems);
router.patch('/:id', validateRequest(updateMediaAssetSchema), updateMediaItem);
router.delete('/:id', validateRequest(mediaAssetIdParamSchema), deleteMediaItem);

export const mediaRouter = router;
