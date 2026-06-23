import type { RequestHandler } from 'express';
import { authenticateRequest } from '../utils/authenticate-request';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    await authenticateRequest(req);
    next();
  } catch (error) {
    next(error);
  }
};
