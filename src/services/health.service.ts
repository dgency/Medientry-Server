import { env } from '../config/env';
import { prisma } from '../config/prisma';

export type HealthStatus = {
  status: 'ok' | 'degraded';
  environment: string;
  timestamp: string;
  uptime: number;
  database: 'up' | 'down';
};

export const getHealthStatus = async (): Promise<HealthStatus> => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'up',
    };
  } catch {
    return {
      status: 'degraded',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'down',
    };
  }
};
