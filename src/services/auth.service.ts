import { UserStatus } from '@prisma/client';
import type { SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { signAccessToken, verifyAccessToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';
import { publicUserSelect } from '../utils/user-response';

type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export const loginUser = async ({ email, password, rememberMe = false }: LoginInput) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const passwordMatched = await comparePassword(password, user.password);

  if (!passwordMatched) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(403, 'This account is not active.');
  }

  const safeUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: publicUserSelect,
  });

  if (!safeUser) {
    throw new ApiError(404, 'User not found.');
  }

  const accessToken = signAccessToken(
    {
      sub: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    },
    {
      expiresIn: (rememberMe
        ? env.JWT_REMEMBER_EXPIRES_IN
        : env.JWT_EXPIRES_IN) as SignOptions['expiresIn'],
    },
  );
  const verifiedToken = verifyAccessToken(accessToken);
  const expiresAt = verifiedToken.exp ? new Date(verifiedToken.exp * 1000).toISOString() : null;

  return {
    accessToken,
    expiresAt,
    rememberMe,
    user: safeUser,
  };
};
