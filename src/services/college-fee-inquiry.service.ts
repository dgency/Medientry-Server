import { Prisma } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import {
  buildCollegeFeeInquiryAdminActionUrl,
  collegeFeeInquiryEmailTimezone,
  collegeFeeInquiryEmailTimezoneLabel,
  collegeFeeInquiryFormName,
  collegeFeeInquiryTrackingSequenceName,
  formatCollegeFeeInquiryTrackingId,
} from '../utils/college-fee-inquiry';
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

type CreateCollegeFeeInquiryInput = {
  fullName: string;
  phoneNumber: string;
  emailAddress?: string;
  country?: string;
  preferredStudyDestination?: string;
  interestedCollegeId?: string;
  interestedCollegeName: string;
  message?: string;
  source?: string;
  sourcePage?: string;
  website?: string;
};

type UpdateCollegeFeeInquiryInput = Partial<CreateCollegeFeeInquiryInput>;
type CollegeFeeInquiryStatusFilter = 'all' | 'read' | 'unread';
type ListCollegeFeeInquiriesInput = {
  search?: string;
  status?: CollegeFeeInquiryStatusFilter;
};

const collegeFeeInquirySelect = {
  id: true,
  trackingNumber: true,
  trackingId: true,
  medicalCollegeId: true,
  fullName: true,
  phoneNumber: true,
  emailAddress: true,
  country: true,
  preferredStudyDestination: true,
  interestedCollegeName: true,
  message: true,
  source: true,
  sourcePage: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CollegeFeeInquirySelect;

type CollegeFeeInquiryRecord = Prisma.CollegeFeeInquiryGetPayload<{
  select: typeof collegeFeeInquirySelect;
}>;

type CollegeFeeInquiryServiceDependencies = {
  collegeFeeInquiryModel: Pick<
    typeof prisma.collegeFeeInquiry,
    'create' | 'delete' | 'findFirst' | 'findMany' | 'findUnique' | 'update'
  >;
  medicalCollegeModel: Pick<typeof prisma.medicalCollege, 'findUnique'>;
  allocateTrackingNumber: () => Promise<number>;
  sendAdminFormNotification: typeof sendAdminFormNotification;
  sendCustomerConfirmation: typeof sendCustomerConfirmation;
  resolveOfficialWhatsAppContact: () => Promise<OfficialWhatsAppContact | null>;
};

const allocateCollegeFeeInquiryTrackingNumber = async () => {
  const result = await prisma.$queryRawUnsafe<Array<{ value: bigint | number }>>(
    `SELECT nextval('${collegeFeeInquiryTrackingSequenceName}') AS "value"`,
  );
  const trackingNumber = Number(result[0]?.value ?? 0);

  if (!Number.isInteger(trackingNumber) || trackingNumber <= 0) {
    throw new ApiError(500, 'Unable to allocate a college fee inquiry tracking number.');
  }

  return trackingNumber;
};

const defaultDependencies: CollegeFeeInquiryServiceDependencies = {
  collegeFeeInquiryModel: prisma.collegeFeeInquiry,
  medicalCollegeModel: prisma.medicalCollege,
  allocateTrackingNumber: allocateCollegeFeeInquiryTrackingNumber,
  sendAdminFormNotification,
  sendCustomerConfirmation,
  resolveOfficialWhatsAppContact,
};

const recentInquiryWindowMs = 2 * 60 * 1000;
const duplicateInquiryWindowMs = 24 * 60 * 60 * 1000;

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

const normalizeSearch = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

type CollegeFeeInquiryCreateData = Omit<
  Prisma.CollegeFeeInquiryUncheckedCreateInput,
  'trackingNumber' | 'trackingId'
>;

const formatSourceToken = (value: string) =>
  value
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getCollegeFeeInquirySourceContext = (source: string) => {
  const sourceParts = source
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  const collegeSlugMatch = source.match(/slug\s*:\s*([^|]+)/i);

  return {
    inquirySource: sourceParts[0] || collegeFeeInquiryFormName,
    formLocation: sourceParts[1] ? formatSourceToken(sourceParts[1]) : null,
    collegeSlug: collegeSlugMatch?.[1]?.trim() || null,
  };
};

const buildPhoneLink = (value: string) => {
  const normalizedPhone = normalizePhoneNumber(value);
  return normalizedPhone ? `tel:${normalizedPhone}` : undefined;
};

const buildSourceSummary = (source: string) => {
  const sourceContext = getCollegeFeeInquirySourceContext(source);

  return sourceContext.formLocation
    ? `${sourceContext.inquirySource} | ${sourceContext.formLocation}`
    : sourceContext.inquirySource;
};

const buildCollegeFeeInquiryData = (
  input: CreateCollegeFeeInquiryInput | UpdateCollegeFeeInquiryInput,
): CollegeFeeInquiryCreateData | Prisma.CollegeFeeInquiryUncheckedUpdateInput => {
  const data:
    | CollegeFeeInquiryCreateData
    | Prisma.CollegeFeeInquiryUncheckedUpdateInput = {};

  if ('interestedCollegeId' in input) {
    data.medicalCollegeId = input.interestedCollegeId ?? null;
  }

  if ('fullName' in input && input.fullName !== undefined) {
    data.fullName = normalizeRequiredString(input.fullName);
  }

  if ('phoneNumber' in input && input.phoneNumber !== undefined) {
    data.phoneNumber = normalizePhoneNumber(input.phoneNumber);
  }

  if ('emailAddress' in input) {
    data.emailAddress = normalizeNullableEmail(input.emailAddress);
  }

  if ('country' in input) {
    data.country = normalizeNullableString(input.country);
  }

  if ('preferredStudyDestination' in input) {
    data.preferredStudyDestination = normalizeNullableString(input.preferredStudyDestination);
  }

  if ('interestedCollegeName' in input && input.interestedCollegeName !== undefined) {
    data.interestedCollegeName = normalizeRequiredString(input.interestedCollegeName);
  }

  if ('message' in input) {
    data.message = normalizeNullableString(input.message);
  }

  if ('source' in input) {
    data.source = normalizeNullableString(input.source) ?? collegeFeeInquiryFormName;
  }

  if ('sourcePage' in input) {
    data.sourcePage = resolvePublicWebsiteUrl(normalizeNullableString(input.sourcePage)) ?? null;
  }

  return data;
};

const assertNoSpamIndicators = async (
  input: CreateCollegeFeeInquiryInput,
  collegeFeeInquiryModel: CollegeFeeInquiryServiceDependencies['collegeFeeInquiryModel'],
) => {
  if (input.website?.trim()) {
    throw new ApiError(400, 'Spam submission detected.');
  }

  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);
  const normalizedEmailAddress = normalizeNullableEmail(input.emailAddress);
  const createdAfter = new Date(Date.now() - recentInquiryWindowMs);
  const recentSubmissionMatchers: Prisma.CollegeFeeInquiryWhereInput[] = [
    { phoneNumber: normalizedPhoneNumber },
  ];

  if (normalizedEmailAddress) {
    recentSubmissionMatchers.push({ emailAddress: normalizedEmailAddress });
  }

  const recentSubmission = await collegeFeeInquiryModel.findFirst({
    where: {
      createdAt: { gte: createdAfter },
      OR: recentSubmissionMatchers,
    },
    select: { id: true },
  });

  if (recentSubmission) {
    throw new ApiError(429, 'Please wait a moment before submitting another inquiry.');
  }

  const duplicateSubmission = await collegeFeeInquiryModel.findFirst({
    where: {
      createdAt: { gte: new Date(Date.now() - duplicateInquiryWindowMs) },
      phoneNumber: normalizedPhoneNumber,
      fullName: {
        equals: normalizeRequiredString(input.fullName),
        mode: 'insensitive',
      },
      interestedCollegeName: {
        equals: normalizeRequiredString(input.interestedCollegeName),
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  if (duplicateSubmission) {
    throw new ApiError(409, 'This inquiry has already been submitted recently.');
  }
};

const ensureMedicalCollegeExists = async (
  medicalCollegeId: string | undefined,
  medicalCollegeModel: CollegeFeeInquiryServiceDependencies['medicalCollegeModel'],
) => {
  if (!medicalCollegeId) {
    return;
  }

  const medicalCollege = await medicalCollegeModel.findUnique({
    where: { id: medicalCollegeId },
    select: { id: true },
  });

  if (!medicalCollege) {
    throw new ApiError(400, 'Invalid medical college selected.');
  }
};

const getCollegeFeeInquiryById = async (
  id: string,
  collegeFeeInquiryModel: CollegeFeeInquiryServiceDependencies['collegeFeeInquiryModel'],
) => {
  const inquiry = await collegeFeeInquiryModel.findUnique({
    where: { id },
    select: collegeFeeInquirySelect,
  });

  if (!inquiry) {
    throw new ApiError(404, 'College fee inquiry not found.');
  }

  return inquiry;
};

const buildCollegeFeeInquiryWhere = (
  input: ListCollegeFeeInquiriesInput,
): Prisma.CollegeFeeInquiryWhereInput => {
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
            { phoneNumber: { contains: search, mode: 'insensitive' } },
            { emailAddress: { contains: search, mode: 'insensitive' } },
            { country: { contains: search, mode: 'insensitive' } },
            { preferredStudyDestination: { contains: search, mode: 'insensitive' } },
            { interestedCollegeName: { contains: search, mode: 'insensitive' } },
            { source: { contains: search, mode: 'insensitive' } },
            { sourcePage: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
};

const sortCollegeFeeInquiries = <
  TInquiry extends {
    readAt: Date | null;
    createdAt: Date;
  },
>(
  inquiries: TInquiry[],
) =>
  [...inquiries].sort((firstInquiry, secondInquiry) => {
    const firstIsUnread = firstInquiry.readAt === null;
    const secondIsUnread = secondInquiry.readAt === null;

    if (firstIsUnread !== secondIsUnread) {
      return firstIsUnread ? -1 : 1;
    }

    return secondInquiry.createdAt.getTime() - firstInquiry.createdAt.getTime();
  });

const sendInquiryEmails = async (
  inquiry: CollegeFeeInquiryRecord,
  dependencies: CollegeFeeInquiryServiceDependencies,
) => {
  try {
    await dependencies.sendAdminFormNotification({
      formName: collegeFeeInquiryFormName,
      submissionId: inquiry.trackingId,
      subject: inquiry.fullName
        ? `New ${collegeFeeInquiryFormName} \u2014 ${inquiry.trackingId} \u2014 ${inquiry.fullName}`
        : `New ${collegeFeeInquiryFormName} \u2014 ${inquiry.trackingId}`,
      title: collegeFeeInquiryFormName,
      intro: 'A new college fee inquiry has been received and is ready for follow-up.',
      submittedAt: inquiry.createdAt,
      trackingId: inquiry.trackingId,
      customerName: inquiry.fullName,
      customerEmail: inquiry.emailAddress ?? undefined,
      phoneNumber: inquiry.phoneNumber,
      sourcePageUrl: inquiry.sourcePage ?? undefined,
      actionUrl: buildCollegeFeeInquiryAdminActionUrl(inquiry.id),
      actionLabel: 'Open Inquiry',
      replyTo: inquiry.emailAddress ?? undefined,
      displayTimeZone: collegeFeeInquiryEmailTimezone,
      displayTimeZoneLabel: collegeFeeInquiryEmailTimezoneLabel,
      summaryFields: [
        { label: 'Inquiry ID', value: inquiry.trackingId },
        { label: 'Form Name', value: collegeFeeInquiryFormName },
        { label: 'Customer Name', value: inquiry.fullName },
        ...(inquiry.emailAddress
          ? [
              {
                label: 'Customer Email',
                value: inquiry.emailAddress,
                href: `mailto:${inquiry.emailAddress}`,
              },
            ]
          : []),
        {
          label: 'Phone Number',
          value: inquiry.phoneNumber,
          href: buildPhoneLink(inquiry.phoneNumber),
        },
        ...(inquiry.preferredStudyDestination?.trim()
          ? [{ label: 'Study Destination', value: inquiry.preferredStudyDestination }]
          : []),
        ...(inquiry.country?.trim() ? [{ label: 'Country', value: inquiry.country }] : []),
        { label: 'Selected College', value: inquiry.interestedCollegeName },
        { label: 'Inquiry Source', value: buildSourceSummary(inquiry.source) },
        ...(inquiry.message?.trim() ? [{ label: 'Message', value: inquiry.message }] : []),
      ],
      footerNote:
        'This notification was generated automatically by the MediEntry website. Please follow up with the student or guardian using the validated contact details above.',
    });
  } catch (error) {
    console.error('[college-fee-inquiry] Email delivery failed after save.', {
      submissionId: inquiry.trackingId,
      formType: collegeFeeInquiryFormName,
      submittedAt: inquiry.createdAt.toISOString(),
      deliveryType: 'admin-notification',
      error: getSafeMailErrorSummary(error),
    });
  }

  if (!inquiry.emailAddress) {
    return;
  }

  const officialWhatsAppContact = await dependencies.resolveOfficialWhatsAppContact();
  const whatsappActionUrl = officialWhatsAppContact
    ? buildPrefilledWhatsAppUrl(
        officialWhatsAppContact,
        `Hello MediEntry, I recently submitted an inquiry. My tracking ID is ${inquiry.trackingId}.`,
      )
    : undefined;

  try {
    await dependencies.sendCustomerConfirmation({
      to: inquiry.emailAddress,
      subject: `Your College Fee Inquiry Has Been Received — ${inquiry.trackingId}`,
      heading: 'Your College Fee Inquiry Has Been Received',
      intro:
        'Thank you for contacting MediEntry. We have received your information successfully. Our counselling team will review your request and contact you as soon as possible.',
      summaryFields: [
        { label: 'Inquiry ID', value: inquiry.trackingId },
        { label: 'Form Name', value: collegeFeeInquiryFormName },
        { label: 'Customer Name', value: inquiry.fullName },
        { label: 'Customer Email', value: inquiry.emailAddress },
        { label: 'Phone Number', value: inquiry.phoneNumber },
        ...(inquiry.preferredStudyDestination?.trim()
          ? [{ label: 'Study Destination', value: inquiry.preferredStudyDestination }]
          : []),
        ...(inquiry.country?.trim() ? [{ label: 'Country', value: inquiry.country }] : []),
        { label: 'Selected College', value: inquiry.interestedCollegeName },
        ...(inquiry.message?.trim() ? [{ label: 'Message', value: inquiry.message }] : []),
      ],
      sourcePageUrl: inquiry.sourcePage ?? undefined,
      submittedAt: inquiry.createdAt,
      displayTimeZone: collegeFeeInquiryEmailTimezone,
      displayTimeZoneLabel: collegeFeeInquiryEmailTimezoneLabel,
      whatsappDisplayNumber: officialWhatsAppContact?.displayNumber,
      whatsappActionUrl,
      footer:
        'Thank you for contacting Medientry. Our team will review your request and get in touch using the details you submitted.',
    });
  } catch (error) {
    console.error('[college-fee-inquiry] Email delivery failed after save.', {
      submissionId: inquiry.trackingId,
      formType: collegeFeeInquiryFormName,
      submittedAt: inquiry.createdAt.toISOString(),
      deliveryType: 'customer-confirmation',
      error: getSafeMailErrorSummary(error),
    });
  }
};

export const listCollegeFeeInquiries = async (input: ListCollegeFeeInquiriesInput = {}) => {
  const inquiries = await defaultDependencies.collegeFeeInquiryModel.findMany({
    where: buildCollegeFeeInquiryWhere(input),
    select: collegeFeeInquirySelect,
    orderBy: [{ createdAt: 'desc' }],
  });

  return sortCollegeFeeInquiries(inquiries);
};

export const getAdminCollegeFeeInquiryById = async (id: string) =>
  getCollegeFeeInquiryById(id, defaultDependencies.collegeFeeInquiryModel);

export const createCollegeFeeInquiryWithDependencies = async (
  input: CreateCollegeFeeInquiryInput,
  dependencies: CollegeFeeInquiryServiceDependencies = defaultDependencies,
) => {
  await assertNoSpamIndicators(input, dependencies.collegeFeeInquiryModel);
  await ensureMedicalCollegeExists(input.interestedCollegeId, dependencies.medicalCollegeModel);
  const trackingNumber = await dependencies.allocateTrackingNumber();

  const inquiry = await dependencies.collegeFeeInquiryModel.create({
    data: {
      ...(buildCollegeFeeInquiryData(input) as CollegeFeeInquiryCreateData),
      trackingNumber,
      trackingId: formatCollegeFeeInquiryTrackingId(trackingNumber),
    },
    select: collegeFeeInquirySelect,
  });

  await sendInquiryEmails(inquiry, dependencies);

  return inquiry;
};

export const createCollegeFeeInquiry = async (input: CreateCollegeFeeInquiryInput) => {
  return createCollegeFeeInquiryWithDependencies(input);
};

export const updateCollegeFeeInquiry = async (
  id: string,
  input: UpdateCollegeFeeInquiryInput,
) => {
  await getCollegeFeeInquiryById(id, defaultDependencies.collegeFeeInquiryModel);
  await ensureMedicalCollegeExists(input.interestedCollegeId, defaultDependencies.medicalCollegeModel);

  return defaultDependencies.collegeFeeInquiryModel.update({
    where: { id },
    data: buildCollegeFeeInquiryData(input) as Prisma.CollegeFeeInquiryUncheckedUpdateInput,
    select: collegeFeeInquirySelect,
  });
};

export const deleteCollegeFeeInquiry = async (id: string) => {
  await getCollegeFeeInquiryById(id, defaultDependencies.collegeFeeInquiryModel);

  await defaultDependencies.collegeFeeInquiryModel.delete({
    where: { id },
  });
};

export const markCollegeFeeInquiryAsRead = async (id: string) => {
  const inquiry = await getCollegeFeeInquiryById(id, defaultDependencies.collegeFeeInquiryModel);

  if (inquiry.readAt) {
    return inquiry;
  }

  return defaultDependencies.collegeFeeInquiryModel.update({
    where: { id },
    data: {
      readAt: new Date(),
    },
    select: collegeFeeInquirySelect,
  });
};

export const markCollegeFeeInquiryAsUnread = async (id: string) => {
  const inquiry = await getCollegeFeeInquiryById(id, defaultDependencies.collegeFeeInquiryModel);

  if (!inquiry.readAt) {
    return inquiry;
  }

  return defaultDependencies.collegeFeeInquiryModel.update({
    where: { id },
    data: {
      readAt: null,
    },
    select: collegeFeeInquirySelect,
  });
};
