import type { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import multer from 'multer';
import { ZodError } from 'zod';

import { ApiError } from '../utils/api-error';
import { mapPrismaErrorToHttp } from '../utils/prisma-error';

type ErrorResponse = {
  success: false;
  message: string;
  code?: string;
  errors?: unknown;
  stack?: string;
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Something went wrong.';
  let errors: unknown;
  let code: string | undefined;
  const errorWithCode =
    error && typeof error === 'object' ? (error as Error & { code?: string }) : null;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.details;
    code = errorWithCode?.code;
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
    code = 'VALIDATION_FAILED';
  } else {
    const prismaError = mapPrismaErrorToHttp(error);

    if (prismaError) {
      statusCode = prismaError.statusCode;
      message = prismaError.message;
      errors = prismaError.diagnostics;
      code = prismaError.code;
    } else if (error instanceof TokenExpiredError) {
      statusCode = 401;
      message = 'Authentication token has expired.';
      code = 'TOKEN_EXPIRED';
    } else if (error instanceof JsonWebTokenError) {
      statusCode = 401;
      message = 'Invalid authentication token.';
      code = 'INVALID_TOKEN';
    } else if (error instanceof multer.MulterError) {
      statusCode = 400;
      message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Uploaded file exceeds the allowed size.'
          : error.message;
      code = error.code;
    } else if (error instanceof Error) {
      message = error.message;
      code = errorWithCode?.code ?? error.name;
    }
  }

  const isBlogListRequest = req.method === 'GET' && req.path === '/api/blogs';

  if (isBlogListRequest && statusCode >= 500) {
    message = 'Unable to load blogs';
    code = 'BLOG_LIST_FAILED';
    errors = {
      ...(typeof errors === 'object' && errors !== null ? errors : {}),
      code: 'BLOG_LIST_FAILED',
    };
  }

  const safeLogPayload = {
    method: req.method,
    path: req.originalUrl || req.path,
    responseStatus: statusCode,
    errorName: error instanceof Error ? error.name : typeof error,
    safeMessage: message,
    errorMessage: error instanceof Error ? error.message : String(error),
    prismaErrorCode: code?.startsWith('P') ? code : null,
    errorCode: code ?? null,
    details:
      errors && typeof errors === 'object'
        ? errors
        : undefined,
    stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined,
  };

  console.error('[api-error]', safeLogPayload);

  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (code) {
    response.code = code;
  }

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};
