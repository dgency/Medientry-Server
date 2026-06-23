import type { CorsOptions } from 'cors';

import { ApiError } from '../utils/api-error';
import { env } from './env';

const configuredOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const localNetworkHostPattern =
  /^(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})$/;
const allowedDevelopmentPorts = new Set(['3000', '5173']);

const allowedOrigins = [
  ...new Set([
    'http://localhost:3000',
    'http://localhost:5173',
    env.CLIENT_URL,
    env.ADMIN_URL,
    ...configuredOrigins,
  ]),
];

const isAllowedDevelopmentLanOrigin = (origin: string) => {
  if (env.NODE_ENV !== 'development') {
    return false;
  }

  try {
    const url = new URL(origin);

    return (
      /^https?:$/.test(url.protocol) &&
      allowedDevelopmentPorts.has(url.port) &&
      localNetworkHostPattern.test(url.hostname)
    );
  } catch {
    return false;
  }
};

export const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isAllowedDevelopmentLanOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new ApiError(403, `Origin ${origin} is not allowed by CORS.`));
  },
};
