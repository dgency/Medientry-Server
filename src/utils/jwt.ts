import { randomUUID } from 'node:crypto';

import { UserRole } from '@prisma/client';
import type { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../config/env';

const accessTokenClaimsSchema = z
  .object({
    sub: z.string().uuid(),
    email: z.string().email(),
    role: z.nativeEnum(UserRole),
  });

const verifiedAccessTokenPayloadSchema = accessTokenClaimsSchema
  .extend({
    jti: z.string().uuid(),
    iat: z.number().int().optional(),
    exp: z.number().int().optional(),
  })
  .passthrough();

export type AccessTokenClaims = z.infer<typeof accessTokenClaimsSchema>;
export type VerifiedAccessTokenPayload = z.infer<typeof verifiedAccessTokenPayloadSchema>;

export const signAccessToken = (
  payload: AccessTokenClaims,
  options?: {
    expiresIn?: SignOptions['expiresIn'];
    jwtId?: string;
  },
) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: options?.expiresIn ?? (env.JWT_EXPIRES_IN as SignOptions['expiresIn']),
    jwtid: options?.jwtId ?? randomUUID(),
  });
};

export const verifyAccessToken = (token: string) => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  return verifiedAccessTokenPayloadSchema.parse(decoded);
};
