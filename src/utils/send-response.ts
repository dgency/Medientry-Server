import type { Response } from 'express';

type ResponsePayload<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  payload: ResponsePayload<T>,
) => {
  return res.status(statusCode).json(payload);
};
