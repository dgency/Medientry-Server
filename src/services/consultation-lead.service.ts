import { Prisma } from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { sendEmail } from '../utils/mailer';

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
  website?: string;
};

const consultationLeadSelect = {
  id: true,
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

const buildConsultationLeadData = (
  input: CreateConsultationLeadInput,
): Prisma.ConsultationLeadUncheckedCreateInput => ({
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
  sourcePage: normalizeNullableString(input.sourcePage),
  submissionDate: input.submissionDate ?? null,
});

const assertNoSpamIndicators = async (input: CreateConsultationLeadInput) => {
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

  const recentSubmission = await prisma.consultationLead.findFirst({
    where: {
      createdAt: { gte: new Date(Date.now() - recentLeadWindowMs) },
      OR: recentSubmissionMatchers,
    },
    select: { id: true },
  });

  if (recentSubmission) {
    throw new ApiError(429, 'Please wait a moment before submitting another consultation request.');
  }

  const duplicateSubmission = await prisma.consultationLead.findFirst({
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

const getConsultationLeadNotificationRecipient = async () => {
  const siteSetting = await prisma.siteSetting.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      contactEmail: true,
    },
  });

  return siteSetting?.contactEmail?.trim() || env.MAIL_FROM_EMAIL?.trim() || null;
};

const sendConsultationLeadNotification = async (lead: Prisma.ConsultationLeadGetPayload<{
  select: typeof consultationLeadSelect;
}>) => {
  if (!env.MAIL_ENABLED) {
    return;
  }

  const recipient = await getConsultationLeadNotificationRecipient();

  if (!recipient) {
    return;
  }

  try {
    await sendEmail({
      to: recipient,
      replyTo: lead.emailAddress ?? undefined,
      template: {
        name: 'consultationLead',
        context: {
          name: lead.fullName,
          userRole: lead.userRole,
          whatsappNumber: lead.whatsappNumber,
          phoneNumber: lead.phoneNumber,
          passingYear: lead.passingYear,
          neetScore: lead.neetScore ?? undefined,
          stateName: lead.stateName,
          preferredCollege: lead.preferredCollege ?? undefined,
          sourcePage: lead.sourcePage ?? undefined,
        },
      },
    });
  } catch {
    console.error(
      '[consultation-lead] Lead was saved, but the notification email could not be delivered.',
    );
  }
};

export const listConsultationLeads = async () => {
  return prisma.consultationLead.findMany({
    select: consultationLeadSelect,
    orderBy: [{ createdAt: 'desc' }],
  });
};

export const createConsultationLead = async (input: CreateConsultationLeadInput) => {
  await assertNoSpamIndicators(input);

  const lead = await prisma.consultationLead.create({
    data: buildConsultationLeadData(input),
    select: consultationLeadSelect,
  });

  await sendConsultationLeadNotification(lead);

  return lead;
};

export const deleteConsultationLead = async (id: string) => {
  const existingLead = await prisma.consultationLead.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingLead) {
    throw new ApiError(404, 'Consultation lead not found.');
  }

  await prisma.consultationLead.delete({
    where: { id },
  });
};
