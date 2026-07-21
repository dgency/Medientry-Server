import { PrismaClient } from '@prisma/client';

import { env } from './env';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const localDatabaseHosts = new Set(['localhost', '127.0.0.1', '::1']);

const warnIfDatabaseUrlNeedsSslMode = () => {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  try {
    const databaseUrl = new URL(env.DATABASE_URL);
    const isPostgres =
      databaseUrl.protocol === 'postgresql:' || databaseUrl.protocol === 'postgres:';

    if (!isPostgres || localDatabaseHosts.has(databaseUrl.hostname)) {
      return;
    }

    if (!databaseUrl.searchParams.has('sslmode')) {
      console.warn(
        `[prisma] DATABASE_URL for host "${databaseUrl.hostname}" does not include sslmode. Managed PostgreSQL providers such as DigitalOcean often require "?sslmode=require" in production.`,
      );
    }
  } catch {
    // env validation already guards invalid DATABASE_URL values
  }
};

warnIfDatabaseUrlNeedsSslMode();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
