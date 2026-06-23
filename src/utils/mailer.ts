import nodemailer from 'nodemailer';

import { env } from '../config/env';
import { ApiError } from './api-error';

type TemplateContext = Record<string, string | number | undefined | null>;

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type MailErrorShape = Error & {
  code?: string;
  command?: string;
  responseCode?: number;
};

type ContactFormTemplateContext = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
};

type AdmissionEnquiryTemplateContext = {
  name: string;
  email: string;
  phone?: string;
  destination?: string;
  preferredCollege?: string;
  message?: string;
};

type AdmissionEnquiryConfirmationTemplateContext = {
  name: string;
  preferredCollege?: string;
  supportEmail?: string;
  supportPhone?: string;
};

type ConsultationLeadTemplateContext = {
  name: string;
  userRole: string;
  whatsappNumber: string;
  phoneNumber: string;
  passingYear: string;
  neetScore?: string;
  stateName: string;
  preferredCollege?: string;
  sourcePage?: string;
};

type AdminNotificationTemplateContext = {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
};

type SendEmailInput = {
  to: string | string[];
  replyTo?: string;
  subject?: string;
  html?: string;
  text?: string;
  template?:
    | {
        name: 'contactFormNotification';
        context: ContactFormTemplateContext;
      }
    | {
        name: 'admissionEnquiry';
        context: AdmissionEnquiryTemplateContext;
      }
    | {
        name: 'admissionEnquiryConfirmation';
        context: AdmissionEnquiryConfirmationTemplateContext;
      }
    | {
        name: 'consultationLead';
        context: ConsultationLeadTemplateContext;
      }
    | {
        name: 'adminNotification';
        context: AdminNotificationTemplateContext;
      };
};

const escapeHtml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const renderRows = (fields: Array<{ label: string; value?: string | number | null }>) => {
  return fields
    .filter((field) => field.value !== undefined && field.value !== null && `${field.value}`.trim() !== '')
    .map((field) => {
      return `
        <tr>
          <td style="padding:10px 12px;font-weight:600;border:1px solid #e5e7eb;background:#f8fafc;">${escapeHtml(field.label)}</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;">${escapeHtml(String(field.value))}</td>
        </tr>
      `;
    })
    .join('');
};

const baseTemplate = (title: string, intro: string, rows: string, footer?: string) => {
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeFooter = footer ? escapeHtml(footer) : '';

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;color:#111827;">
      <div style="padding:24px;border-bottom:4px solid #0f766e;">
        <h1 style="margin:0;font-size:24px;">${safeTitle}</h1>
        <p style="margin:12px 0 0;color:#4b5563;line-height:1.6;">${safeIntro}</p>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;">
          ${rows}
        </table>
      </div>
      <div style="padding:0 24px 24px;color:#6b7280;font-size:14px;">
        ${safeFooter}
      </div>
    </div>
  `;
};

const buildContactFormNotificationTemplate = (
  context: ContactFormTemplateContext,
): EmailTemplate => {
  const rows = renderRows([
    { label: 'Name', value: context.name },
    { label: 'Email', value: context.email },
    { label: 'Phone', value: context.phone },
    { label: 'Subject', value: context.subject },
    { label: 'Message', value: context.message },
  ]);

  return {
    subject: context.subject
      ? `New contact form submission: ${context.subject}`
      : 'New contact form submission',
    html: baseTemplate(
      'Contact Form Notification',
      'A new contact form message was submitted on the Medientry website.',
      rows,
      'Please review and follow up with the sender as needed.',
    ),
    text: [
      'Contact Form Notification',
      'A new contact form message was submitted on the Medientry website.',
      `Name: ${context.name}`,
      `Email: ${context.email}`,
      context.phone ? `Phone: ${context.phone}` : undefined,
      context.subject ? `Subject: ${context.subject}` : undefined,
      `Message: ${context.message}`,
    ]
      .filter(Boolean)
      .join('\n'),
  };
};

const buildAdmissionEnquiryTemplate = (
  context: AdmissionEnquiryTemplateContext,
): EmailTemplate => {
  const rows = renderRows([
    { label: 'Name', value: context.name },
    { label: 'Email', value: context.email },
    { label: 'Phone', value: context.phone },
    { label: 'Preferred Destination', value: context.destination },
    { label: 'Preferred College', value: context.preferredCollege },
    { label: 'Message', value: context.message },
  ]);

  return {
    subject: `New admission enquiry from ${context.name}`,
    html: baseTemplate(
      'Admission Enquiry',
      'A new admission enquiry was received through the Medientry platform.',
      rows,
      'Please contact the student or guardian promptly.',
    ),
    text: [
      'Admission Enquiry',
      `Name: ${context.name}`,
      `Email: ${context.email}`,
      context.phone ? `Phone: ${context.phone}` : undefined,
      context.destination ? `Preferred Destination: ${context.destination}` : undefined,
      context.preferredCollege ? `Preferred College: ${context.preferredCollege}` : undefined,
      context.message ? `Message: ${context.message}` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
  };
};

const buildAdmissionEnquiryConfirmationTemplate = (
  context: AdmissionEnquiryConfirmationTemplateContext,
): EmailTemplate => {
  const rows = renderRows([
    { label: 'Name', value: context.name },
    { label: 'Preferred College', value: context.preferredCollege },
    { label: 'Support Email', value: context.supportEmail },
    { label: 'Support Phone', value: context.supportPhone },
  ]);

  return {
    subject: 'We received your Medientry enquiry',
    html: baseTemplate(
      'Enquiry Received',
      'Thank you for contacting Medientry. Our admissions team has received your enquiry and will follow up shortly.',
      rows,
      'If you need urgent support, use the contact details above and mention your preferred college.',
    ),
    text: [
      'Enquiry Received',
      `Name: ${context.name}`,
      context.preferredCollege ? `Preferred College: ${context.preferredCollege}` : undefined,
      context.supportEmail ? `Support Email: ${context.supportEmail}` : undefined,
      context.supportPhone ? `Support Phone: ${context.supportPhone}` : undefined,
      'Our admissions team will contact you shortly.',
    ]
      .filter(Boolean)
      .join('\n'),
  };
};

const buildConsultationLeadTemplate = (
  context: ConsultationLeadTemplateContext,
): EmailTemplate => {
  const rows = renderRows([
    { label: 'Name', value: context.name },
    { label: 'Role', value: context.userRole },
    { label: 'WhatsApp Number', value: context.whatsappNumber },
    { label: 'Phone Number', value: context.phoneNumber },
    { label: 'Passing Year', value: context.passingYear },
    { label: 'NEET Score', value: context.neetScore },
    { label: 'State', value: context.stateName },
    { label: 'Preferred College', value: context.preferredCollege },
    { label: 'Source Page', value: context.sourcePage },
  ]);

  return {
    subject: `New consultation lead from ${context.name}`,
    html: baseTemplate(
      'Consultation Lead',
      'A new consultation request was submitted through the Medientry website.',
      rows,
      'Please follow up with the student or guardian as soon as possible.',
    ),
    text: [
      'Consultation Lead',
      `Name: ${context.name}`,
      `Role: ${context.userRole}`,
      `WhatsApp Number: ${context.whatsappNumber}`,
      `Phone Number: ${context.phoneNumber}`,
      `Passing Year: ${context.passingYear}`,
      context.neetScore ? `NEET Score: ${context.neetScore}` : undefined,
      `State: ${context.stateName}`,
      context.preferredCollege ? `Preferred College: ${context.preferredCollege}` : undefined,
      context.sourcePage ? `Source Page: ${context.sourcePage}` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
  };
};

const buildAdminNotificationTemplate = (
  context: AdminNotificationTemplateContext,
): EmailTemplate => {
  const actionText = context.actionUrl
    ? `${context.actionLabel ?? 'Action'}: ${context.actionUrl}`
    : undefined;

  const rows = renderRows([
    { label: 'Title', value: context.title },
    { label: 'Message', value: context.message },
    { label: context.actionLabel ?? 'Action URL', value: context.actionUrl },
  ]);

  return {
    subject: context.title,
    html: baseTemplate(
      'Admin Notification',
      'A new admin notification was generated by the Medientry CMS.',
      rows,
      'Please review this notification inside the admin panel.',
    ),
    text: [
      'Admin Notification',
      `Title: ${context.title}`,
      `Message: ${context.message}`,
      actionText,
    ]
      .filter(Boolean)
      .join('\n'),
  };
};

export const emailTemplates = {
  contactFormNotification: buildContactFormNotificationTemplate,
  admissionEnquiry: buildAdmissionEnquiryTemplate,
  admissionEnquiryConfirmation: buildAdmissionEnquiryConfirmationTemplate,
  consultationLead: buildConsultationLeadTemplate,
  adminNotification: buildAdminNotificationTemplate,
};

let transporterCache: ReturnType<typeof nodemailer.createTransport> | null = null;
let transporterVerificationPromise: Promise<void> | null = null;

const resolveTemplate = (template: NonNullable<SendEmailInput['template']>) => {
  switch (template.name) {
    case 'contactFormNotification':
      return emailTemplates.contactFormNotification(template.context);
    case 'admissionEnquiry':
      return emailTemplates.admissionEnquiry(template.context);
    case 'admissionEnquiryConfirmation':
      return emailTemplates.admissionEnquiryConfirmation(template.context);
    case 'consultationLead':
      return emailTemplates.consultationLead(template.context);
    case 'adminNotification':
      return emailTemplates.adminNotification(template.context);
    default:
      throw new ApiError(500, 'Unsupported email template.');
  }
};

const redactFromText = (value: string, sensitiveValue?: string | null) => {
  if (!sensitiveValue) {
    return value;
  }

  return value.split(sensitiveValue).join('[redacted]');
};

const sanitizeMailErrorMessage = (message: string) => {
  return [env.MAIL_USER, env.MAIL_PASS]
    .filter((value): value is string => Boolean(value?.trim()))
    .reduce((safeMessage, sensitiveValue) => redactFromText(safeMessage, sensitiveValue), message);
};

const getSafeMailErrorSummary = (error: unknown) => {
  if (error instanceof Error) {
    const mailError = error as MailErrorShape;

    return {
      name: mailError.name,
      message: sanitizeMailErrorMessage(mailError.message),
      code: mailError.code,
      command: mailError.command,
      responseCode: mailError.responseCode,
    };
  }

  return {
    message: 'Unknown email transport failure.',
  };
};

const createTransporter = () => {
  if (!env.MAIL_ENABLED) {
    throw new ApiError(
      503,
      'Email service is disabled. Set MAIL_ENABLED=true and configure SMTP credentials to send email.',
    );
  }

  return nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_SECURE ?? env.MAIL_PORT === 465,
    requireTLS: env.MAIL_REQUIRE_TLS,
    connectionTimeout: env.MAIL_CONNECTION_TIMEOUT_MS,
    greetingTimeout: env.MAIL_GREETING_TIMEOUT_MS,
    socketTimeout: env.MAIL_SOCKET_TIMEOUT_MS,
    auth: {
      user: env.MAIL_USER!,
      pass: env.MAIL_PASS!,
    },
  });
};

const getTransporter = () => {
  if (!transporterCache) {
    transporterCache = createTransporter();
  }

  return transporterCache;
};

const verifyTransporter = async () => {
  if (!transporterVerificationPromise) {
    transporterVerificationPromise = getTransporter()
      .verify()
      .then(() => undefined)
      .catch((error) => {
        transporterVerificationPromise = null;
        transporterCache = null;
        throw error;
      });
  }

  return transporterVerificationPromise;
};

const throwEmailDeliveryError = (error: unknown): never => {
  console.error('[mailer] Email transport failure.', getSafeMailErrorSummary(error));
  throw new ApiError(503, 'Email delivery failed. Please try again later.');
};

export const sendEmail = async (input: SendEmailInput) => {
  const templateResult = input.template ? resolveTemplate(input.template) : null;
  const subject = input.subject ?? templateResult?.subject;
  const html = input.html ?? templateResult?.html;
  const text = input.text ?? templateResult?.text;

  if (!subject || !html || !text) {
    throw new ApiError(400, 'Email subject, html, and text content are required.');
  }

  try {
    const transporter = getTransporter();

    await verifyTransporter();

    return await transporter.sendMail({
      from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL!}>`,
      to: input.to,
      replyTo: input.replyTo ?? env.MAIL_REPLY_TO ?? undefined,
      subject,
      html,
      text,
    });
  } catch (error) {
    return throwEmailDeliveryError(error);
  }
};
