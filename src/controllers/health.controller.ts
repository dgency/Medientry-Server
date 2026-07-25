import type { Request, Response } from 'express';

import { getHealthStatus } from '../services/health.service';
import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const health = await getHealthStatus();
  const statusCode = health.status === 'ok' ? 200 : 503;
  const message =
    health.database === 'down'
      ? 'API is running but the database is unavailable.'
      : health.storage.status === 'degraded'
        ? 'API is running but storage is unavailable.'
        : 'API, database, and storage are healthy.';

  sendResponse(res, statusCode, {
    success: health.status === 'ok',
    message,
    data: health,
  });
});
