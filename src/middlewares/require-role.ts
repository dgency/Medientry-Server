import type { RequestHandler } from 'express';
import { UserRole } from '@prisma/client';

import { ApiError } from '../utils/api-error';

export const cmsEditorRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
export const superAdminRoles = [UserRole.SUPER_ADMIN];

export const requireRole =
  (allowedRoles: readonly UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication failed.'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ApiError(403, 'You do not have permission to perform this action.'));
      return;
    }

    next();
  };
