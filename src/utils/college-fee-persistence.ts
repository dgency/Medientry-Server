import { Prisma } from '@prisma/client';

import {
  mapCollegeFeeBillingPeriodToPrisma,
  type CollegeFeeItemInput,
} from './college-fee';

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

const normalizeNullableDecimal = (value?: number | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return value;
};

export const normalizeFeeItemsForWrite = (
  feeStructure: CollegeFeeItemInput[],
): Prisma.CollegeFeeItemCreateManyMedicalCollegeInput[] => {
  const orderedItems = [...feeStructure]
    .map((item, index) => ({
      ...item,
      sortOrder:
        Number.isInteger(item.sortOrder) && item.sortOrder >= 0
          ? item.sortOrder
          : index + 1,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      label: item.label.trim(),
      amountUsd: normalizeNullableDecimal(item.amountUsd) ?? null,
      amountInr: normalizeNullableDecimal(item.amountInr) ?? null,
      billingPeriod: mapCollegeFeeBillingPeriodToPrisma(item.billingPeriod),
      description: normalizeNullableString(item.description) ?? null,
      sortOrder: index + 1,
      isTotal: item.isTotal,
      isActive: item.isActive,
    }));

  const totalMarked = orderedItems.some((item) => item.isTotal);

  return orderedItems.map((item, index) => ({
    ...item,
    isTotal: totalMarked
      ? item.isTotal
      : index === 0,
  }));
};
