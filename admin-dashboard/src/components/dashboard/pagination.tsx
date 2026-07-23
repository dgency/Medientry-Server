import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { buildPaginationItems, type PaginationMeta } from '../../lib/pagination';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

type PaginationProps = {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ pagination, onPageChange, className }: PaginationProps) {
  if (pagination.totalItems <= pagination.limit) {
    return null;
  }

  const items = buildPaginationItems(pagination.page, pagination.totalPages);
  const startRecord = (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.totalItems);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 sm:px-5',
        className,
      )}
    >
      <div className="text-sm text-muted-foreground">
        Showing {startRecord}-{endRecord} of {pagination.totalItems} records
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="Pagination">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!pagination.hasPreviousPage}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPreviousPage}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {items.map((item) =>
          item.type === 'ellipsis' ? (
            <span key={item.key} className="px-2 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={item.value}
              type="button"
              variant={item.value === pagination.page ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(item.value)}
              aria-current={item.value === pagination.page ? 'page' : undefined}
              className="min-w-10"
            >
              {item.value}
            </Button>
          ),
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.totalPages)}
          disabled={!pagination.hasNextPage}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
