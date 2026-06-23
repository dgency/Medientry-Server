# Medientry CMS

Production-ready Medientry CMS split into three apps:

- `Medientry-Server`: Express + TypeScript + Prisma + PostgreSQL API
- `Medientry-Server/admin-dashboard`: React + Vite + TypeScript CMS dashboard
- `../Medientry-Client`: Next.js frontend consuming CMS APIs

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+

## 1. Backend Setup

From `New Stucture/Medientry-Server`:

```bash
npm install
Copy-Item .env.example .env
```

Update `.env` with your real values:

- `DATABASE_URL`
- `JWT_SECRET`
- `SEED_SUPER_ADMIN_PASSWORD`
- optionally `SEED_SUPER_ADMIN_EMAIL`
- optionally `SEED_SUPER_ADMIN_NAME`

Example secure seed values:

```env
SEED_SUPER_ADMIN_EMAIL=admin@example.com
SEED_SUPER_ADMIN_PASSWORD=replace-with-a-strong-admin-password
SEED_SUPER_ADMIN_NAME=Medientry Super Admin
```

Generate Prisma client, run migrations, and seed:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Start the API:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

## 2. Admin Dashboard Setup

From `New Stucture/Medientry-Server/admin-dashboard`:

```bash
Copy-Item .env.example .env
npm install
npm run dev
```

Default local dashboard URL:

```text
http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

## 3. Client Setup

From `New Stucture/Medientry-Client`:

```bash
Copy-Item .env.example .env.local
npm install
npm run dev
```

Default local client URL:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

## Environment Notes

- `HOST` defaults to `0.0.0.0` so the backend can be reached from localhost or LAN when desired.
- `CORS_ORIGINS` accepts a comma-separated allowlist in addition to `CLIENT_URL` and `ADMIN_URL`.
- `MAIL_ENABLED=false` by default so the API can boot without SMTP credentials.
- To enable Gmail SMTP, set:

```env
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-gmail-address@gmail.com
MAIL_PASS=your-gmail-app-password
MAIL_FROM_NAME=Medientry
MAIL_FROM_EMAIL=no-reply@example.com
```

## Main API Routes

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|PUT /api/site-settings`
- `GET|POST|PUT|DELETE /api/pages`
- `GET|POST|PUT|DELETE /api/study-destinations`
- `GET|POST|PUT|DELETE /api/medical-colleges`
- `GET|POST|PUT|DELETE /api/gallery`
- `GET|POST|PUT|DELETE /api/blogs`
- `GET|POST|PUT|DELETE /api/notices`
- `GET|POST|PUT|DELETE /api/success-stories`
- `GET|PUT /api/home-sections`
- `GET|POST|PATCH|DELETE /api/users`
- `POST /api/uploads`

## Uploads

Local uploads are stored in:

- `uploads/images`
- `uploads/documents`
- `uploads/videos`

Public files are served from:

```text
/uploads/*
```

## Smoke Tests

Health:

```bash
set API_BASE_URL=http://YOUR_MAIN_PC_IP:5000/api
curl %API_BASE_URL%/health
```

Login:

```bash
curl -X POST %API_BASE_URL%/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"YOUR_ADMIN_EMAIL\",\"password\":\"YOUR_ADMIN_PASSWORD\"}"
```

Authenticated profile:

```bash
curl %API_BASE_URL%/auth/me ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Study destinations menu feed:

```bash
curl "%API_BASE_URL%/study-destinations?showInMenu=true&status=published"
```

Upload:

```bash
curl -X POST %API_BASE_URL%/uploads ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  -F "kind=image" ^
  -F "file=@C:\\path\\to\\image.jpg"
```

## Verified In This Workspace

These checks passed locally in this workspace:

- `npm run build` in `Medientry-Server`
- `npm run build` in `Medientry-Server/admin-dashboard`
- `npm run build` in `Medientry-Client`
- `npx prisma validate` with a valid env shape
- server boot smoke test with:
  - health returning `503 degraded` when DB is unavailable
  - allowed CORS origin accepted
  - disallowed CORS origin rejected with `403`

## Notes

- Live Prisma migration, seed, login, CRUD, and upload verification require a real PostgreSQL database with valid credentials.
- Blog preview links in the dashboard use the Next.js `/blog/[slug]` route.
- Study destination dashboard previews respect the existing fixed frontend routes for Bangladesh and Georgia, while other destinations use `/study-destinations/[slug]`.
