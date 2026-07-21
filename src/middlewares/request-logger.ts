import type { NextFunction, Request, Response } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    console.info('[api-request]', {
      method: req.method,
      path: req.originalUrl || req.url,
      responseStatus: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
    });
  });

  next();
};
