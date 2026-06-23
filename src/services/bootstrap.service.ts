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
  const password = await hashPassword(env.SEED_SUPER_ADMIN_PASSWORD);

  await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name: env.SEED_SUPER_ADMIN_NAME.trim(),
      password,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: env.SEED_SUPER_ADMIN_NAME.trim(),
      email,
      password,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`[bootstrap] Default super admin is ready for ${email}.`);
};
