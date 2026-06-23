import { Prisma } from '@prisma/client';

export const publicUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;
