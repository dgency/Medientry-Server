import { Prisma, UserStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { hashPassword } from '../utils/password';
import { publicUserSelect } from '../utils/user-response';

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: Prisma.UserCreateInput['role'];
  status: Prisma.UserCreateInput['status'];
};

type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: Prisma.UserUpdateInput['role'];
  status?: Prisma.UserUpdateInput['status'];
};

export const listUsers = async () => {
  return prisma.user.findMany({
    select: publicUserSelect,
    orderBy: [{ createdAt: 'desc' }],
  });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
};

export const createUser = async (input: CreateUserInput) => {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  return prisma.user.create({
    data: {
      name: input.name,
      email: normalizedEmail,
      password: await hashPassword(input.password),
      role: input.role,
      status: input.status,
    },
    select: publicUserSelect,
  });
};

export const updateUser = async (id: string, input: UpdateUserInput) => {
  await getUserById(id);

  const data: Prisma.UserUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.email !== undefined) {
    data.email = input.email.toLowerCase().trim();
  }

  if (input.password !== undefined) {
    data.password = await hashPassword(input.password);
  }

  if (input.role !== undefined) {
    data.role = input.role;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  return prisma.user.update({
    where: { id },
    data,
    select: publicUserSelect,
  });
};

export const deleteUser = async (id: string, currentUserId: string) => {
  if (id === currentUserId) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (user.role === 'SUPER_ADMIN' && user.status === UserStatus.ACTIVE) {
    const activeSuperAdminCount = await prisma.user.count({
      where: {
        role: 'SUPER_ADMIN',
        status: UserStatus.ACTIVE,
      },
    });

    if (activeSuperAdminCount <= 1) {
      throw new ApiError(400, 'Cannot delete the last active super admin.');
    }
  }

  await prisma.user.delete({
    where: { id },
  });
};
