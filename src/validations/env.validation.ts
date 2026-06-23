import { z } from 'zod';

const booleanString = () =>
  z
    .string()
    .optional()
    .transform((value) => value?.trim().toLowerCase() === 'true');

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
  CORS_ORIGINS: z.string().optional(),
  PUBLIC_BASE_URL: z.url('PUBLIC_BASE_URL must be a valid URL.').optional(),
  MAIL_ENABLED: booleanString(),
  MAIL_HOST: z.string().default('smtp.gmail.com'),
  MAIL_PORT: z.coerce.number().int().positive().default(587),
  MAIL_SECURE: booleanString(),
  MAIL_REQUIRE_TLS: booleanString().default(true),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM_NAME: z.string().default('Medientry'),
  MAIL_FROM_EMAIL: z.string().email('MAIL_FROM_EMAIL must be a valid email address.').optional(),
  MAIL_REPLY_TO: z.string().email('MAIL_REPLY_TO must be a valid email address.').optional(),
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
  });
