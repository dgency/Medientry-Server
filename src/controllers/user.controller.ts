import type { Response } from 'express';

import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';
import { sendResponse } from '../utils/send-response';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../services/user.service';

export const getUsers = asyncHandler(async (_req, res: Response) => {
  const users = await listUsers();

  sendResponse(res, 200, {
    success: true,
    message: 'Users retrieved successfully.',
    data: users,
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
