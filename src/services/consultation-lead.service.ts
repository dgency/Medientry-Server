import { Prisma } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import {
  buildConsultationLeadAdminActionUrl,
  consultationLeadFormName,
  consultationLeadTrackingSequenceName,
  consultationLeadEmailTimezone,
  consultationLeadEmailTimezoneLabel,
  formatConsultationLeadTrackingId,
} from '../utils/consultation-lead';
import {
  getSafeMailErrorSummary,
  sendAdminFormNotification,
  sendCustomerConfirmation,
} from '../utils/mailer';
import {
  buildPrefilledWhatsAppUrl,
  resolveOfficialWhatsAppContact,
  type OfficialWhatsAppContact,
} from '../utils/official-whatsapp';
import { resolvePublicWebsiteUrl } from '../utils/public-site-url';

type CreateConsultationLeadInput = {
  fullName: string;
  userRole: string;
  whatsappNumber: string;
  phoneNumber: string;
  emailAddress?: string;
  passingYear: string;
  neetScore?: string;
  stateName: string;
  preferredCollege?: string;
  message?: string;
  sourcePage?: string;
  submissionDate?: Date;
  submissionSource?: 'consultation' | 'contact';
  website?: string;
};

const consultationLeadSelect = {
  id: true,
  trackingNumber: true,
  trackingId: true,
  fullName: true,
  userRole: true,
  whatsappNumber: true,
  phoneNumber: true,
  emailAddress: true,
  passingYear: true,
  neetScore: true,
  stateName: true,
  preferredCollege: true,
  message: true,
  sourcePage: true,
  submissionDate: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ConsultationLeadSelect;

type ConsultationLeadRecord = Prisma.ConsultationLeadGetPayload<{
  select: typeof consultationLeadSelect;
}>;

type ConsultationLeadServiceDependencies = {
  consultationLeadModel: Pick<
    typeof prisma.consultationLead,
    'create' | 'delete' | 'findFirst' | 'findMany' | 'findUnique'
  >;
  allocateTrackingNumber: () => Promise<number>;
  sendAdminFormNotification: typeof sendAdminFormNotification;
  sendCustomerConfirmation: typeof sendCustomerConfirmation;
  resolveOfficialWhatsAppContact: () => Promise<OfficialWhatsAppContact | null>;
};

const allocateConsultationLeadTrackingNumber = async () => {
  const result = await prisma.$queryRawUnsafe<Array<{ value: bigint | number }>>(
    `SELECT nextval('${consultationLeadTrackingSequenceName}') AS "value"`,
  );
  const trackingNumber = Number(result[0]?.value ?? 0);

  if (!Number.isInteger(trackingNumber) || trackingNumber <= 0) {
    throw new ApiError(500, 'Unable to allocate a consultation tracking number.');
  }

  return trackingNumber;
};

const defaultDependencies: ConsultationLeadServiceDependencies = {
  consultationLeadModel: prisma.consultationLead,
  allocateTrackingNumber: allocateConsultationLeadTrackingNumber,
  sendAdminFormNotification,
  sendCustomerConfirmation,
  resolveOfficialWhatsAppContact,
};

const recentLeadWindowMs = 2 * 60 * 1000;
const duplicateLeadWindowMs = 24 * 60 * 60 * 1000;

const normalizeRequiredString = (value: string) => value.trim();
const normalizePhoneNumber = (value: string) => {
  const trimmed = value.trim();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  return hasLeadingPlus ? `+${digits}` : digits;
};

const normalizeNullableString = (value?: string | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const normalizeNullableEmail = (value?: string | null) =>
  normalizeNullableString(value)?.toLowerCase() ?? null;

const buildPhoneLink = (value?: string | null) => {
  const normalizedValue = value ? normalizePhoneNumber(value) : '';
  return normalizedValue ? `tel:${normalizedValue}` : undefined;
};

const buildCustomerWhatsAppLink = (value?: string | null) => {
  const normalizedValue = value?.replace(/\D/g, '') ?? '';
  return normalizedValue ? `https://wa.me/${normalizedValue}` : undefined;
};

type ConsultationLeadCreateData = Omit<
  Prisma.ConsultationLeadUncheckedCreateInput,
  'trackingNumber' | 'trackingId'
>;

const buildConsultationLeadData = (
  input: CreateConsultationLeadInput,
): ConsultationLeadCreateData => ({
  fullName: normalizeRequiredString(input.fullName),
  userRole: normalizeRequiredString(input.userRole),
  whatsappNumber: normalizePhoneNumber(input.whatsappNumber),
  phoneNumber: normalizePhoneNumber(input.phoneNumber),
  emailAddress: normalizeNullableEmail(input.emailAddress),
  passingYear: normalizeRequiredString(input.passingYear),
  neetScore: normalizeNullableString(input.neetScore),
  stateName: normalizeRequiredString(input.stateName),
  preferredCollege: normalizeNullableString(input.preferredCollege),
  message: normalizeNullableString(input.message),
  sourcePage: resolvePublicWebsiteUrl(normalizeNullableString(input.sourcePage)) ?? null,
  submissionDate: input.submissionDate ?? null,
});

const getConsultationLeadById = async (
  id: string,
  consultationLeadModel: ConsultationLeadServiceDependencies['consultationLeadModel'],
) => {
  const lead = await consultationLeadModel.findUnique({
    where: { id },
    select: consultationLeadSelect,
  });

  if (!lead) {
    throw new ApiError(404, 'Consultation lead not found.');
  }

  return lead;
};

const assertNoSpamIndicators = async (
  input: CreateConsultationLeadInput,
  consultationLeadModel: ConsultationLeadServiceDependencies['consultationLeadModel'],
) => {
  if (input.website?.trim()) {
    throw new ApiError(400, 'Spam submission detected.');
  }

  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
  const normalizedWhatsAppNumber = normalizePhoneNumber(input.whatsappNumber);
  const normalizedEmailAddress = normalizeNullableEmail(input.emailAddress);
  const recentSubmissionMatchers: Prisma.ConsultationLeadWhereInput[] = [
    { phoneNumber: normalizedPhoneNumber },
    { whatsappNumber: normalizedWhatsAppNumber },
  ];

  if (normalizedEmailAddress) {
    recentSubmissionMatchers.push({ emailAddress: normalizedEmailAddress });
  }

  const recentSubmission = await consultationLeadModel.findFirst({
    where: {
      createdAt: { gte: new Date(Date.now() - recentLeadWindowMs) },
      OR: recentSubmissionMatchers,
    },
    select: { id: true },
  });

  if (recentSubmission) {
    throw new ApiError(429, 'Please wait a moment before submitting another consultation request.');
  }

  const duplicateSubmission = await consultationLeadModel.findFirst({
    where: {
      createdAt: { gte: new Date(Date.now() - duplicateLeadWindowMs) },
      phoneNumber: normalizedPhoneNumber,
      fullName: {
        equals: normalizeRequiredString(input.fullName),
        mode: 'insensitive',
      },
      stateName: {
        equals: normalizeRequiredString(input.stateName),
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  if (duplicateSubmission) {
    throw new ApiError(409, 'This consultation request has already been submitted recently.');
  }
};

const sendConsultationLeadNotification = async (
  lead: ConsultationLeadRecord,
  formName: string,
  dependencies: ConsultationLeadServiceDependencies,
) => {
  try {
    await dependencies.sendAdminFormNotification({
      formName,
      submissionId: lead.trackingId,
      subject: lead.fullName
        ? `New ${formName} — ${lead.trackingId} — ${lead.fullName}`
        : `New ${formName} — ${lead.trackingId}`,
      title: formName,
      intro:
        'A new Book Free Consultation submission has been received and is ready for follow-up.',
      submittedAt: lead.createdAt,
      trackingId: lead.trackingId,
      customerName: lead.fullName,
      customerEmail: lead.emailAddress ?? undefined,
      phoneNumber: lead.phoneNumber,
      whatsappNumber: lead.whatsappNumber,
      sourcePageUrl: lead.sourcePage ?? undefined,
      actionUrl: buildConsultationLeadAdminActionUrl(lead.id),
      actionLabel: 'Open Lead',
      replyTo: lead.emailAddress ?? undefined,
      displayTimeZone: consultationLeadEmailTimezone,
      displayTimeZoneLabel: consultationLeadEmailTimezoneLabel,
      summaryFields: [
        { label: 'Submission ID', value: lead.trackingId },
        { label: 'Form Name', value: formName },
        { label: 'Customer or Student Name', value: lead.fullName },
        ...(lead.emailAddress
          ? [{ label: 'Email Address', value: lead.emailAddress, href: `mailto:${lead.emailAddress}` }]
          : []),
        { label: 'Phone Number', value: lead.phoneNumber, href: buildPhoneLink(lead.phoneNumber) },
        {
          label: 'WhatsApp Number',
          value: lead.whatsappNumber,
          href: buildCustomerWhatsAppLink(lead.whatsappNumber),
        },
        { label: 'Role', value: lead.userRole },
        { label: 'Passing Year', value: lead.passingYear },
        ...(lead.neetScore?.trim()
          ? [{ label: 'NEET Score', value: lead.neetScore }]
          : [{ label: 'NEET Score', value: 'Not provided' }]),
        { label: 'State', value: lead.stateName },
        ...(lead.preferredCollege?.trim()
          ? [{ label: 'Preferred College', value: lead.preferredCollege }]
          : [{ label: 'Preferred College', value: 'Not provided' }]),
        ...(lead.message?.trim()
          ? [{ label: 'Message or Additional Information', value: lead.message }]
          : []),
      ],
      footerNote:
        'This notification was generated automatically by the MediEntry website. Please follow up with the student or guardian using the validated contact details above.',
    });
  } catch (error) {
    console.error('[consultation-lead] Email delivery failed after save.', {
      submissionId: lead.trackingId,
      formType: formName,
      submittedAt: lead.createdAt.toISOString(),
      deliveryType: 'admin-notification',
      error: getSafeMailErrorSummary(error),
    });
  }
};

const sendConsultationLeadCustomerConfirmation = async (
  lead: ConsultationLeadRecord,
  dependencies: ConsultationLeadServiceDependencies,
) => {
  if (!lead.emailAddress) {
    return;
  }

  const officialWhatsAppContact = await dependencies.resolveOfficialWhatsAppContact();
  const whatsappActionUrl = officialWhatsAppContact
    ? buildPrefilledWhatsAppUrl(
        officialWhatsAppContact,
        `Hello MediEntry, I recently submitted a consultation request. My tracking ID is ${lead.trackingId}.`,
      )
    : undefined;

  try {
    await dependencies.sendCustomerConfirmation({
      to: lead.emailAddress,
      subject: `Your Free Consultation Request Has Been Received — ${lead.trackingId}`,
      heading: 'Your Free Consultation Request Has Been Received',
      intro:
        'Thank you for contacting MediEntry. We have received your information successfully. Our counselling team will review your request and contact you as soon as possible.',
      summaryFields: [
        { label: 'Submission ID', value: lead.trackingId },
        { label: 'Form Name', value: consultationLeadFormName },
        { label: 'Customer or Student Name', value: lead.fullName },
        { label: 'Phone Number', value: lead.phoneNumber },
        { label: 'WhatsApp Number', value: lead.whatsappNumber },
        { label: 'Role', value: lead.userRole },
        { label: 'Passing Year', value: lead.passingYear },
        ...(lead.neetScore?.trim() ? [{ label: 'NEET Score', value: lead.neetScore }] : []),
        { label: 'State', value: lead.stateName },
        ...(lead.preferredCollege?.trim()
          ? [{ label: 'Preferred College', value: lead.preferredCollege }]
          : []),
      ],
      sourcePageUrl: lead.sourcePage ?? undefined,
      submittedAt: lead.createdAt,
      displayTimeZone: consultationLeadEmailTimezone,
      displayTimeZoneLabel: consultationLeadEmailTimezoneLabel,
      whatsappDisplayNumber: officialWhatsAppContact?.displayNumber,
      whatsappActionUrl,
      footer:
        'Thank you for contacting Medientry. Our team will review your request and get in touch using the details you submitted.',
    });
  } catch (error) {
    console.error('[consultation-lead] Email delivery failed after save.', {
      submissionId: lead.trackingId,
      formType: consultationLeadFormName,
      submittedAt: lead.createdAt.toISOString(),
      deliveryType: 'customer-confirmation',
      error: getSafeMailErrorSummary(error),
    });
  }
};

export const listConsultationLeads = async () => {
  return defaultDependencies.consultationLeadModel.findMany({
    select: consultationLeadSelect,
    orderBy: [{ createdAt: 'desc' }],
  });
};

export const getAdminConsultationLeadById = async (id: string) =>
  getConsultationLeadById(id, defaultDependencies.consultationLeadModel);

export const createConsultationLeadWithDependencies = async (
  input: CreateConsultationLeadInput,
  dependencies: ConsultationLeadServiceDependencies = defaultDependencies,
) => {
  await assertNoSpamIndicators(input, dependencies.consultationLeadModel);
  const trackingNumber = await dependencies.allocateTrackingNumber();

  const lead = await dependencies.consultationLeadModel.create({
    data: {
      ...buildConsultationLeadData(input),
      trackingNumber,
      trackingId: formatConsultationLeadTrackingId(trackingNumber),
    },
    select: consultationLeadSelect,
  });
  const formName = consultationLeadFormName;

  await sendConsultationLeadNotification(lead, formName, dependencies);
  await sendConsultationLeadCustomerConfirmation(lead, dependencies);

  return lead;
};

export const createConsultationLead = async (input: CreateConsultationLeadInput) => {
  return createConsultationLeadWithDependencies(input);
};

export const deleteConsultationLead = async (id: string) => {
  await getConsultationLeadById(id, defaultDependencies.consultationLeadModel);

  await defaultDependencies.consultationLeadModel.delete({
    where: { id },
  });
};
