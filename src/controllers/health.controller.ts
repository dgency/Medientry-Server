import type { Request, Response } from 'express';

import { getHealthStatus } from '../services/health.service';
import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const health = await getHealthStatus();
  const statusCode = health.status === 'ok' ? 200 : 503;

  sendResponse(res, statusCode, {
    success: health.status === 'ok',
    message:
      health.status === 'ok'
        ? 'API and database are healthy.'
        : 'API is running but the database is unavailable.',
    data: health,
  });
});
