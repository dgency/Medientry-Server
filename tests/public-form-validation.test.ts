import assert from 'node:assert/strict';
import test from 'node:test';
import { ZodError } from 'zod';

import { createCollegeFeeInquirySchema } from '../src/validations/college-fee-inquiry.validation';
import { createConsultationLeadSchema } from '../src/validations/consultation-lead.validation';

const createConsultationPayload = () => ({
  body: {
    fullName: 'Aisha Rahman',
    userRole: 'Student',
    whatsappNumber: '+91 98765-43210',
    phoneNumber: '(017) 111-11111',
    emailAddress: 'Student@Example.com',
    passingYear: '2026',
    neetScore: '650',
    stateName: 'Dhaka',
    preferredCollege: 'Dhaka National Medical College',
    message: 'Need guidance for admission.',
    sourcePage: 'https://www.medientrybd.com/contact',
    website: '',
  },
});

const createFeeInquiryPayload = () => ({
  body: {
    fullName: 'Aisha Rahman',
    phoneNumber: '+880 1711-111111',
    emailAddress: 'Student@Example.com',
    country: 'Bangladesh',
    preferredStudyDestination: 'MBBS in Bangladesh',
    interestedCollegeId: '4fd955b7-7f6f-44c8-9259-24fcb18e98f5',
    interestedCollegeName: 'Dhaka National Medical College',
    message: 'Please share the latest fee structure.',
    source: 'College Enquiry Popup | home-featured-college-card',
    sourcePage: 'https://www.medientrybd.com/colleges',
    website: '',
  },
});

test('consultation lead schema normalizes phone and email values', () => {
  const parsed = createConsultationLeadSchema.parse(createConsultationPayload());

  assert.equal(parsed.body.whatsappNumber, '+919876543210');
  assert.equal(parsed.body.phoneNumber, '01711111111');
  assert.equal(parsed.body.emailAddress, 'student@example.com');
});

test('consultation lead schema returns a clear WhatsApp validation error', () => {
  assert.throws(
    () =>
      createConsultationLeadSchema.parse({
        body: {
          ...createConsultationPayload().body,
          whatsappNumber: 'abc',
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof ZodError);
      assert.equal(error.issues[0]?.message, 'Please enter a valid WhatsApp number.');
      return true;
    },
  );
});

test('college fee inquiry schema returns a clear email validation error', () => {
  assert.throws(
    () =>
      createCollegeFeeInquirySchema.parse({
        body: {
          ...createFeeInquiryPayload().body,
          emailAddress: 'invalid-email',
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof ZodError);
      assert.equal(error.issues[0]?.message, 'Please enter a valid email address.');
      return true;
    },
  );
});

test('college fee inquiry schema accepts blank optional email addresses', () => {
  const parsed = createCollegeFeeInquirySchema.parse({
    body: {
      ...createFeeInquiryPayload().body,
      emailAddress: '',
    },
  });

  assert.equal(parsed.body.emailAddress, undefined);
  assert.equal(parsed.body.phoneNumber, '+8801711111111');
});
