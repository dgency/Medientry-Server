import type { Response } from 'express';

import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';
import {
  buildAccessTokenCookieOptions,
  getAccessTokenCookieName,
} from '../utils/auth-token';
import { sendResponse } from '../utils/send-response';
import { loginUser } from '../services/auth.service';
import { revokeAccessToken } from '../services/revoked-access-token.service';

export const login = asyncHandler(async (req, res: Response) => {
  const result = await loginUser(req.body);
  const cookieExpiresAt = result.expiresAt ? new Date(result.expiresAt) : null;

  res.cookie(
    getAccessTokenCookieName(),
    result.accessToken,
    buildAccessTokenCookieOptions(cookieExpiresAt),
  );

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    token: result.accessToken,
    user: result.user,
    data: {
      token: result.accessToken,
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
      rememberMe: result.rememberMe,
      user: result.user,
    },
  });
});

export const getMe = asyncHandler(async (req, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication failed.');
  }

  sendResponse(res, 200, {
    success: true,
    message: 'Authenticated user profile retrieved successfully.',
    data: req.user,
  });
});

export const logout = asyncHandler(async (req, res: Response) => {
  if (req.authToken) {
    await revokeAccessToken(req.authToken, 'logout');
  }

  res.clearCookie(getAccessTokenCookieName(), buildAccessTokenCookieOptions());

  sendResponse(res, 200, {
    success: true,
    message: 'Logout successful.',
  });
});
