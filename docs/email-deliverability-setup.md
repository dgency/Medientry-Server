# Medientry Email Deliverability Setup

Use this checklist after deploying the centralized public-form email system.

## Required mailbox setup

1. Sign in to the Gmail account used for sending: `medientry@gmail.com`.
2. Enable Google Two-Step Verification for that account.
3. Generate a new Gmail App Password for SMTP.
4. Store that App Password only in backend environment variables as `MAIL_PASS`.
5. Never place the real App Password in source code, `.env.example`, docs, commits, screenshots, or test files.

## Required backend environment variables

Configure these values in the backend runtime environment:

```env
MAIL_ENABLED="true"
MAIL_HOST="smtp.gmail.com"
MAIL_PORT="587"
MAIL_SECURE="false"
MAIL_USER="medientry@gmail.com"
MAIL_PASS="ADD_THE_NEW_GMAIL_APP_PASSWORD_LOCALLY"
MAIL_FROM_NAME="Medientry"
MAIL_FROM_EMAIL="medientry@gmail.com"
MAIL_REPLY_TO_EMAIL="medientry@gmail.com"
ADMIN_NOTIFICATION_EMAILS="medientry@gmail.com,info@medientrybd.com,anik.dgency@gmail.com"
```

## Administrative recipients

The public-form admin notifications are sent to every address in `ADMIN_NOTIFICATION_EMAILS`.

Current intended recipients:

- `medientry@gmail.com`
- `info@medientrybd.com`
- `anik.dgency@gmail.com`

## Verification steps

1. Run `npm run mail:test` inside `Medientry-Server`.
2. Confirm SMTP verification succeeds.
3. Confirm the test email arrives at all configured admin recipient addresses.
4. Submit each real public form and confirm the database record saves before checking email delivery.

## Domain authentication notes

- Because the current sender is `medientry@gmail.com`, Gmail controls the sending domain and Google handles the core sender authentication.
- If MediEntry later changes the sender to `info@medientrybd.com`, that mailbox and domain must be configured separately.
- For a custom domain sender, set up SPF, DKIM, and DMARC for the active sender domain and SMTP provider.
- Do not invent DNS records. Use the exact records provided by the final mail provider or domain host.

## Dashboard links

- College fee inquiry admin emails can include a direct dashboard link when `ADMIN_URL` points to the real dashboard.
- Keep `ADMIN_URL` accurate in every environment so links resolve correctly.
