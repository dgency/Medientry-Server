import { Router } from 'express';

import {
  createCmsMedicalCollege,
  deleteCmsMedicalCollege,
  getHomepageFeaturedMedicalColleges,
  getMedicalCollegeByPublicSlug,
  getMedicalColleges,
  updateCmsMedicalCollege,
} from '../controllers/medical-college.controller';
import { optionalAuth } from '../middlewares/optional-auth';
import { requireAuth } from '../middlewares/require-auth';
import { cmsEditorRoles, requireRole } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  createMedicalCollegeSchema,
  medicalCollegeIdParamSchema,
  medicalCollegeSlugParamSchema,
  updateMedicalCollegeSchema,
} from '../validations/medical-college.validation';

const router = Router();

router.get('/homepage/featured', getHomepageFeaturedMedicalColleges);
router.get('/', optionalAuth, getMedicalColleges);
router.get(
  '/:slug',
  optionalAuth,
  validateRequest(medicalCollegeSlugParamSchema),
  getMedicalCollegeByPublicSlug,
);

router.use(requireAuth, requireRole(cmsEditorRoles));

router.post('/', validateRequest(createMedicalCollegeSchema), createCmsMedicalCollege);
router.put('/:id', validateRequest(updateMedicalCollegeSchema), updateCmsMedicalCollege);
router.delete('/:id', validateRequest(medicalCollegeIdParamSchema), deleteCmsMedicalCollege);

export const medicalCollegeRouter = router;
