import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type RequestSchemaPayload = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

export const validateRequest =
  (schema: ZodType<RequestSchemaPayload>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }

    if (parsed.params !== undefined) {
      req.params = parsed.params as Request['params'];
    }

    next();
  };
