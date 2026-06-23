import type { Server } from 'node:http';
import process from 'node:process';

import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { ensureDefaultSuperAdmin } from './services/bootstrap.service';

let server: Server | null = null;

const startServer = async () => {
  let databaseConnected = false;

  try {
    await prisma.$connect();
    databaseConnected = true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown database connection error.';
    console.warn(
      `Database connection unavailable at startup. Continuing in degraded API mode (${reason}).`,
    );
  }

  if (databaseConnected) {
    try {
      await ensureDefaultSuperAdmin();
    } catch (error) {
      console.error('Failed to ensure the default super admin account:', error);
    }
  }

  server = app.listen(env.PORT, env.HOST, () => {
    console.log(
      `Medientry API is running on http://${env.HOST}:${env.PORT} in ${env.NODE_ENV} mode.`,
    );
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
