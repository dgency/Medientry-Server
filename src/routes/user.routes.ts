import { Router } from 'express';

import {
  createAdminUser,
  deleteAdminUser,
  getUsers,
  updateAdminUser,
} from '../controllers/user.controller';
import { requireAuth } from '../middlewares/require-auth';
import { requireRole, superAdminRoles } from '../middlewares/require-role';
import { validateRequest } from '../middlewares/validate-request';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from '../validations/user.validation';

const router = Router();

router.use(requireAuth, requireRole(superAdminRoles));

router.get('/', getUsers);
router.post('/', validateRequest(createUserSchema), createAdminUser);
router.patch('/:id', validateRequest(updateUserSchema), updateAdminUser);
router.delete('/:id', validateRequest(userIdParamSchema), deleteAdminUser);

export const userRouter = router;
