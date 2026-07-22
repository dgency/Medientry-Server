import { Router } from 'express';

import { getMediaAssets, updateCmsMediaAsset } from '../controllers/media-asset.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  listMediaAssetsQuerySchema,
  updateMediaAssetSchema,
} from '../validations/media-asset.validation';

const router = Router();

router.use(requireAuth, requireRole(cmsEditorRoles));

router.get('/', validateRequest(listMediaAssetsQuerySchema), getMediaAssets);
router.put('/:id', validateRequest(updateMediaAssetSchema), updateCmsMediaAsset);

export const mediaAssetRouter = router;
