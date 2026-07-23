import type { Response } from 'express';

import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';
import { isPaginatedResult, resolvePaginationInput } from '../utils/pagination';
import { sendResponse } from '../utils/send-response';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../services/user.service';

export const getUsers = asyncHandler(async (req, res: Response) => {
  const users = await listUsers({
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    pagination: resolvePaginationInput({
      page: req.query.page,
      limit: req.query.limit,
    }),
  });

  sendResponse(res, 200, {
    success: true,
    message: 'Users retrieved successfully.',
    data: isPaginatedResult(users) ? users.items : users,
    pagination: isPaginatedResult(users) ? users.pagination : undefined,
  });
});

export const createAdminUser = asyncHandler(async (req, res: Response) => {
  const user = await createUser(req.body);

  sendResponse(res, 201, {
    success: true,
    message: 'Admin user created successfully.',
    data: user,
  });
});

export const updateAdminUser = asyncHandler(async (req, res: Response) => {
  const userId = String(req.params.id);
  const user = await updateUser(userId, req.body);

  sendResponse(res, 200, {
    success: true,
    message: 'Admin user updated successfully.',
    data: user,
  });
});

export const deleteAdminUser = asyncHandler(async (req, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication failed.');
  }

  const userId = String(req.params.id);

  await deleteUser(userId, req.user.id);

  sendResponse(res, 200, {
    success: true,
    message: 'Admin user deleted successfully.',
  });
});
