import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { maxUploadSizeInBytes, uploadRules } from '../config/upload';
import { ApiError } from '../utils/api-error';

const allowedMimeTypes = new Set(
  Object.values(uploadRules).flatMap((rule) => rule.allowedMimeTypes),
);

const acceptedFieldNames = ['file', 'image', 'logo', 'favicon'] as const;

type UploadRequest = Request & {
  files?: Record<string, Express.Multer.File[]>;
  file?: Express.Multer.File;
};

const uploadHandler = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSizeInBytes,
    files: 1,
  },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new ApiError(400, 'Unsupported file type.'));
      return;
    }

    callback(null, true);
  },
}).fields(acceptedFieldNames.map((name) => ({ name, maxCount: 1 })));

export const uploadSingleFile = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadHandler(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    const request = req as UploadRequest;
    const normalizedFile = acceptedFieldNames
      .map((fieldName) => request.files?.[fieldName]?.[0])
      .find(Boolean);

    if (normalizedFile) {
      request.file = normalizedFile;
    }

    next();
  });
};
