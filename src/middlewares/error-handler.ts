import type { NextFunction, Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import multer from 'multer';
import { ZodError } from 'zod';

import { ApiError } from '../utils/api-error';

type ErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
  stack?: string;
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Something went wrong.';
  let errors: unknown;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    const fieldNames = Array.from(
      new Set(
        error.issues
          .map((issue) => issue.path.join('.'))
          .filter(Boolean)
          .map((path) => path.replace(/^body\./, '')),
      ),
    );
    message =
      fieldNames.length > 0
        ? `Validation failed for: ${fieldNames.join(', ')}.`
        : 'Validation failed.';
    errors = error.flatten();
  } else if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists.';
      errors = error.meta;
    } else {
      statusCode = 400;
      message = 'Database request failed.';
      errors = {
        code: error.code,
        meta: error.meta,
      };
    }
  } else if (error instanceof TokenExpiredError) {
    statusCode = 401;
    message = 'Authentication token has expired.';
  } else if (error instanceof JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file exceeds the allowed size.'
        : error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};
