import { env } from '../config/env';

export const collegeFeeInquiryTrackingSequenceName = 'college_fee_inquiry_tracking_number_seq';
export const collegeFeeInquiryTrackingPrefix = 'INQ-';
export const collegeFeeInquiryFormName = 'College Fee Inquiry';
export const collegeFeeInquiryEmailTimezone = 'Asia/Dhaka';
export const collegeFeeInquiryEmailTimezoneLabel = 'Bangladesh Time';

export const formatCollegeFeeInquiryTrackingId = (trackingNumber: number) =>
  `${collegeFeeInquiryTrackingPrefix}${String(trackingNumber).padStart(3, '0')}`;

export const buildCollegeFeeInquiryAdminActionUrl = (inquiryId: string) => {
  const adminBaseUrl = env.ADMIN_URL.trim().replace(/\/+$/, '');

  return adminBaseUrl ? `${adminBaseUrl}/college-fee-inquiries/${inquiryId}` : undefined;
};
