import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../components/cms/delete-confirm-dialog';
import { ResourceFormDialog } from '../components/cms/resource-form-dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/button-variants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import { resourceConfigs } from '../config/resource-configs';
import { apiClient, extractApiData, getApiErrorMessage } from '../lib/api-client';
import { cn, formatDateTime, formatLabel } from '../lib/utils';

type InquiryStatusFilter = 'all' | 'read' | 'unread';

type CollegeFeeInquiry = {
  id: string;
  trackingId: string;
  medicalCollegeId: string | null;
  fullName: string;
  phoneNumber: string;
  emailAddress: string | null;
  country: string | null;
  preferredStudyDestination: string | null;
  interestedCollegeName: string;
  message: string | null;
  source: string;
  sourcePage: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DetailFieldProps = {
  label: string;
  value: ReactNode;
};

const COLLEGE_FEE_INQUIRY_LIST_QUERY_KEY = ['college-fee-inquiries'] as const;
const collegeFeeInquiryConfig = resourceConfigs['college-fee-inquiries'];
const statusFilters: Array<{ value: InquiryStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const getSanitizedStatusFilter = (value: string | null): InquiryStatusFilter =>
  value === 'read' || value === 'unread' ? value : 'all';

const useDebouncedValue = (value: string, delayMs = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
};

const buildListSearchParams = (search: string, status: InquiryStatusFilter) => {
  const params = new URLSearchParams();
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }

  if (status !== 'all') {
    params.set('status', status);
  }

  return params;
};

const getReadablePageLabel = (sourcePage?: string | null) => {
  if (!sourcePage) {
    return 'Not available';
  }

  try {
    const url = new URL(sourcePage);
    const pathname = url.pathname.trim();

    if (!pathname || pathname === '/') {
      return 'Homepage';
    }

    const segments = pathname
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => formatLabel(segment));

    return segments.join(' / ') || pathname;
  } catch {
    return sourcePage;
  }
};

const getSourceContext = (inquiry: CollegeFeeInquiry) => {
  const sourceParts = String(inquiry.source ?? '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  const slugMatch = String(inquiry.source ?? '').match(/slug\s*:\s*([^|]+)/i);

  return {
    inquiryType: sourceParts[0] || 'College Fee Inquiry',
    formLocation: sourceParts[1] ? formatLabel(sourceParts[1]) : 'Not available',
    collegeSlug: slugMatch?.[1]?.trim() || 'Not available',
    submittedFrom: getReadablePageLabel(inquiry.sourcePage),
  };
};

const formatDateOnly = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date);
};

const formatTimeOnly = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
  }).format(date);
};

const stopEventPropagation = (event: MouseEvent<HTMLElement>) => {
  event.stopPropagation();
};

const syncInquiryCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  inquiry: CollegeFeeInquiry,
) => {
  queryClient.setQueryData(['college-fee-inquiry', inquiry.id], inquiry);
  queryClient.setQueriesData<CollegeFeeInquiry[]>({ queryKey: COLLEGE_FEE_INQUIRY_LIST_QUERY_KEY }, (items) =>
    Array.isArray(items)
      ? items
          .map((item) => (item.id === inquiry.id ? inquiry : item))
          .sort((firstItem, secondItem) => {
            const firstIsUnread = firstItem.readAt === null;
            const secondIsUnread = secondItem.readAt === null;

            if (firstIsUnread !== secondIsUnread) {
              return firstIsUnread ? -1 : 1;
            }

            return new Date(secondItem.createdAt).getTime() - new Date(firstItem.createdAt).getTime();
          })
      : items,
  );
};

const removeInquiryFromListCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  inquiryId: string,
) => {
  queryClient.setQueriesData<CollegeFeeInquiry[]>({ queryKey: COLLEGE_FEE_INQUIRY_LIST_QUERY_KEY }, (items) =>
    Array.isArray(items) ? items.filter((item) => item.id !== inquiryId) : items,
  );
  queryClient.removeQueries({ queryKey: ['college-fee-inquiry', inquiryId] });
};

function StatusBadge({ readAt }: { readAt: string | null }) {
  if (!readAt) {
    return (
      <Badge variant="warning" className="gap-1.5">
        <Circle className="h-2.5 w-2.5 fill-current" />
        Unread
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Read
    </Badge>
  );
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function ErrorStateCard({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

export function CollegeFeeInquiriesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [status, setStatus] = useState<InquiryStatusFilter>(getSanitizedStatusFilter(searchParams.get('status')));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CollegeFeeInquiry | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);
  const normalizedSearch = debouncedSearch.trim();
  const currentListSearchParams = useMemo(
    () => buildListSearchParams(search, status).toString(),
    [search, status],
  );

  useEffect(() => {
    const nextSearchParams = buildListSearchParams(debouncedSearch, status);
    const nextSearchString = nextSearchParams.toString();

    if (nextSearchString !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [debouncedSearch, searchParams, setSearchParams, status]);

  const inquiriesQuery = useQuery({
    queryKey: [...COLLEGE_FEE_INQUIRY_LIST_QUERY_KEY, { search: normalizedSearch, status }],
    queryFn: async () => {
      const response = await apiClient.get(collegeFeeInquiryConfig.endpoint, {
        params: {
          ...(normalizedSearch ? { search: normalizedSearch } : {}),
          ...(status !== 'all' ? { status } : {}),
        },
      });

      return extractApiData<CollegeFeeInquiry[]>(response);
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const response = await apiClient.post(collegeFeeInquiryConfig.endpoint, values);
      return extractApiData<CollegeFeeInquiry>(response);
    },
    onSuccess: (createdInquiry) => {
      toast.success('College fee inquiry created successfully.');
      setDialogOpen(false);
      syncInquiryCaches(queryClient, createdInquiry);
      void queryClient.invalidateQueries({ queryKey: COLLEGE_FEE_INQUIRY_LIST_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`${collegeFeeInquiryConfig.endpoint}/${id}`);
      return extractApiData(response);
    },
    onSuccess: (_data, id) => {
      toast.success('College fee inquiry deleted successfully.');
      removeInquiryFromListCaches(queryClient, id);
      void queryClient.invalidateQueries({ queryKey: COLLEGE_FEE_INQUIRY_LIST_QUERY_KEY });
      setDeletingItem(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const openDetails = (inquiryId: string) => {
    navigate({
      pathname: `/college-fee-inquiries/${inquiryId}`,
      search: currentListSearchParams ? `?${currentListSearchParams}` : '',
    });
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>, inquiryId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openDetails(inquiryId);
  };

  const isFiltering = normalizedSearch.length > 0 || status !== 'all';
  const items = inquiriesQuery.data ?? [];

  const emptyState = normalizedSearch
    ? {
        title: 'No inquiries match your search.',
        description: 'Try a different name, phone, email, destination, college, or source keyword.',
      }
    : status !== 'all'
      ? {
          title: 'No college fee inquiries found.',
          description: 'There are no inquiries in this status right now.',
        }
      : {
          title: 'No college fee inquiries found.',
          description: 'Submitted fee requests from college cards will appear here.',
        };

  return (
    <div className="space-y-6">
      <Card className="page-frame border-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{collegeFeeInquiryConfig.title}</CardTitle>
            <CardDescription>{collegeFeeInquiryConfig.description}</CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:justify-end 2xl:flex-nowrap">
            <div className="relative w-full xl:min-w-[320px] xl:max-w-[420px] xl:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
                placeholder="Search by inquiry ID, name, phone, email, college, or source..."
                aria-label="Search college fee inquiries"
              />
            </div>

            <div
              className="flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1 shadow-sm sm:w-auto"
              aria-label="Filter inquiries by status"
            >
              {statusFilters.map((filterOption) => (
                <Button
                  key={filterOption.value}
                  type="button"
                  variant={status === filterOption.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'min-w-[72px] rounded-lg px-4 shadow-none',
                    status === filterOption.value
                      ? 'border-primary'
                      : 'border-transparent bg-transparent hover:bg-white',
                  )}
                  aria-pressed={status === filterOption.value}
                  onClick={() => setStatus(filterOption.value)}
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>

            <Button type="button" className="w-full xl:w-auto" onClick={() => setDialogOpen(true)}>
              {collegeFeeInquiryConfig.createButtonLabel}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {inquiriesQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-[220px] items-center justify-center">
            <Spinner />
          </CardContent>
        </Card>
      ) : inquiriesQuery.isError ? (
        <ErrorStateCard
          title="Could not load college fee inquiries."
          description="The inbox could not be loaded right now. Please try again."
          onRetry={() => {
            void inquiriesQuery.refetch();
          }}
        />
      ) : items.length === 0 ? (
        <EmptyState title={emptyState.title} description={emptyState.description} />
      ) : (
        <>
          <Card className="xl:hidden">
            <CardContent className="space-y-4 p-4 sm:p-6">
              {items.map((item) => (
                <article
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    item.readAt ? 'hover:bg-muted/30' : 'bg-amber-50/40 hover:bg-amber-50/60',
                  )}
                  onClick={() => openDetails(item.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, item.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <StatusBadge readAt={item.readAt} />
                      <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Inquiry ID</p>
                        <div className="mt-1">
                          <Badge variant="success">{item.trackingId}</Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
                        <p className={cn('mt-1 text-sm text-foreground', item.readAt ? '' : 'font-semibold')}>
                          {item.fullName}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Phone</p>
                        <p className={cn('mt-1 text-sm text-foreground', item.readAt ? '' : 'font-medium')}>
                          {item.phoneNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-center whitespace-nowrap"
                        onClick={(event) => {
                          stopEventPropagation(event);
                          openDetails(item.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full justify-center"
                        aria-label={`Delete inquiry from ${item.fullName}`}
                        onClick={(event) => {
                          stopEventPropagation(event);
                          setDeletingItem(item);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>

          <Card className="hidden xl:block">
            <CardContent className="overflow-hidden p-0">
              <table className="w-full table-fixed divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Inquiry
                    </th>
                    <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Phone
                    </th>
                    <th className="w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Submitted
                    </th>
                    <th className="w-[280px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'cursor-pointer align-top transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        item.readAt ? 'hover:bg-muted/30' : 'bg-amber-50/35 hover:bg-amber-50/55',
                      )}
                      onClick={() => openDetails(item.id)}
                      onKeyDown={(event) => handleRowKeyDown(event, item.id)}
                    >
                      <td className="px-4 py-4 align-middle">
                        <StatusBadge readAt={item.readAt} />
                      </td>
                      <td className={cn('max-w-0 px-4 py-4 text-sm text-foreground [overflow-wrap:anywhere]', item.readAt ? '' : 'font-semibold')}>
                        <div className="space-y-2">
                          <Badge variant="success">{item.trackingId}</Badge>
                          <p className="text-sm text-foreground">{item.fullName}</p>
                        </div>
                      </td>
                      <td className={cn('px-4 py-4 text-sm text-foreground', item.readAt ? '' : 'font-medium')}>
                        {item.phoneNumber}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">{formatDateTime(item.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="justify-center whitespace-nowrap"
                            onClick={(event) => {
                              stopEventPropagation(event);
                              openDetails(item.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="justify-center whitespace-nowrap"
                            aria-label={`Delete inquiry from ${item.fullName}`}
                            onClick={(event) => {
                              stopEventPropagation(event);
                              setDeletingItem(item);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-xs text-muted-foreground">
        {isFiltering ? 'Showing filtered inquiry results.' : 'Showing all inquiries.'} Last refreshed{' '}
        {formatDateTime(new Date().toISOString())}
      </div>

      <ResourceFormDialog
        config={collegeFeeInquiryConfig}
        mode="create"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
      />

      <DeleteConfirmDialog
        open={Boolean(deletingItem)}
        title="Delete College Fee Inquiry"
        description="This will permanently delete the selected college fee inquiry. This action cannot be undone."
        isLoading={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingItem(null);
          }
        }}
        onConfirm={() => {
          if (!deletingItem) {
            return;
          }

          deleteMutation.mutate(deletingItem.id);
        }}
      />
    </div>
  );
}

export function CollegeFeeInquiryDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { inquiryId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const autoReadAttemptedRef = useRef(false);
  const backHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/college-fee-inquiries?${query}` : '/college-fee-inquiries';
  }, [searchParams]);

  useEffect(() => {
    autoReadAttemptedRef.current = false;
  }, [inquiryId]);

  const inquiryQuery = useQuery({
    queryKey: ['college-fee-inquiry', inquiryId],
    enabled: Boolean(inquiryId),
    queryFn: async () => {
      const response = await apiClient.get(`${collegeFeeInquiryConfig.endpoint}/${inquiryId}`);
      return extractApiData<CollegeFeeInquiry>(response);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch(`${collegeFeeInquiryConfig.endpoint}/${inquiryId}/read`);
      return extractApiData<CollegeFeeInquiry>(response);
    },
    onSuccess: (updatedInquiry) => {
      syncInquiryCaches(queryClient, updatedInquiry);
      void queryClient.invalidateQueries({ queryKey: COLLEGE_FEE_INQUIRY_LIST_QUERY_KEY });
    },
    onError: () => {
      autoReadAttemptedRef.current = false;
      toast.error('The inquiry opened, but its read status could not be updated.');
    },
  });

  const markUnreadMutation = useMutation({
    mutationFn: async () => {
      const targetEndpoint = inquiryQuery.data?.readAt
        ? `${collegeFeeInquiryConfig.endpoint}/${inquiryId}/unread`
        : `${collegeFeeInquiryConfig.endpoint}/${inquiryId}/read`;
      const response = await apiClient.patch(targetEndpoint);
      return extractApiData<CollegeFeeInquiry>(response);
    },
    onSuccess: (updatedInquiry) => {
      syncInquiryCaches(queryClient, updatedInquiry);
      void queryClient.invalidateQueries({ queryKey: COLLEGE_FEE_INQUIRY_LIST_QUERY_KEY });
      toast.success(updatedInquiry.readAt ? 'Inquiry marked as read.' : 'Inquiry marked as unread.');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`${collegeFeeInquiryConfig.endpoint}/${inquiryId}`);
      return extractApiData(response);
    },
    onSuccess: () => {
      toast.success('College fee inquiry deleted successfully.');
      removeInquiryFromListCaches(queryClient, inquiryId);
      void queryClient.invalidateQueries({ queryKey: COLLEGE_FEE_INQUIRY_LIST_QUERY_KEY });
      navigate(backHref, { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!inquiryQuery.isSuccess || !inquiryQuery.data || inquiryQuery.data.readAt || autoReadAttemptedRef.current) {
      return;
    }

    autoReadAttemptedRef.current = true;
    markReadMutation.mutate();
  }, [inquiryQuery.data, inquiryQuery.isSuccess, markReadMutation]);

  if (!inquiryId) {
    return null;
  }

  if (inquiryQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[320px] items-center justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (inquiryQuery.isError || !inquiryQuery.data) {
    return (
      <div className="space-y-6">
        <Link to={backHref} className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
          <ArrowLeft className="h-4 w-4" />
          College Fee Inquiries
        </Link>

        <ErrorStateCard
          title="Could not load this inquiry."
          description="The inquiry details are unavailable right now. Please try again."
          onRetry={() => {
            void inquiryQuery.refetch();
          }}
        />
      </div>
    );
  }

  const inquiry = inquiryQuery.data;
  const sourceContext = getSourceContext(inquiry);

  return (
    <div className="space-y-6">
      <Card className="page-frame border-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link to={backHref} className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
              <ArrowLeft className="h-4 w-4" />
              College Fee Inquiries
            </Link>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-2xl">{inquiry.fullName}</CardTitle>
                <Badge variant="success">{inquiry.trackingId}</Badge>
                <StatusBadge readAt={inquiry.readAt} />
                {markReadMutation.isPending ? (
                  <Badge variant="info" className="gap-1.5">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    Updating status
                  </Badge>
                ) : null}
              </div>
              <CardDescription>
                Submitted {formatDateTime(inquiry.createdAt)} from {sourceContext.submittedFrom}.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={markUnreadMutation.isPending}
              onClick={() => {
                markUnreadMutation.mutate();
              }}
            >
              {inquiry.readAt ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {inquiry.readAt ? 'Mark as Unread' : 'Mark as Read'}
            </Button>
            <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete Inquiry
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Inquiry Details</CardTitle>
            <CardDescription>Complete student and contact information for this submission.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label="Inquiry ID" value={inquiry.trackingId} />
              <DetailField label="Full Name" value={inquiry.fullName} />
              <DetailField label="Phone Number" value={inquiry.phoneNumber} />
              <DetailField
                label="Email Address"
                value={
                  inquiry.emailAddress ? (
                    <a
                      href={`mailto:${inquiry.emailAddress}`}
                      className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
                    >
                      {inquiry.emailAddress}
                    </a>
                  ) : (
                    'Not provided'
                  )
                }
              />
              <DetailField label="Study Destination" value={inquiry.preferredStudyDestination ?? inquiry.country ?? 'Not provided'} />
              <DetailField label="Selected College" value={inquiry.interestedCollegeName} />
              <DetailField label="Inquiry Source" value={sourceContext.inquiryType} />
              <DetailField label="Submitted Date" value={formatDateOnly(inquiry.createdAt)} />
              <DetailField label="Submitted Time" value={formatTimeOnly(inquiry.createdAt)} />
              <DetailField label="Read Status" value={inquiry.readAt ? 'Read' : 'Unread'} />
              <DetailField label="Read Date" value={inquiry.readAt ? formatDateOnly(inquiry.readAt) : 'Not read yet'} />
              <DetailField label="Read Time" value={inquiry.readAt ? formatTimeOnly(inquiry.readAt) : 'Not read yet'} />
              <DetailField label="Country" value={inquiry.country ?? 'Not provided'} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Metadata</CardTitle>
            <CardDescription>Readable source and page information captured with the inquiry.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <DetailField label="Inquiry Type" value={sourceContext.inquiryType} />
              <DetailField label="Form Location" value={sourceContext.formLocation} />
              <DetailField label="College Slug" value={sourceContext.collegeSlug} />
              <DetailField label="Submitted From" value={sourceContext.submittedFrom} />
              <DetailField
                label="Page URL"
                value={
                  inquiry.sourcePage ? (
                    <a
                      href={inquiry.sourcePage}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
                    >
                      <span className="min-w-0 [overflow-wrap:anywhere]">{inquiry.sourcePage}</span>
                      <ExternalLink className="h-4 w-4 shrink-0" />
                    </a>
                  ) : (
                    'Not available'
                  )
                }
              />
              <DetailField label="Raw Source String" value={inquiry.source || 'Not available'} />
              <DetailField label="College Record ID" value={inquiry.medicalCollegeId ?? 'Not available'} />
              <DetailField label="Last Updated" value={formatDateTime(inquiry.updatedAt)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message / Notes</CardTitle>
          <CardDescription>Any extra details submitted by the student are shown here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
            {inquiry.message?.trim() ? inquiry.message : 'No additional message was provided with this inquiry.'}
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Delete College Fee Inquiry"
        description="This will permanently delete this college fee inquiry. This action cannot be undone."
        isLoading={deleteMutation.isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          deleteMutation.mutate();
        }}
      />
    </div>
  );
}
