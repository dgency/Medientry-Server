import { z } from 'zod';

import {
  parseAdminNotificationEmails,
  resolveReplyToEmail,
} from '../utils/mail-config';

const booleanString = () =>
  z
    .string()
    .optional()
    .transform((value) => value?.trim().toLowerCase() === 'true');

const bytesInMegabyte = 1024 * 1024;

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required.'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long.'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  JWT_REMEMBER_EXPIRES_IN: z.string().default('14d'),
  AUTH_COOKIE_NAME: z.string().min(1).default('medientry_access_token'),
  CLIENT_URL: z.url('CLIENT_URL must be a valid URL.'),
  ADMIN_URL: z.url('ADMIN_URL must be a valid URL.'),
  EMAIL_PUBLIC_SITE_URL: z.url('EMAIL_PUBLIC_SITE_URL must be a valid URL.').optional(),
  CORS_ORIGINS: z.string().optional(),
  SERVER_PUBLIC_URL: z.url('SERVER_PUBLIC_URL must be a valid URL.').optional(),
  PUBLIC_BASE_URL: z.url('PUBLIC_BASE_URL must be a valid URL.').optional(),
  STORAGE_DRIVER: z.enum(['local', 'database']).default('database'),
  LOCAL_UPLOAD_DIR: z.string().min(1).default('uploads'),
  MEDIA_MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(10 * bytesInMegabyte),
  MEDIA_MAX_DOCUMENT_BYTES: z.coerce.number().int().positive().default(10 * bytesInMegabyte),
  MEDIA_MAX_VIDEO_BYTES: z.coerce.number().int().positive().default(25 * bytesInMegabyte),
  MEDIA_CACHE_MAX_AGE: z.coerce.number().int().min(0).default(60 * 60 * 24 * 365),
  MEDIA_ENABLE_LEGACY_FILESYSTEM_FALLBACK: booleanString().default(true),
  MAIL_ENABLED: booleanString(),
  MAIL_HOST: z.string().default('smtp.gmail.com'),
  MAIL_PORT: z.coerce.number().int().positive().default(587),
  MAIL_SECURE: booleanString(),
  MAIL_REQUIRE_TLS: booleanString().default(true),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM_NAME: z.string().default('Medientry'),
  MAIL_FROM_EMAIL: z.string().email('MAIL_FROM_EMAIL must be a valid email address.').optional(),
  MAIL_REPLY_TO_EMAIL: z
    .string()
    .email('MAIL_REPLY_TO_EMAIL must be a valid email address.')
    .optional(),
  MAIL_REPLY_TO: z.string().email('MAIL_REPLY_TO must be a valid email address.').optional(),
  ADMIN_NOTIFICATION_EMAILS: z.string().optional(),
  WHATSAPP_NUMBER: z.string().optional(),
  WHATSAPP_DISPLAY_NUMBER: z.string().optional(),
  MAIL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  MAIL_GREETING_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  MAIL_SOCKET_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),
  SEED_SUPER_ADMIN_NAME: z.string().min(1).default('Super Admin'),
  SEED_SUPER_ADMIN_EMAIL: z
    .string()
    .email('SEED_SUPER_ADMIN_EMAIL must be a valid email address.')
    .default('admin@example.com'),
  SEED_SUPER_ADMIN_PASSWORD: z
    .string()
    .min(8, 'SEED_SUPER_ADMIN_PASSWORD must be at least 8 characters long.')
    .optional(),
})
  .superRefine((value, context) => {
    if (value.MEDIA_MAX_DOCUMENT_BYTES > value.MEDIA_MAX_IMAGE_BYTES * 5) {
      context.addIssue({
        code: 'custom',
        path: ['MEDIA_MAX_DOCUMENT_BYTES'],
        message: 'MEDIA_MAX_DOCUMENT_BYTES is unexpectedly large. Keep document limits conservative.',
      });
    }

    if (value.NODE_ENV === 'production' && value.STORAGE_DRIVER === 'database' && !value.SERVER_PUBLIC_URL?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['SERVER_PUBLIC_URL'],
        message: 'SERVER_PUBLIC_URL is required when STORAGE_DRIVER=database in production.',
      });
    }

    if (!value.MAIL_ENABLED) {
      return;
    }

    if (!value.MAIL_USER?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['MAIL_USER'],
        message: 'MAIL_USER is required when MAIL_ENABLED=true.',
      });
    }

    if (!value.MAIL_PASS?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['MAIL_PASS'],
        message: 'MAIL_PASS is required when MAIL_ENABLED=true.',
      });
    }

    if (!value.MAIL_FROM_EMAIL?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['MAIL_FROM_EMAIL'],
        message: 'MAIL_FROM_EMAIL is required when MAIL_ENABLED=true.',
      });
    }

    if (!resolveReplyToEmail(value.MAIL_REPLY_TO_EMAIL, value.MAIL_REPLY_TO)) {
      context.addIssue({
        code: 'custom',
        path: ['MAIL_REPLY_TO_EMAIL'],
        message:
          'MAIL_REPLY_TO_EMAIL is required when MAIL_ENABLED=true. MAIL_REPLY_TO remains supported as a legacy fallback.',
      });
    }

    if (value.MAIL_PORT === 25) {
      context.addIssue({
        code: 'custom',
        path: ['MAIL_PORT'],
        message: 'MAIL_PORT=25 is not supported. Use 465 for SSL or 587 for STARTTLS.',
      });
    }

    try {
      const recipients = parseAdminNotificationEmails(value.ADMIN_NOTIFICATION_EMAILS);

      if (recipients.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['ADMIN_NOTIFICATION_EMAILS'],
          message:
            'ADMIN_NOTIFICATION_EMAILS must include at least one valid email address when MAIL_ENABLED=true.',
        });
      }
    } catch (error) {
      context.addIssue({
        code: 'custom',
        path: ['ADMIN_NOTIFICATION_EMAILS'],
        message:
          error instanceof Error
            ? error.message
            : 'ADMIN_NOTIFICATION_EMAILS contains an invalid email address.',
      });
    }
  });
