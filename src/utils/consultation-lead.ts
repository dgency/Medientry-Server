import { env } from '../config/env';

export const consultationLeadTrackingSequenceName = 'consultation_lead_tracking_number_seq';
export const consultationLeadTrackingPrefix = 'MBD-';
export const consultationLeadFormName = 'Book Free Consultation';
export const consultationLeadEmailTimezone = 'Asia/Dhaka';
export const consultationLeadEmailTimezoneLabel = 'Bangladesh Time';

export const formatConsultationLeadTrackingId = (trackingNumber: number) =>
  `${consultationLeadTrackingPrefix}${String(trackingNumber).padStart(3, '0')}`;

export const buildConsultationLeadAdminActionUrl = (leadId: string) => {
  const adminBaseUrl = env.ADMIN_URL.trim().replace(/\/+$/, '');

  return adminBaseUrl ? `${adminBaseUrl}/consultation-leads/${leadId}` : undefined;
};
