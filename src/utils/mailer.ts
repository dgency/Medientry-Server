import nodemailer from 'nodemailer';

import { env } from '../config/env';
import {
  buildMailRuntimeConfig,
  sanitizeHeaderValue,
  validateEmailAddress,
  type MailRuntimeConfig,
} from './mail-config';
import { ApiError } from './api-error';
import { resolvePublicWebsiteUrl } from './public-site-url';

type TemplateArrayValue = string | number | boolean | Date;
type TemplateValue = TemplateArrayValue | readonly TemplateArrayValue[] | null | undefined;

export type EmailTemplateField = {
  label: string;
  value?: TemplateValue;
  href?: string | null;
};

export type EmailTemplateSection = {
  title: string;
  fields: EmailTemplateField[];
};

type MailErrorShape = Error & {
  code?: string;
  command?: string;
  responseCode?: number;
};

export type MailSendInput = {
  to: string | string[];
  bcc?: string | string[];
  replyTo?: string | null;
  subject: string;
  html: string;
  text: string;
};

export type AdminFormNotificationInput = {
  formName: string;
  submissionId: string;
  submittedAt: string | Date;
  trackingId?: string;
  customerName?: string;
  customerEmail?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  sourcePageUrl?: string | null;
  subject?: string;
  title?: string;
  intro?: string;
  summaryFields?: EmailTemplateField[];
  detailSections?: EmailTemplateSection[];
  footerFields?: EmailTemplateField[];
  footerNote?: string | null;
  fields?: EmailTemplateField[];
  actionUrl?: string | null;
  actionLabel?: string | null;
  replyTo?: string | null;
  displayTimeZone?: string;
  displayTimeZoneLabel?: string;
};

export type CustomerConfirmationInput = {
  to: string;
  subject: string;
  heading: string;
  intro: string;
  trackingId?: string;
  eyebrow?: string;
  summaryFields?: EmailTemplateField[];
  fields?: EmailTemplateField[];
  sourcePageUrl?: string | null;
  submittedAt?: string | Date;
  displayTimeZone?: string;
  displayTimeZoneLabel?: string;
  whatsappDisplayNumber?: string | null;
  whatsappActionUrl?: string | null;
  footer?: string | null;
};

export type MailSendResult =
  | {
      skipped: true;
      reason: 'mail-disabled' | 'no-admin-recipients';
    }
  | {
      skipped: false;
      messageId?: string;
    };

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type MailerDependencies = {
  createTransport?: typeof nodemailer.createTransport;
};

const escapeHtml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const normalizeTemplateValue = (value: TemplateValue): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    const normalizedValues: string[] = value
      .map((item) => normalizeTemplateValue(item))
      .filter((item): item is string => Boolean(item));

    return normalizedValues.length > 0 ? normalizedValues.join(', ') : null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  const normalizedValue = `${value}`.trim();
  return normalizedValue ? normalizedValue : null;
};

const normalizeField = (field: EmailTemplateField) => {
  const label = sanitizeHeaderValue(field.label);
  const value = normalizeTemplateValue(field.value);
  const href = field.href?.trim() ? resolvePublicWebsiteUrl(field.href) : undefined;

  if (!label || !value) {
    return null;
  }

  return {
    label,
    value,
    href,
  };
};

const formatSubmittedAtForDisplay = (
  value: string | Date,
  timeZone = 'UTC',
  timeZoneLabel = 'UTC',
) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: null,
      time: null,
      timeZoneLabel,
    };
  }

  return {
    date: new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone,
    }).format(date),
    time: `${new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone,
    }).format(date)} ${timeZoneLabel}`,
    timeZoneLabel,
  };
};

const isSafeHttpUrl = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value));
const isSafeFieldHref = (value?: string | null) =>
  Boolean(value && /^(https?:\/\/|mailto:|tel:)/i.test(value));

const normalizeTemplateFields = (fields: EmailTemplateField[]) =>
  fields
    .map(normalizeField)
    .filter((field): field is NonNullable<ReturnType<typeof normalizeField>> => Boolean(field));

const renderFieldValue = (field: NonNullable<ReturnType<typeof normalizeField>>) =>
  field.href && isSafeFieldHref(field.href)
    ? `<a href="${escapeHtml(field.href)}" style="color:#146736;text-decoration:underline;word-break:break-word;" target="_blank">${escapeHtml(field.value)}</a>`
    : escapeHtml(field.value);

const renderTableRows = (
  fields: Array<NonNullable<ReturnType<typeof normalizeField>>>,
) =>
  fields
    .map(
      (field) => `
        <tr>
          <td width="34%" valign="top" style="padding:11px 12px;font-weight:700;border:1px solid #dbe5df;background:#f6fbf8;vertical-align:top;width:34%;font-size:13px;line-height:1.45;color:#22352d">
            ${escapeHtml(field.label)}
          </td>
          <td width="66%" valign="top" style="padding:11px 12px;border:1px solid #dbe5df;word-break:break-word;vertical-align:top;width:66%;font-size:13px;line-height:1.45;color:#172b21">
            ${renderFieldValue(field)}
          </td>
        </tr>
      `,
    )
    .join('');

const renderTextSection = (title: string, fields: EmailTemplateField[]) => {
  const lines = normalizeTemplateFields(fields).map((field) => `${field.label}: ${field.value}`);

  if (lines.length === 0) {
    return '';
  }

  return [title, ...lines].join('\n');
};

const renderDataSection = ({
  title,
  fields,
  marginTop = 20,
}: {
  title: string;
  fields: EmailTemplateField[];
  marginTop?: number;
}) => {
  const normalizedFields = normalizeTemplateFields(fields);

  if (normalizedFields.length === 0) {
    return '';
  }

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:${marginTop}px">
      <tbody>
        <tr>
          <td style="padding:0 0 12px;font-size:17px;line-height:1.3;font-weight:700;color:#1c3429">
            ${escapeHtml(title)}
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #dbe5df;border-radius:14px;overflow:hidden">
              <tbody>
                ${renderTableRows(normalizedFields)}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;
};

const renderTrackingBadge = (value?: string | null) => {
  const safeValue = sanitizeHeaderValue(value || '');

  if (!safeValue) {
    return '';
  }

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" style="margin-left:12px;">
      <tr>
        <td style="padding:8px 14px;border-radius:999px;background:#ffffff;color:#146736;font-size:13px;line-height:1.2;font-weight:700;white-space:nowrap;">
          ${escapeHtml(safeValue)}
        </td>
      </tr>
    </table>
  `;
};

const renderAdminNotificationLayout = ({
  eyebrow,
  title,
  intro,
  trackingBadge,
  content,
  footerContent,
  footerNote,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  trackingBadge?: string;
  content: string;
  footerContent: string;
  footerNote: string;
}) => {
  return `
    <div style="margin:0;padding:24px 12px;background:#f2f5f3;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:660px;background:#ffffff;border:1px solid #dbe5df;border-radius:12px;overflow:hidden;font-family:Arial,sans-serif;color:#10261a;">
              <tr>
                <td style="padding:22px 24px;background:#146736;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="right" style="padding:0 0 8px;">
                        ${trackingBadge ?? ''}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 8px;font-size:11px;line-height:1.5;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#dff4e7;">
                        ${escapeHtml(eyebrow)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 6px;font-size:28px;line-height:1.18;font-weight:700;color:#ffffff;">
                        ${escapeHtml(title)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0;font-size:14px;line-height:1.55;color:#e9f5ed;">
                        ${escapeHtml(intro)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  ${content}
                  ${footerContent}
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:16px;">
                    <tr>
                      <td style="padding:0;font-size:12px;line-height:1.6;color:#607066;">
                        ${escapeHtml(footerNote)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

export const buildAdminFormNotificationTemplate = (
  input: AdminFormNotificationInput,
): EmailTemplate => {
  const formName = sanitizeHeaderValue(input.formName) || 'Website Form';
  const customerName = sanitizeHeaderValue(input.customerName || '') || 'Unknown sender';
  const title = sanitizeHeaderValue(input.title || formName) || formName;
  const intro =
    sanitizeHeaderValue(input.intro || '') ||
    'A new public website form submission has been saved successfully and is ready for follow-up.';
  const readableSubmittedAt = formatSubmittedAtForDisplay(
    input.submittedAt,
    input.displayTimeZone,
    input.displayTimeZoneLabel,
  );
  const safeActionUrl = resolvePublicWebsiteUrl(input.actionUrl);
  const safeSourcePageUrl = resolvePublicWebsiteUrl(input.sourcePageUrl);
  const rawSummaryFields = input.summaryFields?.length
    ? input.summaryFields
    : input.fields?.length
      ? input.fields
      : [
          { label: 'Form Name', value: formName },
          { label: 'Submission ID', value: input.submissionId },
          { label: 'Customer Name', value: input.customerName },
          { label: 'Customer Email', value: input.customerEmail ?? undefined },
          { label: 'Phone Number', value: input.phoneNumber ?? undefined },
          { label: 'WhatsApp Number', value: input.whatsappNumber ?? undefined },
        ];
  const summaryFields = rawSummaryFields.filter((field) => {
    const normalizedLabel = sanitizeHeaderValue(field.label).toLowerCase();

    return !['form name', 'submission id', 'inquiry id', 'tracking id'].includes(normalizedLabel);
  });
  const footerFields =
    input.footerFields && input.footerFields.length > 0
      ? input.footerFields
      : [
          { label: 'Source Page URL', value: safeSourcePageUrl ?? undefined, href: safeSourcePageUrl },
          { label: 'Submission Date', value: readableSubmittedAt.date },
          { label: 'Submission Time', value: readableSubmittedAt.time },
        ];
  const detailSections = (input.detailSections ?? [])
    .map((section) => renderDataSection({ title: section.title, fields: section.fields }))
    .filter(Boolean)
    .join('');
  const html = renderAdminNotificationLayout({
    eyebrow: 'MediEntry Admin Alert',
    title,
    intro,
    trackingBadge: renderTrackingBadge(input.trackingId ?? input.submissionId),
    content: [
      renderDataSection({ title: 'Submission Summary', fields: summaryFields, marginTop: 0 }),
      renderDataSection({ title: 'Submission Information', fields: footerFields }),
      detailSections,
    ]
      .filter(Boolean)
      .join(''),
    footerContent: '',
    footerNote:
      input.footerNote ??
      'This notification was generated automatically by the MediEntry website. Please follow up with the student or guardian using the validated contact details above.',
  });

  return {
    subject:
      sanitizeHeaderValue(input.subject || '') ||
      sanitizeHeaderValue(`New ${formName} Submission - ${customerName}`),
    html,
    text: [
      'MediEntry Admin Alert',
      `Form: ${title}`,
      renderTextSection('Submission Summary', summaryFields),
      renderTextSection('Submission Information', footerFields),
      safeActionUrl ? `Open in Admin: ${safeActionUrl}` : undefined,
      input.footerNote ??
        'This notification was generated automatically by the MediEntry website. Please follow up with the student or guardian using the validated contact details above.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
};

export const buildCustomerConfirmationTemplate = (
  input: CustomerConfirmationInput,
): EmailTemplate => {
  const summaryFields = input.summaryFields?.length ? input.summaryFields : input.fields ?? [];
  const readableSubmittedAt =
    input.submittedAt === undefined
      ? null
      : formatSubmittedAtForDisplay(
          input.submittedAt,
          input.displayTimeZone,
          input.displayTimeZoneLabel,
        );
  const safeSourcePageUrl = resolvePublicWebsiteUrl(input.sourcePageUrl);
  const footerFields: EmailTemplateField[] = [
    { label: 'Source Page URL', value: safeSourcePageUrl ?? undefined, href: safeSourcePageUrl },
    { label: 'Submission Date', value: readableSubmittedAt?.date ?? undefined },
    { label: 'Submission Time', value: readableSubmittedAt?.time ?? undefined },
  ];
  const visibleSummaryFields = summaryFields.filter((field) => {
    const normalizedLabel = sanitizeHeaderValue(field.label).toLowerCase();

    return !['form name', 'submission id', 'inquiry id', 'tracking id'].includes(normalizedLabel);
  });
  const html = renderAdminNotificationLayout({
    eyebrow: sanitizeHeaderValue(input.eyebrow || 'Medientry'),
    title: sanitizeHeaderValue(input.heading),
    intro: sanitizeHeaderValue(input.intro),
    trackingBadge: renderTrackingBadge(input.trackingId),
    content: [
      renderDataSection({ title: 'Submission Summary', fields: visibleSummaryFields, marginTop: 0 }),
      renderDataSection({ title: 'Submission Information', fields: footerFields }),
    ]
      .filter(Boolean)
      .join(''),
    footerContent: '',
    footerNote:
      input.footer ??
      'Thank you for contacting Medientry. Our team will review your request and get in touch using the details you submitted.',
  });

  return {
    subject: sanitizeHeaderValue(input.subject),
    html,
    text: [
      sanitizeHeaderValue(input.eyebrow || 'MediEntry Confirmation'),
      sanitizeHeaderValue(input.heading),
      sanitizeHeaderValue(input.intro),
      renderTextSection('Submission Summary', summaryFields),
      renderTextSection('Submission Information', footerFields),
      input.footer ? sanitizeHeaderValue(input.footer) : undefined,
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
};

export const validateMailRuntimeConfig = (config: MailRuntimeConfig) => {
  if (!config.enabled) {
    return;
  }

  const issues: string[] = [];

  if (!config.user) {
    issues.push('MAIL_USER is required when MAIL_ENABLED=true.');
  }

  if (!config.pass) {
    issues.push('MAIL_PASS is required when MAIL_ENABLED=true.');
  }

  if (!config.fromEmail) {
    issues.push('MAIL_FROM_EMAIL is required when MAIL_ENABLED=true.');
  }

  if (!config.replyToEmail) {
    issues.push('MAIL_REPLY_TO_EMAIL is required when MAIL_ENABLED=true.');
  }

  if (config.adminNotificationEmails.length === 0) {
    issues.push(
      'ADMIN_NOTIFICATION_EMAILS must include at least one valid recipient when MAIL_ENABLED=true.',
    );
  }

  if (issues.length > 0) {
    throw new ApiError(500, issues.join(' '));
  }
};

export const sanitizeMailErrorMessage = (
  message: string,
  config: Pick<MailRuntimeConfig, 'user' | 'pass'>,
) => {
  return [config.user, config.pass]
    .filter((value): value is string => Boolean(value))
    .reduce(
      (safeMessage, sensitiveValue) => safeMessage.split(sensitiveValue).join('[redacted]'),
      message,
    );
};

export const getSafeMailErrorSummary = (
  error: unknown,
  config: Pick<MailRuntimeConfig, 'user' | 'pass'> = buildMailRuntimeConfig(env),
) => {
  if (error instanceof Error) {
    const mailError = error as MailErrorShape;

    return {
      name: mailError.name,
      message: sanitizeMailErrorMessage(mailError.message, config),
      code: mailError.code,
      command: mailError.command,
      responseCode: mailError.responseCode,
    };
  }

  return {
    message: 'Unknown email transport failure.',
  };
};

export const createMailer = (
  config: MailRuntimeConfig,
  dependencies: MailerDependencies = {},
) => {
  const transportFactory = dependencies.createTransport ?? nodemailer.createTransport;
  let transporterCache: ReturnType<typeof nodemailer.createTransport> | null = null;
  let transporterVerificationPromise: Promise<void> | null = null;
  let hasLoggedVerificationSuccess = false;

  const normalizeRecipients = (input: string | string[]) => {
    const recipients = Array.isArray(input) ? input : [input];

    if (recipients.length === 0) {
      throw new ApiError(400, 'At least one recipient is required.');
    }

    return recipients.map((recipient, index) =>
      validateEmailAddress(recipient, `recipient email ${index + 1}`),
    );
  };

  const normalizeReplyTo = (value?: string | null) => {
    if (!value?.trim()) {
      return undefined;
    }

    return validateEmailAddress(value, 'reply-to email');
  };

  const getTransporter = () => {
    validateMailRuntimeConfig(config);

    if (!transporterCache) {
      transporterCache = transportFactory({
        host: config.host,
        port: config.port,
        secure: config.secure || config.port === 465,
        requireTLS: config.requireTls,
        connectionTimeout: config.connectionTimeoutMs,
        greetingTimeout: config.greetingTimeoutMs,
        socketTimeout: config.socketTimeoutMs,
        auth: {
          user: config.user!,
          pass: config.pass!,
        },
      });
    }

    return transporterCache;
  };

  const verifyMailConnection = async () => {
    if (!config.enabled) {
      return { skipped: true, reason: 'mail-disabled' } satisfies MailSendResult;
    }

    validateMailRuntimeConfig(config);

    if (!transporterVerificationPromise) {
      transporterVerificationPromise = getTransporter()
        .verify()
        .then(() => undefined)
        .catch((error) => {
          transporterCache = null;
          transporterVerificationPromise = null;
          throw error;
        });
    }

    try {
      await transporterVerificationPromise;

      if (!hasLoggedVerificationSuccess) {
        console.log('SMTP connection verified successfully.');
        hasLoggedVerificationSuccess = true;
      }

      return {
        skipped: false,
      } satisfies MailSendResult;
    } catch (error) {
      const safeErrorSummary = getSafeMailErrorSummary(error, config);

      console.error(
        `SMTP connection verification failed: ${safeErrorSummary.message ?? 'Unknown SMTP verification error.'}`,
      );
      console.error('[mailer] Email transport verification failed.', safeErrorSummary);
      throw new ApiError(503, 'Email delivery failed. Please try again later.');
    }
  };

  const sendMail = async (input: MailSendInput): Promise<MailSendResult> => {
    if (!config.enabled) {
      return {
        skipped: true,
        reason: 'mail-disabled',
      };
    }

    const subject = sanitizeHeaderValue(input.subject);
    const html = input.html.trim();
    const text = input.text.trim();

    if (!subject || !html || !text) {
      throw new ApiError(400, 'Email subject, html, and text content are required.');
    }

    try {
      const recipients = normalizeRecipients(input.to);
      const bccRecipients =
        input.bcc === undefined ? undefined : normalizeRecipients(input.bcc);
      const replyTo = normalizeReplyTo(input.replyTo ?? config.replyToEmail ?? undefined);
      const transporter = getTransporter();

      await verifyMailConnection();

      const response = await transporter.sendMail({
        from: `"${sanitizeHeaderValue(config.fromName)}" <${config.fromEmail!}>`,
        to: recipients,
        ...(bccRecipients && bccRecipients.length > 0 ? { bcc: bccRecipients } : {}),
        replyTo,
        subject,
        html,
        text,
      });

      if (!Array.isArray(response.accepted) || response.accepted.length === 0) {
        throw new Error('SMTP server did not accept any recipients.');
      }

      return {
        skipped: false,
        messageId: response.messageId,
      };
    } catch (error) {
      console.error('[mailer] Email transport failure.', getSafeMailErrorSummary(error, config));
      throw new ApiError(503, 'Email delivery failed. Please try again later.');
    }
  };

  const sendAdminFormNotification = async (
    input: AdminFormNotificationInput,
  ): Promise<MailSendResult> => {
    if (!config.enabled) {
      return {
        skipped: true,
        reason: 'mail-disabled',
      };
    }

    if (config.adminNotificationEmails.length === 0) {
      return {
        skipped: true,
        reason: 'no-admin-recipients',
      };
    }

    const template = buildAdminFormNotificationTemplate(input);
    const [primaryRecipient, ...bccRecipients] = config.adminNotificationEmails;

    return sendMail({
      to: primaryRecipient,
      ...(bccRecipients.length > 0 ? { bcc: bccRecipients } : {}),
      replyTo: input.replyTo ?? config.replyToEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  };

  const sendCustomerConfirmation = async (
    input: CustomerConfirmationInput,
  ): Promise<MailSendResult> => {
    const template = buildCustomerConfirmationTemplate(input);

    return sendMail({
      to: input.to,
      replyTo: config.replyToEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  };

  return {
    sendMail,
    sendAdminFormNotification,
    sendCustomerConfirmation,
    verifyMailConnection,
  };
};

const runtimeMailConfig = buildMailRuntimeConfig(env);
const runtimeMailer = createMailer(runtimeMailConfig);

export const sendMail = runtimeMailer.sendMail;
export const sendAdminFormNotification = runtimeMailer.sendAdminFormNotification;
export const sendCustomerConfirmation = runtimeMailer.sendCustomerConfirmation;
export const verifyMailConnection = runtimeMailer.verifyMailConnection;
export const getAdminNotificationRecipients = () => [...runtimeMailConfig.adminNotificationEmails];
