import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../src/utils/api-error';
import {
  createCollegeFeeInquiryWithDependencies,
} from '../src/services/college-fee-inquiry.service';
import {
  createConsultationLeadWithDependencies,
} from '../src/services/consultation-lead.service';

const createConsultationLeadInput = () => ({
  fullName: 'Aisha Rahman',
  userRole: 'Student',
  whatsappNumber: '+8801711111111',
  phoneNumber: '+8801711111111',
  emailAddress: 'aisha@example.com',
  country: 'Bangladesh',
  passingYear: '2026',
  neetScore: '650',
  stateName: 'Dhaka',
  preferredCollege: 'Dhaka National Medical College',
  message: 'Need guidance for admission.',
  sourcePage: 'https://www.medientrybd.com/contact',
  submissionSource: 'contact' as const,
});

const createCollegeFeeInquiryInput = () => ({
  fullName: 'Aisha Rahman',
  phoneNumber: '+8801711111111',
  emailAddress: 'aisha@example.com',
  country: 'Bangladesh',
  preferredStudyDestination: 'MBBS in Bangladesh',
  interestedCollegeId: '4fd955b7-7f6f-44c8-9259-24fcb18e98f5',
  interestedCollegeName: 'Dhaka National Medical College',
  message: 'Please share the latest fee structure.',
  source: 'College Enquiry Popup | home-featured-college-card',
  sourcePage: 'https://www.medientrybd.com/colleges',
});

test('consultation lead flow sends an admin notification for the public endpoint', async () => {
  const adminNotifications: Array<Record<string, unknown>> = [];
  const customerConfirmations: Array<Record<string, unknown>> = [];
  const lead = await createConsultationLeadWithDependencies(createConsultationLeadInput(), {
    consultationLeadModel: {
      findFirst: async () => null,
      create: async () => ({
        id: 'lead-1',
        trackingNumber: 1,
        trackingId: 'MBD-001',
        fullName: 'Aisha Rahman',
        userRole: 'Student',
        whatsappNumber: '+8801711111111',
        phoneNumber: '+8801711111111',
        emailAddress: 'aisha@example.com',
        country: 'Bangladesh',
        ipAddress: null,
        ipLocation: null,
        userAgent: null,
        deviceType: null,
        deviceLabel: null,
        passingYear: '2026',
        neetScore: '650',
        stateName: 'Dhaka',
        preferredCollege: 'Dhaka National Medical College',
        message: 'Need guidance for admission.',
        sourcePage: 'https://www.medientrybd.com/contact',
        submissionDate: new Date('2026-07-19T10:00:00.000Z'),
        createdAt: new Date('2026-07-19T10:00:00.000Z'),
        updatedAt: new Date('2026-07-19T10:00:00.000Z'),
      }),
      findMany: async () => [],
      findUnique: async () => null,
      delete: async () => ({ id: 'lead-1' }),
    },
    allocateTrackingNumber: async () => 1,
    sendAdminFormNotification: async (payload) => {
      adminNotifications.push(payload as Record<string, unknown>);
      return { skipped: false, messageId: 'mail-1' };
    },
    sendCustomerConfirmation: async (payload) => {
      customerConfirmations.push(payload as Record<string, unknown>);
      return { skipped: false, messageId: 'customer-1' };
    },
    resolveOfficialWhatsAppContact: async () => ({
      phoneNumber: '8801713456910',
      displayNumber: '+880 1713-456910',
      url: 'https://wa.me/8801713456910',
    }),
  });

  assert.equal(lead.id, 'lead-1');
  assert.equal(adminNotifications.length, 1);
  assert.equal(customerConfirmations.length, 1);
  assert.equal(adminNotifications[0].formName, 'Book Free Consultation');
  assert.equal(adminNotifications[0].submissionId, 'MBD-001');
  assert.equal(adminNotifications[0].trackingId, 'MBD-001');
  assert.equal(
    customerConfirmations[0].subject,
    'Your Free Consultation Request Has Been Received — MBD-001',
  );
});

test('consultation lead save still succeeds when email delivery fails', async () => {
  const lead = await createConsultationLeadWithDependencies(createConsultationLeadInput(), {
    consultationLeadModel: {
      findFirst: async () => null,
      create: async () => ({
        id: 'lead-2',
        trackingNumber: 2,
        trackingId: 'MBD-002',
        fullName: 'Aisha Rahman',
        userRole: 'Student',
        whatsappNumber: '+8801711111111',
        phoneNumber: '+8801711111111',
        emailAddress: 'aisha@example.com',
        country: 'Bangladesh',
        ipAddress: null,
        ipLocation: null,
        userAgent: null,
        deviceType: null,
        deviceLabel: null,
        passingYear: '2026',
        neetScore: '650',
        stateName: 'Dhaka',
        preferredCollege: 'Dhaka National Medical College',
        message: 'Need guidance for admission.',
        sourcePage: 'https://www.medientrybd.com/contact',
        submissionDate: new Date('2026-07-19T10:00:00.000Z'),
        createdAt: new Date('2026-07-19T10:00:00.000Z'),
        updatedAt: new Date('2026-07-19T10:00:00.000Z'),
      }),
      findMany: async () => [],
      findUnique: async () => null,
      delete: async () => ({ id: 'lead-2' }),
    },
    allocateTrackingNumber: async () => 2,
    sendAdminFormNotification: async () => {
      throw new Error('SMTP unavailable');
    },
    sendCustomerConfirmation: async () => ({ skipped: false, messageId: 'customer-2' }),
    resolveOfficialWhatsAppContact: async () => ({
      phoneNumber: '8801713456910',
      displayNumber: '+880 1713-456910',
      url: 'https://wa.me/8801713456910',
    }),
  });

  assert.equal(lead.id, 'lead-2');
});

test('consultation lead allows repeated submissions from the same user data', async () => {
  const createdLeadIds: string[] = [];

  const createLead = (trackingNumber: number) =>
    createConsultationLeadWithDependencies(createConsultationLeadInput(), {
      consultationLeadModel: {
        findFirst: async () => null,
        create: async ({ data }) => {
          const record = data as {
            trackingId: string;
            fullName: string;
            userRole: string;
            whatsappNumber: string;
            phoneNumber: string;
            emailAddress?: string | null;
            country?: string | null;
            ipAddress?: string | null;
            ipLocation?: string | null;
            userAgent?: string | null;
            deviceType?: string | null;
            deviceLabel?: string | null;
            passingYear: string;
            neetScore?: string | null;
            stateName: string;
            preferredCollege?: string | null;
            message?: string | null;
            sourcePage?: string | null;
            submissionDate?: Date | null;
          };

          createdLeadIds.push(record.trackingId);

          return {
            id: `lead-${trackingNumber}`,
            trackingNumber,
            trackingId: record.trackingId,
            fullName: record.fullName,
            userRole: record.userRole,
            whatsappNumber: record.whatsappNumber,
            phoneNumber: record.phoneNumber,
            emailAddress: record.emailAddress ?? null,
            country: record.country ?? null,
            ipAddress: record.ipAddress ?? null,
            ipLocation: record.ipLocation ?? null,
            userAgent: record.userAgent ?? null,
            deviceType: record.deviceType ?? null,
            deviceLabel: record.deviceLabel ?? null,
            passingYear: record.passingYear,
            neetScore: record.neetScore ?? null,
            stateName: record.stateName,
            preferredCollege: record.preferredCollege ?? null,
            message: record.message ?? null,
            sourcePage: record.sourcePage ?? null,
            submissionDate: record.submissionDate ?? null,
            createdAt: new Date('2026-07-19T10:00:00.000Z'),
            updatedAt: new Date('2026-07-19T10:00:00.000Z'),
          };
        },
        findMany: async () => [],
        findUnique: async () => null,
        delete: async () => ({ id: `lead-${trackingNumber}` }),
      },
      allocateTrackingNumber: async () => trackingNumber,
      sendAdminFormNotification: async () => ({ skipped: false, messageId: `admin-${trackingNumber}` }),
      sendCustomerConfirmation: async () => ({ skipped: false, messageId: `customer-${trackingNumber}` }),
      resolveOfficialWhatsAppContact: async () => null,
    });

  const [firstLead, secondLead] = await Promise.all([createLead(3), createLead(4)]);

  assert.equal(firstLead.id, 'lead-3');
  assert.equal(secondLead.id, 'lead-4');
  assert.deepEqual(createdLeadIds.sort(), ['MBD-003', 'MBD-004']);
});

test('consultation lead flow keeps unique MBD tracking IDs across near-simultaneous submissions', async () => {
  let nextTrackingNumber = 10;
  const createdTrackingIds: string[] = [];
  const createLead = (id: string, fullName: string, phoneNumber: string) =>
    createConsultationLeadWithDependencies(
      {
        ...createConsultationLeadInput(),
        fullName,
        phoneNumber,
        whatsappNumber: phoneNumber,
      },
      {
        consultationLeadModel: {
          findFirst: async () => null,
          create: async ({ data }) => {
            const record = data as {
              trackingNumber: number;
              trackingId: string;
              fullName: string;
              phoneNumber: string;
              whatsappNumber: string;
              userRole: string;
              emailAddress?: string | null;
              country?: string | null;
              ipAddress?: string | null;
              ipLocation?: string | null;
              userAgent?: string | null;
              deviceType?: string | null;
              deviceLabel?: string | null;
              passingYear: string;
              neetScore?: string | null;
              stateName: string;
              preferredCollege?: string | null;
              message?: string | null;
              sourcePage?: string | null;
              submissionDate?: Date | null;
            };
            createdTrackingIds.push(record.trackingId);

            return {
              id,
              trackingNumber: record.trackingNumber,
              trackingId: record.trackingId,
              fullName: record.fullName,
              userRole: record.userRole,
              whatsappNumber: record.whatsappNumber,
              phoneNumber: record.phoneNumber,
              emailAddress: record.emailAddress ?? null,
              country: record.country ?? null,
              ipAddress: record.ipAddress ?? null,
              ipLocation: record.ipLocation ?? null,
              userAgent: record.userAgent ?? null,
              deviceType: record.deviceType ?? null,
              deviceLabel: record.deviceLabel ?? null,
              passingYear: record.passingYear,
              neetScore: record.neetScore ?? null,
              stateName: record.stateName,
              preferredCollege: record.preferredCollege ?? null,
              message: record.message ?? null,
              sourcePage: record.sourcePage ?? null,
              submissionDate: record.submissionDate ?? null,
              createdAt: new Date('2026-07-19T10:00:00.000Z'),
              updatedAt: new Date('2026-07-19T10:00:00.000Z'),
            };
          },
          findMany: async () => [],
          findUnique: async () => null,
          delete: async () => ({ id }),
        },
        allocateTrackingNumber: async () => nextTrackingNumber++,
        sendAdminFormNotification: async () => ({ skipped: false, messageId: `${id}-mail` }),
        sendCustomerConfirmation: async () => ({ skipped: false, messageId: `${id}-customer` }),
        resolveOfficialWhatsAppContact: async () => null,
      },
    );

  const [leadOne, leadTwo] = await Promise.all([
    createLead('lead-10', 'Aisha Rahman', '+8801711111112'),
    createLead('lead-11', 'Farhan Ahmed', '+8801711111113'),
  ]);

  assert.equal(leadOne.trackingId, 'MBD-010');
  assert.equal(leadTwo.trackingId, 'MBD-011');
  assert.deepEqual(createdTrackingIds.sort(), ['MBD-010', 'MBD-011']);
});

test('college fee inquiry flow sends admin notification and customer confirmation when email exists', async () => {
  const adminNotifications: Array<Record<string, unknown>> = [];
  const customerConfirmations: Array<Record<string, unknown>> = [];
  const inquiry = await createCollegeFeeInquiryWithDependencies(createCollegeFeeInquiryInput(), {
    collegeFeeInquiryModel: {
      findFirst: async () => null,
      create: async ({ data }) => {
        const record = data as {
          trackingNumber: number;
          trackingId: string;
          medicalCollegeId?: string | null;
          fullName: string;
          phoneNumber: string;
          emailAddress?: string | null;
          country?: string | null;
          preferredStudyDestination?: string | null;
          interestedCollegeName: string;
          message?: string | null;
          source?: string | null;
          sourcePage?: string | null;
        };

        return {
          id: 'inq-1',
          trackingNumber: record.trackingNumber,
          trackingId: record.trackingId,
          medicalCollegeId: record.medicalCollegeId ?? '4fd955b7-7f6f-44c8-9259-24fcb18e98f5',
          fullName: record.fullName,
          phoneNumber: record.phoneNumber,
          emailAddress: record.emailAddress ?? null,
          country: record.country ?? null,
          preferredStudyDestination: record.preferredStudyDestination ?? null,
          interestedCollegeName: record.interestedCollegeName,
          message: record.message ?? null,
          source: record.source ?? 'College Enquiry Popup | home-featured-college-card',
          sourcePage: record.sourcePage ?? 'https://www.medientrybd.com/colleges',
          readAt: null,
          createdAt: new Date('2026-07-19T10:30:00.000Z'),
          updatedAt: new Date('2026-07-19T10:30:00.000Z'),
        };
      },
      delete: async () => ({ id: 'inq-1' }),
      findMany: async () => [],
      findUnique: async () => null,
      update: async () => {
        throw new Error('not used');
      },
    },
    medicalCollegeModel: {
      findUnique: async () => ({ id: '4fd955b7-7f6f-44c8-9259-24fcb18e98f5' }),
    },
    allocateTrackingNumber: async () => 1,
    sendAdminFormNotification: async (payload) => {
      adminNotifications.push(payload as Record<string, unknown>);
      return { skipped: false, messageId: 'admin-mail-1' };
    },
    sendCustomerConfirmation: async (payload) => {
      customerConfirmations.push(payload as Record<string, unknown>);
      return { skipped: false, messageId: 'customer-mail-1' };
    },
    resolveOfficialWhatsAppContact: async () => ({
      phoneNumber: '8801713456910',
      displayNumber: '+880 1713-456910',
      url: 'https://wa.me/8801713456910',
    }),
  });

  assert.equal(inquiry.id, 'inq-1');
  assert.equal(inquiry.trackingId, 'INQ-001');
  assert.equal(adminNotifications.length, 1);
  assert.equal(customerConfirmations.length, 1);
  assert.equal(adminNotifications[0].formName, 'College Fee Inquiry');
  assert.equal(adminNotifications[0].submissionId, 'INQ-001');
  assert.equal(adminNotifications[0].trackingId, 'INQ-001');
  assert.equal(adminNotifications[0].subject, 'New College Fee Inquiry \u2014 INQ-001 \u2014 Aisha Rahman');
  assert.equal(customerConfirmations[0].to, 'aisha@example.com');
  assert.equal(
    customerConfirmations[0].subject,
    'Your College Fee Inquiry Has Been Received — INQ-001',
  );
});

test('college fee inquiry does not send customer confirmation when no email address exists', async () => {
  const customerConfirmations: Array<Record<string, unknown>> = [];
  await createCollegeFeeInquiryWithDependencies(
    {
      ...createCollegeFeeInquiryInput(),
      emailAddress: undefined,
    },
    {
      collegeFeeInquiryModel: {
        findFirst: async () => null,
        create: async ({ data }) => {
          const record = data as {
            trackingNumber: number;
            trackingId: string;
            medicalCollegeId?: string | null;
            fullName: string;
            phoneNumber: string;
            country?: string | null;
            preferredStudyDestination?: string | null;
            interestedCollegeName: string;
            message?: string | null;
            source?: string | null;
            sourcePage?: string | null;
          };

          return {
          id: 'inq-2',
          trackingNumber: record.trackingNumber,
          trackingId: record.trackingId,
          medicalCollegeId: record.medicalCollegeId ?? '4fd955b7-7f6f-44c8-9259-24fcb18e98f5',
          fullName: record.fullName,
          phoneNumber: record.phoneNumber,
          emailAddress: null,
          country: record.country ?? 'Bangladesh',
          preferredStudyDestination: record.preferredStudyDestination ?? 'MBBS in Bangladesh',
          interestedCollegeName: record.interestedCollegeName,
          message: record.message ?? 'Please share the latest fee structure.',
          source: record.source ?? 'College Enquiry Popup | colleges-grid-card',
          sourcePage: record.sourcePage ?? 'https://www.medientrybd.com/colleges',
          readAt: null,
          createdAt: new Date('2026-07-19T10:30:00.000Z'),
          updatedAt: new Date('2026-07-19T10:30:00.000Z'),
          };
        },
        delete: async () => ({ id: 'inq-2' }),
        findMany: async () => [],
        findUnique: async () => null,
        update: async () => {
          throw new Error('not used');
        },
      },
      medicalCollegeModel: {
        findUnique: async () => ({ id: '4fd955b7-7f6f-44c8-9259-24fcb18e98f5' }),
      },
      allocateTrackingNumber: async () => 2,
      sendAdminFormNotification: async () => ({ skipped: false, messageId: 'admin-mail-2' }),
      sendCustomerConfirmation: async (payload) => {
        customerConfirmations.push(payload as Record<string, unknown>);
        return { skipped: false, messageId: 'customer-mail-2' };
      },
      resolveOfficialWhatsAppContact: async () => null,
    },
  );

  assert.equal(customerConfirmations.length, 0);
});

test('college fee inquiry flow keeps unique INQ tracking IDs across near-simultaneous submissions', async () => {
  let nextTrackingNumber = 10;
  const createdTrackingIds: string[] = [];
  const createInquiry = (id: string, fullName: string, phoneNumber: string) =>
    createCollegeFeeInquiryWithDependencies(
      {
        ...createCollegeFeeInquiryInput(),
        fullName,
        phoneNumber,
      },
      {
        collegeFeeInquiryModel: {
          findFirst: async () => null,
          create: async ({ data }) => {
            const record = data as {
              trackingNumber: number;
              trackingId: string;
              medicalCollegeId?: string | null;
              fullName: string;
              phoneNumber: string;
              emailAddress?: string | null;
              country?: string | null;
              preferredStudyDestination?: string | null;
              interestedCollegeName: string;
              message?: string | null;
              source?: string | null;
              sourcePage?: string | null;
            };
            createdTrackingIds.push(record.trackingId);

            return {
              id,
              trackingNumber: record.trackingNumber,
              trackingId: record.trackingId,
              medicalCollegeId: record.medicalCollegeId ?? null,
              fullName: record.fullName,
              phoneNumber: record.phoneNumber,
              emailAddress: record.emailAddress ?? null,
              country: record.country ?? null,
              preferredStudyDestination: record.preferredStudyDestination ?? null,
              interestedCollegeName: record.interestedCollegeName,
              message: record.message ?? null,
              source: record.source ?? 'College Enquiry Popup | colleges-grid-card',
              sourcePage: record.sourcePage ?? 'https://www.medientrybd.com/colleges',
              readAt: null,
              createdAt: new Date('2026-07-19T10:30:00.000Z'),
              updatedAt: new Date('2026-07-19T10:30:00.000Z'),
            };
          },
          delete: async () => ({ id }),
          findMany: async () => [],
          findUnique: async () => null,
          update: async () => {
            throw new Error('not used');
          },
        },
        medicalCollegeModel: {
          findUnique: async () => ({ id: '4fd955b7-7f6f-44c8-9259-24fcb18e98f5' }),
        },
        allocateTrackingNumber: async () => nextTrackingNumber++,
        sendAdminFormNotification: async () => ({ skipped: false, messageId: `${id}-mail` }),
        sendCustomerConfirmation: async () => ({ skipped: false, messageId: `${id}-customer` }),
        resolveOfficialWhatsAppContact: async () => null,
      },
    );

  const [inquiryOne, inquiryTwo] = await Promise.all([
    createInquiry('inq-10', 'Aisha Rahman', '+8801711111112'),
    createInquiry('inq-11', 'Farhan Ahmed', '+8801711111113'),
  ]);

  assert.equal(inquiryOne.trackingId, 'INQ-010');
  assert.equal(inquiryTwo.trackingId, 'INQ-011');
  assert.deepEqual(createdTrackingIds.sort(), ['INQ-010', 'INQ-011']);
});

test('college fee inquiry allows repeated submissions from the same user data', async () => {
  const createdInquiryIds: string[] = [];

  const createInquiry = (trackingNumber: number) =>
    createCollegeFeeInquiryWithDependencies(createCollegeFeeInquiryInput(), {
      collegeFeeInquiryModel: {
        findFirst: async () => null,
        create: async ({ data }) => {
          const record = data as {
            trackingId: string;
            medicalCollegeId?: string | null;
            fullName: string;
            phoneNumber: string;
            emailAddress?: string | null;
            country?: string | null;
            preferredStudyDestination?: string | null;
            interestedCollegeName: string;
            message?: string | null;
            source?: string | null;
            sourcePage?: string | null;
          };

          createdInquiryIds.push(record.trackingId);

          return {
            id: `inq-${trackingNumber}`,
            trackingNumber,
            trackingId: record.trackingId,
            medicalCollegeId: record.medicalCollegeId ?? null,
            fullName: record.fullName,
            phoneNumber: record.phoneNumber,
            emailAddress: record.emailAddress ?? null,
            country: record.country ?? null,
            preferredStudyDestination: record.preferredStudyDestination ?? null,
            interestedCollegeName: record.interestedCollegeName,
            message: record.message ?? null,
            source: record.source ?? 'College Enquiry Popup | colleges-grid-card',
            sourcePage: record.sourcePage ?? 'https://www.medientrybd.com/colleges',
            readAt: null,
            createdAt: new Date('2026-07-19T10:30:00.000Z'),
            updatedAt: new Date('2026-07-19T10:30:00.000Z'),
          };
        },
        delete: async () => ({ id: `inq-${trackingNumber}` }),
        findMany: async () => [],
        findUnique: async () => null,
        update: async () => {
          throw new Error('not used');
        },
      },
      medicalCollegeModel: {
        findUnique: async () => ({ id: '4fd955b7-7f6f-44c8-9259-24fcb18e98f5' }),
      },
      allocateTrackingNumber: async () => trackingNumber,
      sendAdminFormNotification: async () => ({ skipped: false, messageId: `admin-${trackingNumber}` }),
      sendCustomerConfirmation: async () => ({ skipped: false, messageId: `customer-${trackingNumber}` }),
      resolveOfficialWhatsAppContact: async () => null,
    });

  const [firstInquiry, secondInquiry] = await Promise.all([createInquiry(12), createInquiry(13)]);

  assert.equal(firstInquiry.id, 'inq-12');
  assert.equal(secondInquiry.id, 'inq-13');
  assert.deepEqual(createdInquiryIds.sort(), ['INQ-012', 'INQ-013']);
});
