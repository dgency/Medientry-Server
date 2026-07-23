import { z } from 'zod';

const emailSchema = z.string().trim().email('Invalid email address.');

export type MailConfigSource = {
  MAIL_ENABLED: boolean;
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_SECURE: boolean;
  MAIL_REQUIRE_TLS: boolean;
  MAIL_USER?: string;
  MAIL_PASS?: string;
  MAIL_FROM_NAME: string;
  MAIL_FROM_EMAIL?: string;
  MAIL_REPLY_TO_EMAIL?: string;
  MAIL_REPLY_TO?: string;
  ADMIN_NOTIFICATION_EMAILS?: string;
  MAIL_CONNECTION_TIMEOUT_MS: number;
  MAIL_GREETING_TIMEOUT_MS: number;
  MAIL_SOCKET_TIMEOUT_MS: number;
};

export type MailRuntimeConfig = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  requireTls: boolean;
  user?: string;
  pass?: string;
  fromName: string;
  fromEmail?: string;
  replyToEmail?: string;
  adminNotificationEmails: string[];
  connectionTimeoutMs: number;
  greetingTimeoutMs: number;
  socketTimeoutMs: number;
};

export const sanitizeHeaderValue = (value: string) =>
  value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

export const validateEmailAddress = (value: string, label = 'email address') => {
  const safeValue = sanitizeHeaderValue(value);

  try {
    return emailSchema.parse(safeValue.toLowerCase());
  } catch {
    throw new Error(`Invalid ${label}: ${safeValue || 'empty value'}.`);
  }
};

export const parseAdminNotificationEmails = (value?: string | null) => {
  if (!value) {
    return [];
  }

  const recipients = value
    .split(',')
    .map((item) => sanitizeHeaderValue(item))
    .filter(Boolean);
  const uniqueRecipients = new Map<string, string>();

  for (const recipient of recipients) {
    const normalizedEmail = validateEmailAddress(recipient, 'admin notification email');

    if (!uniqueRecipients.has(normalizedEmail)) {
      uniqueRecipients.set(normalizedEmail, normalizedEmail);
    }
  }

  return [...uniqueRecipients.values()];
};

export const resolveReplyToEmail = (primary?: string | null, legacy?: string | null) => {
  const preferredValue = primary?.trim() || legacy?.trim();

  if (!preferredValue) {
    return undefined;
  }

  return validateEmailAddress(preferredValue, 'reply-to email');
};

export const buildMailRuntimeConfig = (source: MailConfigSource): MailRuntimeConfig => {
  const normalizedPort = source.MAIL_PORT;
  const normalizedSecure =
    normalizedPort === 465 ? true : normalizedPort === 587 ? false : source.MAIL_SECURE;
  const normalizedRequireTls = normalizedPort === 587 ? true : source.MAIL_REQUIRE_TLS;

  return {
    enabled: source.MAIL_ENABLED,
    host: source.MAIL_HOST.trim(),
    port: normalizedPort,
    secure: normalizedSecure,
    requireTls: normalizedRequireTls,
    user: source.MAIL_USER?.trim() || undefined,
    pass: source.MAIL_PASS?.trim() || undefined,
    fromName: sanitizeHeaderValue(source.MAIL_FROM_NAME),
    fromEmail: source.MAIL_FROM_EMAIL?.trim()
      ? validateEmailAddress(source.MAIL_FROM_EMAIL, 'sender email')
      : undefined,
    replyToEmail: resolveReplyToEmail(source.MAIL_REPLY_TO_EMAIL, source.MAIL_REPLY_TO),
    adminNotificationEmails: parseAdminNotificationEmails(source.ADMIN_NOTIFICATION_EMAILS),
    connectionTimeoutMs: source.MAIL_CONNECTION_TIMEOUT_MS,
    greetingTimeoutMs: source.MAIL_GREETING_TIMEOUT_MS,
    socketTimeoutMs: source.MAIL_SOCKET_TIMEOUT_MS,
  };
};
