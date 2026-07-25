import type { Request, Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { getPublicMediaResponse } from '../services/public-media.service';

const sendPublicMedia = async ({
  includeBody,
  req,
  res,
}: {
  includeBody: boolean;
  req: Request;
  res: Response;
}) => {
  const mediaResponse = await getPublicMediaResponse({
    id: String(req.params.id),
    ifNoneMatch: req.headers['if-none-match'],
    includeBody,
  });

  for (const [headerName, headerValue] of Object.entries(mediaResponse.headers)) {
    res.setHeader(headerName, headerValue);
  }

  if (mediaResponse.statusCode === 304) {
    res.status(304).end();
    return;
  }

  if (!includeBody) {
    res.status(200).end();
    return;
  }

  res.status(200).send(mediaResponse.buffer);
};

export const getPublicMedia = asyncHandler(async (req: Request, res: Response) => {
  await sendPublicMedia({
    includeBody: true,
    req,
    res,
  });
});

export const headPublicMedia = asyncHandler(async (req: Request, res: Response) => {
  await sendPublicMedia({
    includeBody: false,
    req,
    res,
  });
});
