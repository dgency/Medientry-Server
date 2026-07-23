export const dashboardPageSize = 15;

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginationItem =
  | { type: 'page'; value: number }
  | { type: 'ellipsis'; key: string };

export const clampPage = (page: number, totalPages: number) =>
  Math.min(Math.max(page, 1), Math.max(totalPages, 1));

export const buildLocalPaginationMeta = ({
  page,
  limit,
  totalItems,
}: {
  page: number;
  limit: number;
  totalItems: number;
}): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = clampPage(page, totalPages);

  return {
    page: currentPage,
    limit,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
};

export const buildPaginationItems = (
  currentPage: number,
  totalPages: number,
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: 'page' as const,
      value: index + 1,
    }));
  }

  const items: PaginationItem[] = [{ type: 'page', value: 1 }];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    items.push({ type: 'ellipsis', key: 'start-ellipsis' });
  }

  for (let page = start; page <= end; page += 1) {
    items.push({ type: 'page', value: page });
  }

  if (end < totalPages - 1) {
    items.push({ type: 'ellipsis', key: 'end-ellipsis' });
  }

  items.push({ type: 'page', value: totalPages });

  return items;
};
