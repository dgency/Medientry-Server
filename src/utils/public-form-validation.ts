import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

const allowedPhoneCharactersPattern = /^[+\d\s\-()]+$/;
const minimumPhoneDigits = 7;
const maximumPhoneDigits = 15;

export const normalizePublicFormText = (value: string) => value.trim();

export const normalizePublicPhoneNumber = (value: string) => {
  const trimmedValue = value.trim();
  const hasLeadingPlus = trimmedValue.startsWith('+');
  const digits = trimmedValue.replace(/\D/g, '');

  return hasLeadingPlus ? `+${digits}` : digits;
};

export const isValidPublicPhoneNumber = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue || !allowedPhoneCharactersPattern.test(trimmedValue)) {
    return false;
  }

  const normalizedValue = normalizePublicPhoneNumber(trimmedValue);
  const digits = normalizedValue.replace(/\D/g, '');

  if (digits.length < minimumPhoneDigits || digits.length > maximumPhoneDigits) {
    return false;
  }

  const internationalCandidate = normalizedValue.startsWith('+')
    ? normalizedValue
    : `+${digits}`;
  const parsedNumber = parsePhoneNumberFromString(internationalCandidate);

  if (!parsedNumber) {
    return true;
  }

  return parsedNumber.isPossible();
};

export const normalizeOptionalPublicEmailAddress = (value?: string | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmedValue = value.trim().toLowerCase();
  return trimmedValue || undefined;
};
