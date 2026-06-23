import { Prisma } from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { sendEmail } from '../utils/mailer';

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

const collegeFeeInquirySelect = {
  id: true,
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
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CollegeFeeInquirySelect;

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

const buildCollegeFeeInquiryData = (
  input: CreateCollegeFeeInquiryInput | UpdateCollegeFeeInquiryInput,
): Prisma.CollegeFeeInquiryUncheckedCreateInput | Prisma.CollegeFeeInquiryUncheckedUpdateInput => {
  const data:
    | Prisma.CollegeFeeInquiryUncheckedCreateInput
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
    data.source = normalizeNullableString(input.source) ?? 'College Fee Inquiry';
  }

  if ('sourcePage' in input) {
    data.sourcePage = normalizeNullableString(input.sourcePage);
  }

  return data;
};

const assertNoSpamIndicators = async (input: CreateCollegeFeeInquiryInput) => {
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

  const recentSubmission = await prisma.collegeFeeInquiry.findFirst({
    where: {
      createdAt: { gte: createdAfter },
      OR: recentSubmissionMatchers,
    },
    select: { id: true },
  });

  if (recentSubmission) {
    throw new ApiError(429, 'Please wait a moment before submitting another inquiry.');
  }

  const duplicateSubmission = await prisma.collegeFeeInquiry.findFirst({
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

const ensureMedicalCollegeExists = async (medicalCollegeId?: string) => {
  if (!medicalCollegeId) {
    return;
  }

  const medicalCollege = await prisma.medicalCollege.findUnique({
    where: { id: medicalCollegeId },
    select: { id: true },
  });

  if (!medicalCollege) {
    throw new ApiError(400, 'Invalid medical college selected.');
  }
};

const getCollegeFeeInquiryById = async (id: string) => {
  const inquiry = await prisma.collegeFeeInquiry.findUnique({
    where: { id },
    select: collegeFeeInquirySelect,
  });

  if (!inquiry) {
    throw new ApiError(404, 'College fee inquiry not found.');
  }

  return inquiry;
};

const getInquiryNotificationSettings = async () => {
  const siteSetting = await prisma.siteSetting.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      contactEmail: true,
      phone: true,
    },
  });

  return {
    recipient: siteSetting?.contactEmail?.trim() || env.MAIL_FROM_EMAIL?.trim() || null,
    supportPhone: siteSetting?.phone?.trim() || null,
  };
};

const sendInquiryEmails = async (inquiry: {
  fullName: string;
  phoneNumber: string;
  emailAddress: string | null;
  country: string | null;
  preferredStudyDestination: string | null;
  interestedCollegeName: string;
  message: string | null;
}) => {
  if (!env.MAIL_ENABLED) {
    return;
  }

  const { recipient, supportPhone } = await getInquiryNotificationSettings();

  if (!recipient && !inquiry.emailAddress) {
    return;
  }

  try {
    const emailJobs: Array<Promise<unknown>> = [];

    if (recipient) {
      emailJobs.push(
        sendEmail({
          to: recipient,
          replyTo: inquiry.emailAddress ?? undefined,
          template: {
            name: 'admissionEnquiry',
            context: {
              name: inquiry.fullName,
              email: inquiry.emailAddress ?? 'Not provided',
              phone: inquiry.phoneNumber,
              destination: inquiry.preferredStudyDestination ?? inquiry.country ?? undefined,
              preferredCollege: inquiry.interestedCollegeName,
              message: inquiry.message ?? 'College Fee Inquiry',
            },
          },
        }),
      );
    }

    if (inquiry.emailAddress) {
      emailJobs.push(
        sendEmail({
          to: inquiry.emailAddress,
          template: {
            name: 'admissionEnquiryConfirmation',
            context: {
              name: inquiry.fullName,
              preferredCollege: inquiry.interestedCollegeName,
              supportEmail: recipient ?? env.MAIL_FROM_EMAIL ?? undefined,
              supportPhone: supportPhone ?? undefined,
            },
          },
        }),
      );
    }

    await Promise.all(emailJobs);
  } catch {
    console.error(
      '[college-fee-inquiry] Inquiry was saved, but one or more notification emails could not be delivered.',
    );
  }
};

export const listCollegeFeeInquiries = async () => {
  return prisma.collegeFeeInquiry.findMany({
    select: collegeFeeInquirySelect,
    orderBy: [{ createdAt: 'desc' }],
  });
};

export const createCollegeFeeInquiry = async (input: CreateCollegeFeeInquiryInput) => {
  await assertNoSpamIndicators(input);
  await ensureMedicalCollegeExists(input.interestedCollegeId);

  const inquiry = await prisma.collegeFeeInquiry.create({
    data: buildCollegeFeeInquiryData(input) as Prisma.CollegeFeeInquiryUncheckedCreateInput,
    select: collegeFeeInquirySelect,
  });

  await sendInquiryEmails(inquiry);

  return inquiry;
};

export const updateCollegeFeeInquiry = async (
  id: string,
  input: UpdateCollegeFeeInquiryInput,
) => {
  await getCollegeFeeInquiryById(id);
  await ensureMedicalCollegeExists(input.interestedCollegeId);

  return prisma.collegeFeeInquiry.update({
    where: { id },
    data: buildCollegeFeeInquiryData(input) as Prisma.CollegeFeeInquiryUncheckedUpdateInput,
    select: collegeFeeInquirySelect,
  });
};

export const deleteCollegeFeeInquiry = async (id: string) => {
  await getCollegeFeeInquiryById(id);

  await prisma.collegeFeeInquiry.delete({
    where: { id },
  });
};
