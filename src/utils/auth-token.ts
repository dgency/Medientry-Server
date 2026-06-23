import type { CookieOptions, Request } from 'express';

import { env } from '../config/env';

const authCookieBaseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export const getAccessTokenFromRequest = (req: Request) => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader?.startsWith('Bearer ')) {
    const token = authorizationHeader.replace('Bearer ', '').trim();
    return token || null;
  }

  const cookieToken = req.cookies?.[env.AUTH_COOKIE_NAME];

  return typeof cookieToken === 'string' && cookieToken.trim() ? cookieToken.trim() : null;
};

export const buildAccessTokenCookieOptions = (expiresAt?: Date | null): CookieOptions => {
  if (!expiresAt) {
    return authCookieBaseOptions;
  }

  return {
    ...authCookieBaseOptions,
    expires: expiresAt,
  };
};

export const getAccessTokenCookieName = () => env.AUTH_COOKIE_NAME;
