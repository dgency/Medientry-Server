import type { Response } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { isPaginatedResult, resolvePaginationInput } from '../utils/pagination';
import { sendResponse } from '../utils/send-response';
import {
  createMedicalCollege,
  deleteMedicalCollege,
  featuredMedicalCollegesSectionKey,
  getFeaturedMedicalCollegesForHomepage,
  getMedicalCollegeBySlug,
  listMedicalColleges,
  updateMedicalCollege,
} from '../services/medical-college.service';

const parseBooleanQuery = (value: unknown) => value === 'true';

const parsePositiveIntegerQuery = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const getMedicalColleges = asyncHandler(async (req, res: Response) => {
  const medicalColleges = await listMedicalColleges({
    includeUnpublished: Boolean(req.user),
    featuredOnly: parseBooleanQuery(req.query.featuredOnly),
    sectionKey:
      typeof req.query.sectionKey === 'string'
        ? req.query.sectionKey
        : undefined,
    limit: parsePositiveIntegerQuery(req.query.limit),
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    pagination: resolvePaginationInput({
      page: req.query.page,
      limit: req.query.limit,
    }),
  });

  sendResponse(res, 200, {
    success: true,
    message: 'Medical colleges retrieved successfully.',
    data: isPaginatedResult(medicalColleges) ? medicalColleges.items : medicalColleges,
    pagination: isPaginatedResult(medicalColleges) ? medicalColleges.pagination : undefined,
  });
});

export const getHomepageFeaturedMedicalColleges = asyncHandler(async (_req, res: Response) => {
  const medicalColleges = await getFeaturedMedicalCollegesForHomepage();

  sendResponse(res, 200, {
    success: true,
    message: 'Homepage featured medical colleges retrieved successfully.',
    data: medicalColleges,
  });
});

export const getMedicalCollegeByPublicSlug = asyncHandler(async (req, res: Response) => {
  const medicalCollege = await getMedicalCollegeBySlug(
    String(req.params.slug),
    Boolean(req.user),
  );

  sendResponse(res, 200, {
    success: true,
    message: 'Medical college retrieved successfully.',
    data: medicalCollege,
  });
});

export const createCmsMedicalCollege = asyncHandler(async (req, res: Response) => {
  const medicalCollege = await createMedicalCollege(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'Medical college created successfully.',
    data: medicalCollege,
  });
});

export const updateCmsMedicalCollege = asyncHandler(async (req, res: Response) => {
  const medicalCollege = await updateMedicalCollege(String(req.params.id), req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Medical college updated successfully.',
    data: medicalCollege,
  });
});

export const deleteCmsMedicalCollege = asyncHandler(async (req, res: Response) => {
  await deleteMedicalCollege(String(req.params.id));

  sendResponse(res, 200, {
    success: true,
    message: 'Medical college deleted successfully.',
  });
});

export const getFeaturedMedicalCollegesSectionKey = () =>
  featuredMedicalCollegesSectionKey;
