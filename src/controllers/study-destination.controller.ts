import type { Response } from 'express';
import { PublicationStatus } from '@prisma/client';

import { asyncHandler } from '../utils/async-handler';
import { isPaginatedResult, resolvePaginationInput } from '../utils/pagination';
import { sendResponse } from '../utils/send-response';
import {
  createStudyDestination,
  deleteStudyDestination,
  getStudyDestinationBySlug,
  listStudyDestinations,
  updateStudyDestination,
} from '../services/study-destination.service';

const parseBooleanQuery = (value: unknown) => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
};

const parsePublicationStatusQuery = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim().toUpperCase();
  return normalizedValue in PublicationStatus
    ? (PublicationStatus[normalizedValue as keyof typeof PublicationStatus] as PublicationStatus)
    : undefined;
};

export const getStudyDestinations = asyncHandler(async (req, res: Response) => {
  let destinations: Awaited<ReturnType<typeof listStudyDestinations>> = [];

  try {
    destinations = await listStudyDestinations({
      includeUnpublished: Boolean(req.user),
      showInMenu: parseBooleanQuery(req.query.showInMenu),
      status: parsePublicationStatusQuery(req.query.status),
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      pagination: resolvePaginationInput({
        page: req.query.page,
        limit: req.query.limit,
      }),
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : 'Unknown study destination error.';

    console.warn(
      `[study-destinations] Falling back to an empty public study destination list because the API store is unavailable (${reason}).`,
    );
  }

  sendResponse(res, 200, {
    success: true,
    message: 'Study destinations retrieved successfully.',
    data: isPaginatedResult(destinations) ? destinations.items : destinations,
    pagination: isPaginatedResult(destinations) ? destinations.pagination : undefined,
  });
});

export const getStudyDestinationByPublicSlug = asyncHandler(async (req, res: Response) => {
  const destination = await getStudyDestinationBySlug(String(req.params.slug));

  sendResponse(res, 200, {
    success: true,
    message: 'Study destination retrieved successfully.',
    data: destination,
  });
});

export const createCmsStudyDestination = asyncHandler(async (req, res: Response) => {
  const destination = await createStudyDestination(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'Study destination created successfully.',
    data: destination,
  });
});

export const updateCmsStudyDestination = asyncHandler(async (req, res: Response) => {
  const destination = await updateStudyDestination(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Study destination updated successfully.',
    data: destination,
  });
});

export const deleteCmsStudyDestination = asyncHandler(async (req, res: Response) => {
  await deleteStudyDestination(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Study destination deleted successfully.',
  });
});
