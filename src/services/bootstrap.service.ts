import { UserRole, UserStatus } from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';

export const ensureDefaultSuperAdmin = async () => {
  if (!env.SEED_SUPER_ADMIN_PASSWORD) {
    console.warn(
      '[bootstrap] SEED_SUPER_ADMIN_PASSWORD is missing. Skipping default super admin bootstrap.',
    );
    return;
  }

  const email = env.SEED_SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    console.log(`[bootstrap] Default super admin already exists for ${email}. Skipping password reset.`);
    return;
  }

  const password = await hashPassword(env.SEED_SUPER_ADMIN_PASSWORD);

  await prisma.user.create({
    data: {
      name: env.SEED_SUPER_ADMIN_NAME.trim(),
      email,
      password,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`[bootstrap] Default super admin was created for ${email}.`);
};
