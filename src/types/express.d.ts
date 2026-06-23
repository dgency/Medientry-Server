import type { VerifiedAccessTokenPayload } from '../utils/jwt';
import type { PublicUser } from '../utils/user-response';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
      authToken?: string;
      authTokenPayload?: VerifiedAccessTokenPayload;
    }
  }
}

export {};
