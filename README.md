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
- `MAIL_PASS` when enabling SMTP delivery
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

Optional backend-only SMTP verification:

```bash
npm run mail:test
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
- Public-form email notifications are centralized in the backend and use one shared SMTP transporter.
- Administrative notifications are sent to every address listed in `ADMIN_NOTIFICATION_EMAILS`.
- Customer confirmations keep the Medientry sender identity and are only sent for workflows that already support them.
- To enable Gmail SMTP, set:

```env
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=medientry@gmail.com
MAIL_PASS=ADD_THE_NEW_GMAIL_APP_PASSWORD_LOCALLY
MAIL_FROM_NAME=Medientry
MAIL_FROM_EMAIL=medientry@gmail.com
MAIL_REPLY_TO_EMAIL=medientry@gmail.com
ADMIN_NOTIFICATION_EMAILS=medientry@gmail.com,info@medientrybd.com,anik.dgency@gmail.com
```

Safe deliverability checklist:

- configure Google Two-Step Verification for `medientry@gmail.com`
- generate a fresh Gmail App Password
- store that App Password only in backend runtime env as `MAIL_PASS`
- keep `ADMIN_URL` accurate if you want dashboard links in admin emails
- review [docs/email-deliverability-setup.md](docs/email-deliverability-setup.md)

## Local API Contract

For local development and LAN/mobile testing, keep `CLIENT_URL` and `ADMIN_URL` as single primary origins and put every extra browser origin in `CORS_ORIGINS`.

Recommended backend `.env` shape:

```env
HOST="0.0.0.0"
PORT="5000"
CLIENT_URL="http://localhost:3000"
ADMIN_URL="http://localhost:5173"
CORS_ORIGINS="http://127.0.0.1:3000,http://YOUR_COMPUTER_LOCAL_IP:3000,http://127.0.0.1:5173,http://YOUR_COMPUTER_LOCAL_IP:5173"
```

Recommended local run commands:

```bash
# API only
npm run dev:api

# API + admin dashboard
npm run dev
```

If `http://localhost:5000/api/health` works but `http://YOUR_COMPUTER_LOCAL_IP:5000/api/health` times out from a phone or another laptop:

- confirm `ipconfig` still shows the same IPv4 address you put in `NEXT_PUBLIC_API_URL`
- confirm the API is listening on `0.0.0.0:5000`
- allow Node.js on Private networks in Windows Firewall, or open inbound TCP port `5000`

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
- Runtime bootstrap only creates the default super admin when it is missing and no longer resets an existing admin password on each server start.
- Blog preview links in the dashboard use the Next.js `/blog/[slug]` route.
- Study destination dashboard previews respect the existing fixed frontend routes for Bangladesh and Georgia, while other destinations use `/study-destinations/[slug]`.
