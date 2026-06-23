import type { RequestHandler } from 'express';
import { authenticateRequest } from '../utils/authenticate-request';

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    await authenticateRequest(req, { optional: true });
    next();
  } catch {
    next();
  }
};
