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
import { apiRouter } from './routes';

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
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  '/uploads',
  express.static(uploadsRootDirectory, {
    fallthrough: false,
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

app.use('/api', apiRouter);
// ==========================================================config for digital ocean

// Compute paths dynamically to support both raw src and compiled dist execution
const dashboardPath = path.resolve(process.cwd(), 'admin-dashboard', 'dist');

// 1. Serve the compiled static assets from the Vite dashboard folder
app.use(express.static(dashboardPath, {
  maxAge: env.NODE_ENV === 'production' ? '1y' : 0,
  index: false
}));

// 2. Direct all remaining non-API browser traffic to your Vite dashboard index.html
app.get('/*any', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  return res.sendFile(path.join(dashboardPath, 'index.html'));
});

// ==========================================config for digital ocean

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
