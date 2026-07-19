import { randomUUID } from 'node:crypto';

import type { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../config/env';

const THANK_YOU_TOKEN_EXPIRES_IN = '15m';

const thankYouSourceSchema = z.enum(['consultation', 'contact']);

const thankYouTokenClaimsSchema = z.object({
  sub: z.string().uuid(),
  purpose: z.literal('thank-you'),
  source: thankYouSourceSchema,
});

const verifiedThankYouTokenPayloadSchema = thankYouTokenClaimsSchema
  .extend({
    jti: z.string().uuid(),
    iat: z.number().int().optional(),
    exp: z.number().int().optional(),
  })
  .passthrough();

export type ThankYouSource = z.infer<typeof thankYouSourceSchema>;
export type VerifiedThankYouTokenPayload = z.infer<
  typeof verifiedThankYouTokenPayloadSchema
>;

export const signThankYouToken = (
  payload: {
    leadId: string;
    source: ThankYouSource;
  },
  options?: {
    expiresIn?: SignOptions['expiresIn'];
    jwtId?: string;
  },
) =>
  jwt.sign(
    {
      sub: payload.leadId,
      purpose: 'thank-you',
      source: payload.source,
    },
    env.JWT_SECRET,
    {
      expiresIn:
        options?.expiresIn ??
        (THANK_YOU_TOKEN_EXPIRES_IN as SignOptions['expiresIn']),
      jwtid: options?.jwtId ?? randomUUID(),
    },
  );

export const verifyThankYouToken = (token: string) => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  return verifiedThankYouTokenPayloadSchema.parse(decoded);
};
