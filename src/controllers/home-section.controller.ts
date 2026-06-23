import type { Response } from 'express';

import { listHomeSections, updateHomeSection } from '../services/home-section.service';
import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import type { HomeSectionKey } from '../utils/home-section';

export const getHomeSections = asyncHandler(async (req, res: Response) => {
  const homeSections = await listHomeSections(Boolean(req.user));

  sendResponse(res, 200, {
    success: true,
    message: 'Home sections retrieved successfully.',
    data: homeSections,
  });
});

export const putHomeSection = asyncHandler(async (req, res: Response) => {
  const homeSection = await updateHomeSection(
    req.params.sectionKey as HomeSectionKey,
    req.body,
  );

  sendResponse(res, 200, {
    success: true,
    message: 'Home section updated successfully.',
    data: homeSection,
  });
});
