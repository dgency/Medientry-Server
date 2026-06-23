import type { Request } from 'express';
import { UserStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { isAccessTokenRevoked } from '../services/revoked-access-token.service';
import { ApiError } from './api-error';
import { getAccessTokenFromRequest } from './auth-token';
import { verifyAccessToken } from './jwt';
import { publicUserSelect } from './user-response';

export const authenticateRequest = async (req: Request, options?: { optional?: boolean }) => {
  const token = getAccessTokenFromRequest(req);

  if (!token) {
    if (options?.optional) {
      return null;
    }

    throw new ApiError(401, 'Authentication token is required.');
  }

  const payload = verifyAccessToken(token);

  if (await isAccessTokenRevoked(payload.jti)) {
    throw new ApiError(401, 'Authentication token has been revoked.');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: publicUserSelect,
  });

  if (!user) {
    throw new ApiError(401, 'Authentication failed.');
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(403, 'This account is not active.');
  }

  req.user = user;
  req.authToken = token;
  req.authTokenPayload = payload;

  return user;
};
