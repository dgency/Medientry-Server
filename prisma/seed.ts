import 'dotenv/config';

import bcrypt from 'bcrypt';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();
const defaultSuperAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD?.trim();

const DEFAULT_SUPER_ADMIN = {
  name: process.env.SEED_SUPER_ADMIN_NAME?.trim() || 'Super Admin',
  email: process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase() || 'admin@example.com',
  password: defaultSuperAdminPassword,
  role: UserRole.SUPER_ADMIN,
  status: UserStatus.ACTIVE,
};

const main = async () => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? '10');

  if (!DEFAULT_SUPER_ADMIN.password) {
    throw new Error(
      'SEED_SUPER_ADMIN_PASSWORD is required to seed the default super admin securely.',
    );
  }

  if (DEFAULT_SUPER_ADMIN.password.length < 8) {
    throw new Error('SEED_SUPER_ADMIN_PASSWORD must be at least 8 characters long.');
  }

  const password = await bcrypt.hash(DEFAULT_SUPER_ADMIN.password, saltRounds);

  await prisma.user.upsert({
    where: {
      email: DEFAULT_SUPER_ADMIN.email,
    },
    update: {
      name: DEFAULT_SUPER_ADMIN.name,
      password,
      role: DEFAULT_SUPER_ADMIN.role,
      status: DEFAULT_SUPER_ADMIN.status,
    },
    create: {
      name: DEFAULT_SUPER_ADMIN.name,
      email: DEFAULT_SUPER_ADMIN.email,
      password,
      role: DEFAULT_SUPER_ADMIN.role,
      status: DEFAULT_SUPER_ADMIN.status,
    },
  });

  console.log(`Seeded default super admin: ${DEFAULT_SUPER_ADMIN.email}`);
};

main()
  .catch((error) => {
    console.error('Prisma seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
