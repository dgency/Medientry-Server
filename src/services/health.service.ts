import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { storageAdapter } from './storage.service';

export type HealthStatus = {
  status: 'ok' | 'degraded';
  environment: string;
  timestamp: string;
  uptime: number;
  database: 'up' | 'down';
  storage: {
    driver: 'local' | 'spaces';
    configured: boolean;
    writable: boolean | null;
    bucketAccessible: boolean | null;
    publicBaseUrl: string | null;
    status: 'up' | 'down';
  };
};

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const storage = await storageAdapter.getHealthStatus();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const storageIsHealthy = storage.driver === 'spaces'
      ? storage.configured && storage.bucketAccessible !== false
      : storage.configured && storage.writable !== false;

    return {
      status: storageIsHealthy ? 'ok' : 'degraded',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'up',
      storage: {
        ...storage,
        status: storageIsHealthy ? 'up' : 'down',
      },
    };
  } catch {
    return {
      status: 'degraded',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'down',
      storage: {
        ...storage,
        status:
          (storage.driver === 'spaces'
            ? storage.configured && storage.bucketAccessible !== false
            : storage.configured && storage.writable !== false)
            ? 'up'
            : 'down',
      },
    };
  }
};
