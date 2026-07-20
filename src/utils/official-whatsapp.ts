import { prisma } from '../config/prisma';
import { env } from '../config/env';

export type OfficialWhatsAppContact = {
  phoneNumber: string;
  displayNumber: string;
  url: string;
};

const normalizeDigits = (value?: string | null) => {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits || null;
};

const normalizeDisplayValue = (value?: string | null) => value?.trim() || null;

const buildWhatsAppUrl = (phoneNumber: string, message?: string | null) => {
  const normalizedPhoneNumber = normalizeDigits(phoneNumber);

  if (!normalizedPhoneNumber) {
    return undefined;
  }

  const baseUrl = `https://wa.me/${normalizedPhoneNumber}`;
  return message?.trim()
    ? `${baseUrl}?text=${encodeURIComponent(message.trim())}`
    : baseUrl;
};

const extractPhoneNumberFromWhatsAppUrl = (value?: string | null) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedMatch = trimmedValue.match(/wa\.me\/(\d+)/i);
  return normalizedMatch?.[1] ?? normalizeDigits(trimmedValue);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const resolveFromEnvironment = (): OfficialWhatsAppContact | null => {
  const phoneNumber = normalizeDigits(env.WHATSAPP_NUMBER);
  const displayNumber = normalizeDisplayValue(env.WHATSAPP_DISPLAY_NUMBER ?? env.WHATSAPP_NUMBER);

  if (!phoneNumber || !displayNumber) {
    return null;
  }

  return {
    phoneNumber,
    displayNumber,
    url: `https://wa.me/${phoneNumber}`,
  };
};

const resolveFromContactPage = async (): Promise<OfficialWhatsAppContact | null> => {
  const contactPage = await prisma.page.findUnique({
    where: { slug: 'contact' },
    select: { content: true },
  });

  if (!isRecord(contactPage?.content)) {
    return null;
  }

  const contactMethods = Array.isArray(contactPage.content.contactMethods)
    ? contactPage.content.contactMethods
    : [];

  for (const method of contactMethods) {
    if (!isRecord(method)) {
      continue;
    }

    const title = typeof method.title === 'string' ? method.title.trim().toLowerCase() : '';
    const href = typeof method.href === 'string' ? method.href.trim() : '';
    const value = typeof method.value === 'string' ? method.value.trim() : '';

    if (title !== 'whatsapp' && !/wa\.me\//i.test(href)) {
      continue;
    }

    const phoneNumber = extractPhoneNumberFromWhatsAppUrl(href || value);
    const displayNumber = normalizeDisplayValue(value || phoneNumber);

    if (!phoneNumber || !displayNumber) {
      continue;
    }

    return {
      phoneNumber,
      displayNumber,
      url: `https://wa.me/${phoneNumber}`,
    };
  }

  return null;
};

export const resolveOfficialWhatsAppContact = async (): Promise<OfficialWhatsAppContact | null> => {
  return resolveFromEnvironment() ?? (await resolveFromContactPage());
};

export const buildPrefilledWhatsAppUrl = (
  contact: OfficialWhatsAppContact,
  message: string,
) => buildWhatsAppUrl(contact.phoneNumber, message) ?? contact.url;
