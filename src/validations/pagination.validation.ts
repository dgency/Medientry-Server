import { z } from 'zod';

import {
  defaultPaginationLimit,
  defaultPaginationPage,
  maxPaginationLimit,
} from '../utils/pagination';

export const normalizeOptionalQueryString = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }

  return typeof value === 'string' ? value : undefined;
}, z.string().trim().optional().transform((value) => (value ? value : undefined)));

const positiveSafeIntegerQueryValue = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }

  return typeof value === 'string' ? value : value;
}, z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional());

export const paginationQueryFields = {
  page: positiveSafeIntegerQueryValue.transform((value) => value ?? defaultPaginationPage),
  limit: positiveSafeIntegerQueryValue.transform((value) =>
    Math.min(value ?? defaultPaginationLimit, maxPaginationLimit),
  ),
};
