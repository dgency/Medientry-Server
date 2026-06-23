import type { Request, Response } from 'express';

import { uploadFile } from '../services/upload.service';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';

export const createUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'A file is required.');
  }

  const kind = typeof req.body.kind === 'string' ? req.body.kind : undefined;

  const uploadedFile = await uploadFile({
    file: req.file,
    kind,
    request: req,
  });

  sendResponse(res, 200, {
    success: true,
    message: 'File uploaded successfully.',
    data: uploadedFile,
  });
});
