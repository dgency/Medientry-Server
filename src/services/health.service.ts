import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { getStorageHealthStatus, isProductionUsingLocalStorage } from './storage.service';

export type HealthStatus = {
  status: 'ok' | 'degraded';
  environment: string;
  timestamp: string;
  uptime: number;
  database: 'up' | 'down';
  storage: {
    driver: 'local' | 'database';
    configured: boolean;
    writable: boolean | null;
    persistent: boolean;
    publicBaseUrl: string | null;
    warning: string | null;
    metadataAccessible: boolean | null;
    blobAccessible: boolean | null;
    legacyFilesystemFallbackEnabled: boolean;
    status: 'up' | 'degraded';
  };
};

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const storage = await getStorageHealthStatus();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const storageIsHealthy =
      storage.driver === 'database'
        ? storage.configured && storage.writable !== false
        : storage.configured && storage.writable !== false && !isProductionUsingLocalStorage;

    return {
      status: storageIsHealthy ? 'ok' : 'degraded',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'up',
      storage: {
        ...storage,
        status: storageIsHealthy ? 'up' : 'degraded',
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
          (storage.driver === 'database'
            ? storage.configured && storage.writable !== false
            : storage.configured && storage.writable !== false && !isProductionUsingLocalStorage)
            ? 'up'
            : 'degraded',
      },
    };
  }
};
