import type { Response } from 'express';
import type { PaginationMeta } from './pagination';

type ResponsePayload<T> = {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
};

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  payload: ResponsePayload<T>,
) => {
  return res.status(statusCode).json(payload);
};
