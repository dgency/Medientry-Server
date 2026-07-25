import { Router } from 'express';

import { getPublicMedia, headPublicMedia } from '../controllers/public-media.controller';
import { validateRequest } from '../middlewares/validate-request';
import { publicMediaParamSchema } from '../validations/public-media.validation';

const router = Router();

router.head('/:id/:filename?', validateRequest(publicMediaParamSchema), headPublicMedia);
router.get('/:id/:filename?', validateRequest(publicMediaParamSchema), getPublicMedia);

export const publicMediaRouter = router;
