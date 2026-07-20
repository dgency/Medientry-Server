import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../src/utils/api-error';
import {
  buildAdminFormNotificationTemplate,
  createMailer,
  getSafeMailErrorSummary,
  validateMailRuntimeConfig,
} from '../src/utils/mailer';
import { buildMailRuntimeConfig, parseAdminNotificationEmails } from '../src/utils/mail-config';

const createBaseConfig = () =>
  buildMailRuntimeConfig({
    MAIL_ENABLED: true,
    MAIL_HOST: 'smtp.gmail.com',
    MAIL_PORT: 587,
    MAIL_SECURE: false,
    MAIL_REQUIRE_TLS: true,
    MAIL_USER: 'medientry@gmail.com',
    MAIL_PASS: 'super-secret-app-password',
    MAIL_FROM_NAME: 'Medientry',
    MAIL_FROM_EMAIL: 'medientry@gmail.com',
    MAIL_REPLY_TO_EMAIL: 'medientry@gmail.com',
    MAIL_REPLY_TO: undefined,
    ADMIN_NOTIFICATION_EMAILS:
      ' medientry@gmail.com, info@medientrybd.com ,medientry@gmail.com,anik.dgency@gmail.com ',
    MAIL_CONNECTION_TIMEOUT_MS: 10000,
    MAIL_GREETING_TIMEOUT_MS: 10000,
    MAIL_SOCKET_TIMEOUT_MS: 20000,
  });

test('parseAdminNotificationEmails trims whitespace and removes duplicates', () => {
  assert.deepEqual(parseAdminNotificationEmails(' a@example.com, b@example.com, A@example.com '), [
    'a@example.com',
    'b@example.com',
  ]);
});

test('parseAdminNotificationEmails rejects invalid recipient values', () => {
  assert.throws(
    () => parseAdminNotificationEmails('valid@example.com, not-an-email'),
    /Invalid admin notification email/i,
  );
});

test('validateMailRuntimeConfig rejects missing required values when enabled', () => {
  const invalidConfig = {
    ...createBaseConfig(),
    pass: undefined,
    replyToEmail: undefined,
    adminNotificationEmails: [],
  };

  assert.throws(
    () => validateMailRuntimeConfig(invalidConfig),
    /MAIL_PASS is required.*MAIL_REPLY_TO_EMAIL is required.*ADMIN_NOTIFICATION_EMAILS/s,
  );
});

test('createMailer skips delivery cleanly when mail is disabled', async () => {
  let createTransportCalled = false;
  const mailer = createMailer(
    {
      ...createBaseConfig(),
      enabled: false,
    },
    {
      createTransport: () => {
        createTransportCalled = true;
        throw new Error('should not create transport');
      },
    },
  );

  const result = await mailer.sendAdminFormNotification({
    formName: 'Free Book Consultation',
    submissionId: 'lead-1',
    submittedAt: new Date('2026-07-19T10:00:00.000Z'),
    customerName: 'Test User',
  });

  assert.deepEqual(result, {
    skipped: true,
    reason: 'mail-disabled',
  });
  assert.equal(createTransportCalled, false);
});

test('admin notifications use the configured sender, reply-to, and all unique admin recipients', async () => {
  const sentMessages: Array<Record<string, unknown>> = [];
  const mailer = createMailer(createBaseConfig(), {
    createTransport: () =>
      ({
        verify: async () => true,
        sendMail: async (message: Record<string, unknown>) => {
          sentMessages.push(message);
          return { messageId: 'message-1' };
        },
      }) as never,
  });

  const result = await mailer.sendAdminFormNotification({
    formName: 'Free Book Consultation',
    submissionId: 'lead-1',
    submittedAt: new Date('2026-07-19T10:00:00.000Z'),
    customerName: 'Test User',
    customerEmail: 'student@example.com',
    replyTo: 'student@example.com',
  });

  assert.equal(result.skipped, false);
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].from, '"Medientry" <medientry@gmail.com>');
  assert.equal(sentMessages[0].replyTo, 'student@example.com');
  assert.deepEqual(sentMessages[0].to, ['medientry@gmail.com']);
  assert.deepEqual(sentMessages[0].bcc, ['info@medientrybd.com', 'anik.dgency@gmail.com']);
});

test('customer confirmations use the Medientry sender and configured reply-to', async () => {
  const sentMessages: Array<Record<string, unknown>> = [];
  const mailer = createMailer(createBaseConfig(), {
    createTransport: () =>
      ({
        verify: async () => true,
        sendMail: async (message: Record<string, unknown>) => {
          sentMessages.push(message);
          return { messageId: 'message-2' };
        },
      }) as never,
  });

  await mailer.sendCustomerConfirmation({
    to: 'student@example.com',
    subject: 'We received your enquiry',
    heading: 'Thank you',
    intro: 'We have received your enquiry.',
  });

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].from, '"Medientry" <medientry@gmail.com>');
  assert.equal(sentMessages[0].replyTo, 'medientry@gmail.com');
});

test('admin notification template escapes HTML and strips header-injection from the subject', () => {
  const template = buildAdminFormNotificationTemplate({
    formName: 'College Fee Inquiry\r\nBCC: bad@example.com',
    submissionId: 'inq-1',
    submittedAt: new Date('2026-07-19T10:00:00.000Z'),
    customerName: '<Student Name>',
    fields: [{ label: 'Message', value: '<script>alert(1)</script>' }],
  });

  assert.equal(template.subject.includes('\n'), false);
  assert.match(template.subject, /^New College Fee Inquiry BCC: bad@example.com Submission - <Student Name>$/);
  assert.match(template.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('admin notification template renders footer metadata and clickable source URLs for consultation emails', () => {
  const template = buildAdminFormNotificationTemplate({
    formName: 'Book Free Consultation',
    submissionId: 'MBD-001',
    subject: 'New Book Free Consultation - MBD-001 - Aisha Rahman',
    submittedAt: new Date('2026-07-19T12:58:00.000Z'),
    sourcePageUrl: 'https://medientrybd.com/contact',
    summaryFields: [{ label: 'Tracking ID', value: 'MBD-001' }],
    displayTimeZone: 'Asia/Dhaka',
    displayTimeZoneLabel: 'Asia/Dhaka (Bangladesh Time)',
  });

  assert.match(template.subject, /MBD-001/);
  assert.match(template.html, /Submission Information/);
  assert.match(template.html, /https:\/\/medientrybd\.com\/contact/);
  assert.match(template.html, /19 July 2026/);
  assert.match(template.html, /Bangladesh Time/);
  assert.doesNotMatch(template.html, /medientry-logo/i);
  assert.doesNotMatch(template.html, /Step 1|Step 2|Step 3/);
});

test('admin notification template renders clickable mailto and tel links for inquiry summary fields', () => {
  const template = buildAdminFormNotificationTemplate({
    formName: 'College Fee Inquiry',
    submissionId: 'INQ-001',
    subject: 'New College Fee Inquiry \u2014 INQ-001 \u2014 Aisha Rahman',
    submittedAt: new Date('2026-07-19T12:58:00.000Z'),
    summaryFields: [
      { label: 'Inquiry ID', value: 'INQ-001' },
      { label: 'Customer Email', value: 'aisha@example.com', href: 'mailto:aisha@example.com' },
      { label: 'Phone Number', value: '+8801711111111', href: 'tel:+8801711111111' },
    ],
  });

  assert.match(template.subject, /INQ-001/);
  assert.match(template.html, /href="mailto:aisha@example\.com"/);
  assert.match(template.html, /href="tel:\+8801711111111"/);
});

test('mailer returns a sanitized ApiError when SMTP delivery fails', async () => {
  const mailer = createMailer(createBaseConfig(), {
    createTransport: () =>
      ({
        verify: async () => true,
        sendMail: async () => {
          throw new Error('SMTP auth failed for super-secret-app-password');
        },
      }) as never,
  });

  await assert.rejects(
    () =>
      mailer.sendMail({
        to: 'student@example.com',
        subject: 'Subject',
        html: '<p>Test</p>',
        text: 'Test',
      }),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.message, 'Email delivery failed. Please try again later.');
      return true;
    },
  );
});

test('getSafeMailErrorSummary redacts SMTP passwords', () => {
  const summary = getSafeMailErrorSummary(new Error('Failed with super-secret-app-password'), {
    user: 'medientry@gmail.com',
    pass: 'super-secret-app-password',
  });

  assert.match(summary.message, /\[redacted\]/);
  assert.doesNotMatch(summary.message, /super-secret-app-password/);
});
