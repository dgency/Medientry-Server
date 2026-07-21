import path from "path";
import fs from 'node:fs';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import type { Request, Response } from 'express';

import { corsOptions } from './config/cors';
import { env } from './config/env';
import { serverRootDirectory, uploadsRootDirectory } from './config/upload';
import { errorHandler } from './middlewares/error-handler';
import { notFoundHandler } from './middlewares/not-found-handler';
import { requestLogger } from './middlewares/request-logger';
import { apiRouter } from './routes';

const app = express();
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const clientPublicPath = path.resolve(serverRootDirectory, '..', 'Medientry-Client', 'public');
const dashboardPath = path.resolve(serverRootDirectory, 'admin-dashboard', 'dist');
const publicMediaPrefixes = ['/uploads', '/images', '/home-page-icons'];
const staticAssetMaxAge = env.NODE_ENV === 'production' ? '7d' : 0;

const buildAllowedPublicMediaOrigins = () =>
  [
    env.CLIENT_URL,
    env.ADMIN_URL,
    ...(env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
      : []),
  ].filter(Boolean);

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
const allowedPublicMediaOrigins = new Set(buildAllowedPublicMediaOrigins());

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

const setPublicMediaHeaders = (req: Request, res: Response) => {
  const requestOrigin = req.headers.origin?.trim();
  const allowOrigin =
    requestOrigin && allowedPublicMediaOrigins.has(requestOrigin)
      ? requestOrigin
      : env.CLIENT_URL || env.ADMIN_URL || null;

  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.append('Vary', 'Origin');
  }

  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
};

const mountPublicStaticRoute = (routePath: string, absolutePath: string) => {
  app.use(
    routePath,
    (req, res, next) => {
      setPublicMediaHeaders(req, res);
      next();
    },
    express.static(absolutePath, {
      fallthrough: true,
      index: false,
      immutable: env.NODE_ENV === 'production',
      maxAge: staticAssetMaxAge,
      setHeaders(res) {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
      },
    }),
    (req, res) => {
      setPublicMediaHeaders(req, res);
      res.status(404).type('text/plain').send('Media file not found.');
    },
  );
};

mountPublicStaticRoute('/uploads', uploadsRootDirectory);

if (fs.existsSync(path.join(clientPublicPath, 'images'))) {
  mountPublicStaticRoute('/images', path.join(clientPublicPath, 'images'));
}

if (fs.existsSync(path.join(clientPublicPath, 'home-page-icons'))) {
  mountPublicStaticRoute(
    '/home-page-icons',
    path.join(clientPublicPath, 'home-page-icons'),
  );
}

app.use('/api', apiRouter);

// 1. Serve the compiled static assets from the Vite dashboard folder
app.use(express.static(dashboardPath, {
  maxAge: env.NODE_ENV === 'production' ? '1y' : 0,
  index: false
}));

// 2. Direct all remaining non-API browser traffic to your Vite dashboard index.html
app.get('/*any', (req, res, next) => {
  if (
    req.path.startsWith('/api')
    || publicMediaPrefixes.some((prefix) => req.path.startsWith(prefix))
    || path.extname(req.path).length > 0
  ) {
    return next();
  }
  return res.sendFile(path.join(dashboardPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
