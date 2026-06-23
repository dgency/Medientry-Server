import type { Request } from 'express';

import type { PublicUser } from './user-response';

export type AuthenticatedRequest = Request & {
  user: PublicUser;
};
