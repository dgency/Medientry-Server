import fs from 'fs';
import path from "path";
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { corsOptions } from './config/cors';
import { env } from './config/env';
import { uploadsRootDirectory } from './config/upload';
import { errorHandler } from './middlewares/error-handler';
import { notFoundHandler } from './middlewares/not-found-handler';
import { requestLogger } from './middlewares/request-logger';
import { apiRouter } from './routes';
import { getLegacyUploadMediaResponse } from './services/public-media.service';
import { asyncHandler } from './utils/async-handler';

const app = express();
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const normalizeHost = (value: string) => {
  const trimmedValue = value.trim().toLowerCase();

  if (trimmedValue.startsWith('[')) {
    const closingBracketIndex = trimmedValue.indexOf(']');
    return closingBracketIndex === -1
      ? trimmedValue
      : trimmedValue.slice(1, closingBracketIndex);
  }

  const colonMatches = trimmedValue.match(/:/g) ?? [];

  if (colonMatches.length === 1) {
    return trimmedValue.split(':')[0];
  }

  return trimmedValue;
};

const isLocalHost = (value?: string) => {
  if (!value) {
    return false;
  }

  const normalizedHost = normalizeHost(value);
  return LOCAL_HOSTS.has(normalizedHost) || normalizedHost.endsWith('.local');
};

const hstsMiddleware = helmet.hsts();

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(helmet({ hsts: false }));
app.use((req, res, next) => {
  if (env.NODE_ENV !== 'production' || isLocalHost(req.hostname)) {
    return next();
  }

  return hstsMiddleware(req, res, next);
});
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.MEDIA_ENABLE_LEGACY_FILESYSTEM_FALLBACK) {
  app.use(
    '/uploads',
    express.static(uploadsRootDirectory, {
      fallthrough: true,
      index: false,
      immutable: env.NODE_ENV === 'production',
      maxAge: env.NODE_ENV === 'production' ? '7d' : 0,
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );
  app.use(
    '/uploads',
    asyncHandler(async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }

      const mediaResponse = await getLegacyUploadMediaResponse({
        legacyPath: `/uploads${req.path.startsWith('/') ? req.path : `/${req.path}`}`,
        ifNoneMatch: req.headers['if-none-match'],
        includeBody: req.method !== 'HEAD',
      });

      if (!mediaResponse) {
        return next();
      }

      for (const [headerName, headerValue] of Object.entries(mediaResponse.headers)) {
        res.setHeader(headerName, headerValue);
      }

      if (mediaResponse.statusCode === 304) {
        return res.status(304).end();
      }

      if (req.method === 'HEAD') {
        return res.status(200).end();
      }

      return res.status(200).send(mediaResponse.buffer);
    }),
  );
  app.use('/uploads', (_req, res) => {
    res.status(404).type('text/plain').send('Uploaded file not found.');
  });
}

app.use('/api', apiRouter);
// ==========================================================config for digital ocean

// Compute paths dynamically to support both raw src and compiled dist execution
const dashboardPath = path.resolve(process.cwd(), 'admin-dashboard', 'dist');
const dashboardIndexPath = path.join(dashboardPath, 'index.html');
const dashboardBuildExists = fs.existsSync(dashboardIndexPath);

// 1. Serve the compiled static assets from the Vite dashboard folder
if (dashboardBuildExists) {
  app.use(express.static(dashboardPath, {
    maxAge: env.NODE_ENV === 'production' ? '1y' : 0,
    index: false,
  }));

  // Send the dashboard shell for browser refreshes on SPA routes, including `/`.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }

    if (path.extname(req.path)) {
      return next();
    }

    return res.sendFile(dashboardIndexPath);
  });
}

// ==========================================config for digital ocean

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
