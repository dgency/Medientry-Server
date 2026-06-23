import { prisma } from '../config/prisma';
import { verifyAccessToken } from '../utils/jwt';

export const isAccessTokenRevoked = async (jti: string) => {
  const revokedToken = await prisma.revokedAccessToken.findUnique({
    where: { jti },
    select: { jti: true },
  });

  return Boolean(revokedToken);
};

export const revokeAccessToken = async (token: string, reason = 'logout') => {
  const payload = verifyAccessToken(token);

  if (!payload.exp) {
    return payload;
  }

  await prisma.revokedAccessToken.upsert({
    where: { jti: payload.jti },
    update: {
      expiresAt: new Date(payload.exp * 1000),
      reason,
    },
    create: {
      jti: payload.jti,
      userId: payload.sub,
      expiresAt: new Date(payload.exp * 1000),
      reason,
    },
  });

  return payload;
};
