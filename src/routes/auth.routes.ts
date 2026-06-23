import { Router } from 'express';

import { getMe, login, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/require-auth';
import { validateRequest } from '../middlewares/validate-request';
import { loginSchema } from '../validations/auth.validation';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

export const authRouter = router;
