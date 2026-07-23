export const defaultPaginationPage = 1;
export const defaultPaginationLimit = 15;
export const maxPaginationLimit = 100;

export type PaginationInput = {
  page: number;
  limit: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

const parsePositiveSafeInteger = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    return undefined;
  }

  return parsedValue;
};

export const resolvePaginationInput = ({
  page,
  limit,
  enabledByDefault = false,
}: {
  page: unknown;
  limit: unknown;
  enabledByDefault?: boolean;
}) => {
  const parsedPage = parsePositiveSafeInteger(page);
  const parsedLimit = parsePositiveSafeInteger(limit);
  const shouldPaginate =
    enabledByDefault || parsedPage !== undefined || parsedLimit !== undefined;

  if (!shouldPaginate) {
    return null;
  }

  return {
    page: parsedPage ?? defaultPaginationPage,
    limit: Math.min(parsedLimit ?? defaultPaginationLimit, maxPaginationLimit),
  } satisfies PaginationInput;
};

export const buildPaginationMeta = ({
  page,
  limit,
  totalItems,
}: PaginationInput & { totalItems: number }): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  return {
    page: safePage,
    limit,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
};

export const buildPaginatedResult = <T>({
  items,
  page,
  limit,
  totalItems,
}: PaginationInput & {
  items: T[];
  totalItems: number;
}): PaginatedResult<T> => ({
  items,
  pagination: buildPaginationMeta({
    page,
    limit,
    totalItems,
  }),
});

export const paginateArray = <T,>(
  items: T[],
  pagination: PaginationInput | null,
): T[] | PaginatedResult<T> => {
  if (!pagination) {
    return items;
  }

  const metadata = buildPaginationMeta({
    page: pagination.page,
    limit: pagination.limit,
    totalItems: items.length,
  });
  const startIndex = (metadata.page - 1) * metadata.limit;

  return {
    items: items.slice(startIndex, startIndex + metadata.limit),
    pagination: metadata,
  };
};

export const isPaginatedResult = <T,>(
  value: T[] | PaginatedResult<T>,
): value is PaginatedResult<T> =>
  !Array.isArray(value)
  && typeof value === 'object'
  && value !== null
  && 'items' in value
  && 'pagination' in value;
