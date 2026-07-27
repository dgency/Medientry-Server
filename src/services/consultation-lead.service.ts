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
import {
  normalizeOptionalPublicEmailAddress,
  normalizePublicFormText,
  normalizePublicPhoneNumber,
} from '../utils/public-form-validation';
import {
  buildPaginatedResult,
  type PaginatedResult,
  type PaginationInput,
} from '../utils/pagination';
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
  formVariant?: 'default' | 'mbbs-georgia';
  website?: string;
};

type ConsultationLeadFormVariant = 'default' | 'mbbs-georgia';

type ConsultationLeadStatusFilter = 'all' | 'read' | 'unread';

type ListConsultationLeadsInput = {
  search?: string;
  status?: ConsultationLeadStatusFilter;
  pagination?: PaginationInput | null;
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
  readAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ConsultationLeadSelect;

type ConsultationLeadRecord = Prisma.ConsultationLeadGetPayload<{
  select: typeof consultationLeadSelect;
}>;

type ConsultationLeadServiceDependencies = {
  consultationLeadModel: Pick<
    typeof prisma.consultationLead,
    'create' | 'delete' | 'findFirst' | 'findMany' | 'findUnique' | 'update'
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
  normalizeOptionalPublicEmailAddress(normalizeNullableString(value)) ?? null;

const normalizeSearch = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeConsultationLeadFormVariant = (
  value?: string | null,
): ConsultationLeadFormVariant => (value === 'mbbs-georgia' ? 'mbbs-georgia' : 'default');

const buildPhoneLink = (value?: string | null) => {
  const normalizedValue = value ? normalizePublicPhoneNumber(value) : '';
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
  fullName: normalizePublicFormText(input.fullName),
  userRole: normalizePublicFormText(input.userRole),
  whatsappNumber: normalizePublicPhoneNumber(input.whatsappNumber),
  phoneNumber: normalizePublicPhoneNumber(input.phoneNumber),
  emailAddress: normalizeNullableEmail(input.emailAddress),
  passingYear: normalizePublicFormText(input.passingYear),
  neetScore: normalizeNullableString(input.neetScore),
  stateName: normalizePublicFormText(input.stateName),
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

const buildConsultationLeadWhere = (
  input: ListConsultationLeadsInput,
): Prisma.ConsultationLeadWhereInput => {
  const search = normalizeSearch(input.search);
  const status = input.status ?? 'all';

  return {
    ...(status === 'read'
      ? { readAt: { not: null } }
      : status === 'unread'
        ? { readAt: null }
        : {}),
    ...(search
      ? {
          OR: [
            { trackingId: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { userRole: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search, mode: 'insensitive' } },
            { whatsappNumber: { contains: search, mode: 'insensitive' } },
            { emailAddress: { contains: search, mode: 'insensitive' } },
            { passingYear: { contains: search, mode: 'insensitive' } },
            { neetScore: { contains: search, mode: 'insensitive' } },
            { stateName: { contains: search, mode: 'insensitive' } },
            { preferredCollege: { contains: search, mode: 'insensitive' } },
            { sourcePage: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
};

const sortConsultationLeads = <
  TLead extends {
    readAt: Date | null;
    createdAt: Date;
  },
>(
  leads: TLead[],
) =>
  [...leads].sort((firstLead, secondLead) => {
    const firstIsUnread = firstLead.readAt === null;
    const secondIsUnread = secondLead.readAt === null;

    if (firstIsUnread !== secondIsUnread) {
      return firstIsUnread ? -1 : 1;
    }

    return secondLead.createdAt.getTime() - firstLead.createdAt.getTime();
  });

const assertNoSpamIndicators = async (
  input: CreateConsultationLeadInput,
  _consultationLeadModel: ConsultationLeadServiceDependencies['consultationLeadModel'],
) => {
  if (input.website?.trim()) {
    throw new ApiError(400, 'Spam submission detected.');
  }
};

const sendConsultationLeadNotification = async (
  lead: ConsultationLeadRecord,
  formName: string,
  formVariant: ConsultationLeadFormVariant,
  dependencies: ConsultationLeadServiceDependencies,
) => {
  const summaryFields =
    formVariant === 'mbbs-georgia'
      ? [
          { label: 'Submission ID', value: lead.trackingId },
          { label: 'Form Name', value: formName },
          { label: 'Customer or Student Name', value: lead.fullName },
          { label: 'Phone Number', value: lead.phoneNumber, href: buildPhoneLink(lead.phoneNumber) },
          { label: 'Role', value: lead.userRole },
          { label: 'Passing Year', value: lead.passingYear },
          ...(lead.message?.trim()
            ? [{ label: 'Your Message', value: lead.message }]
            : []),
        ]
      : [
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
        ];

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
      summaryFields,
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
  formVariant: ConsultationLeadFormVariant,
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
      trackingId: lead.trackingId,
      heading: 'Your Free Consultation Request Has Been Received',
      intro:
        'Thank you for contacting MediEntry. We have received your information successfully. Our counselling team will review your request and contact you as soon as possible.',
      summaryFields: [
        { label: 'Submission ID', value: lead.trackingId },
        { label: 'Form Name', value: consultationLeadFormName },
        { label: 'Customer or Student Name', value: lead.fullName },
        { label: 'Phone Number', value: lead.phoneNumber },
        { label: 'Role', value: lead.userRole },
        { label: 'Passing Year', value: lead.passingYear },
        ...(formVariant === 'mbbs-georgia'
          ? []
          : [
              { label: 'WhatsApp Number', value: lead.whatsappNumber },
              ...(lead.neetScore?.trim() ? [{ label: 'NEET Score', value: lead.neetScore }] : []),
              { label: 'State', value: lead.stateName },
              ...(lead.preferredCollege?.trim()
                ? [{ label: 'Preferred College', value: lead.preferredCollege }]
                : []),
            ]),
        ...(lead.message?.trim() ? [{ label: 'Your Message', value: lead.message }] : []),
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

export const listConsultationLeads = async (input: ListConsultationLeadsInput = {}) => {
  const where = buildConsultationLeadWhere(input);
  const pagination = input.pagination;

  if (pagination) {
    const [leads, totalItems] = await Promise.all([
      defaultDependencies.consultationLeadModel.findMany({
        where,
        select: consultationLeadSelect,
        orderBy: [{ createdAt: 'desc' }],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.consultationLead.count({ where }),
    ]);

    return buildPaginatedResult({
      items: sortConsultationLeads(leads),
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
    }) satisfies PaginatedResult<ConsultationLeadRecord>;
  }

  const leads = await defaultDependencies.consultationLeadModel.findMany({
    where,
    select: consultationLeadSelect,
    orderBy: [{ createdAt: 'desc' }],
  });

  return sortConsultationLeads(leads);
};

export const getAdminConsultationLeadById = async (id: string) =>
  getConsultationLeadById(id, defaultDependencies.consultationLeadModel);

export const createConsultationLeadWithDependencies = async (
  input: CreateConsultationLeadInput,
  dependencies: ConsultationLeadServiceDependencies = defaultDependencies,
) => {
  await assertNoSpamIndicators(input, dependencies.consultationLeadModel);
  const trackingNumber = await dependencies.allocateTrackingNumber();
  const formVariant = normalizeConsultationLeadFormVariant(input.formVariant);

  const lead = await dependencies.consultationLeadModel.create({
    data: {
      ...buildConsultationLeadData(input),
      trackingNumber,
      trackingId: formatConsultationLeadTrackingId(trackingNumber),
    },
    select: consultationLeadSelect,
  });
  const formName = consultationLeadFormName;

  await sendConsultationLeadNotification(lead, formName, formVariant, dependencies);
  await sendConsultationLeadCustomerConfirmation(lead, formVariant, dependencies);

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

export const markConsultationLeadAsRead = async (id: string) => {
  const lead = await getConsultationLeadById(id, defaultDependencies.consultationLeadModel);

  if (lead.readAt) {
    return lead;
  }

  return defaultDependencies.consultationLeadModel.update({
    where: { id },
    data: {
      readAt: new Date(),
    },
    select: consultationLeadSelect,
  });
};

export const markConsultationLeadAsUnread = async (id: string) => {
  const lead = await getConsultationLeadById(id, defaultDependencies.consultationLeadModel);

  if (!lead.readAt) {
    return lead;
  }

  return defaultDependencies.consultationLeadModel.update({
    where: { id },
    data: {
      readAt: null,
    },
    select: consultationLeadSelect,
  });
};
