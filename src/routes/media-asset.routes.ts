import { Router } from 'express';

import {
  bulkDeleteCmsMediaAssets,
  deleteCmsMediaAsset,
  getCmsMediaAssetUsageSummaries,
  getMediaAssets,
  updateCmsMediaAsset,
} from '../controllers/media-asset.controller';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  bulkDeleteMediaAssetsSchema,
  listMediaAssetsQuerySchema,
  mediaAssetIdParamSchema,
  mediaAssetUsageSummarySchema,
  updateMediaAssetSchema,
} from '../validations/media-asset.validation';

const router = Router();

router.use(requireAuth, requireRole(cmsEditorRoles));

router.get('/', validateRequest(listMediaAssetsQuerySchema), getMediaAssets);
router.post('/usage-summary', validateRequest(mediaAssetUsageSummarySchema), getCmsMediaAssetUsageSummaries);
router.post('/bulk-delete', validateRequest(bulkDeleteMediaAssetsSchema), bulkDeleteCmsMediaAssets);
router.put('/:id', validateRequest(updateMediaAssetSchema), updateCmsMediaAsset);
router.delete('/:id', validateRequest(mediaAssetIdParamSchema), deleteCmsMediaAsset);

export const mediaAssetRouter = router;
