import type { Server } from 'node:http';
import { networkInterfaces } from 'node:os';
import process from 'node:process';

import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { ensureDefaultSuperAdmin } from './services/bootstrap.service';
import { mapPrismaErrorToHttp } from './utils/prisma-error';

let server: Server | null = null;

const getReachableHosts = () => {
  if (!['0.0.0.0', '::'].includes(env.HOST)) {
    return [env.HOST];
  }

  const lanHosts = Object.values(networkInterfaces())
    .flat()
    .filter((address): address is NonNullable<typeof address> => Boolean(address))
    .filter((address) => address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);

  return [...new Set(['localhost', ...lanHosts])];
};

const formatHostForUrl = (host: string) => (host.includes(':') ? `[${host}]` : host);

const logReachableUrls = () => {
  const baseUrls = getReachableHosts().map(
    (host) => `http://${formatHostForUrl(host)}:${env.PORT}`,
  );

  console.log(`Medientry API is running in ${env.NODE_ENV} mode.`);
  baseUrls.forEach((baseUrl) => {
    console.log(`[server] API base: ${baseUrl}/api`);
    console.log(`[server] Health: ${baseUrl}/api/health`);
  });
};

const verifyDatabaseConnection = async () => {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
};

const logStartupDatabaseFailure = (error: unknown) => {
  const prismaError = mapPrismaErrorToHttp(error);

  console.error('[startup-db-check]', {
    safeMessage: prismaError?.message ?? 'Database connection check failed.',
    prismaErrorCode: prismaError?.code ?? null,
    diagnostics: prismaError?.diagnostics,
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined,
  });
};

const startServer = async () => {
  try {
    await verifyDatabaseConnection();
  } catch (error) {
    logStartupDatabaseFailure(error);
    throw new Error('Database startup check failed. Server startup aborted.', {
      cause: error instanceof Error ? error : undefined,
    });
  }

  try {
    await ensureDefaultSuperAdmin();
  } catch (error) {
    console.error('Failed to ensure the default super admin account:', error);
  }

  server = app.listen(env.PORT, env.HOST, () => {
    logReachableUrls();
  });
};

const shutdown = (signal: NodeJS.Signals, httpServer: Server) => {
  console.log(`${signal} received. Starting graceful shutdown.`);

  httpServer.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('Prisma disconnected. Server shutdown complete.');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGINT', () => {
  if (server) {
    shutdown('SIGINT', server);
  }
});

process.on('SIGTERM', () => {
  if (server) {
    shutdown('SIGTERM', server);
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  if (server) {
    shutdown('SIGTERM', server);
  } else {
    process.exit(1);
  }
});

void startServer().catch(async (error) => {
  console.error('Failed to start Medientry API:', error);

  try {
    await prisma.$disconnect();
  } finally {
    process.exit(1);
  }
});
