import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  LoaderCircle,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../components/cms/delete-confirm-dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/button-variants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import { apiClient, extractApiData, getApiErrorMessage } from '../lib/api-client';
import { cn, formatDateTime, formatLabel } from '../lib/utils';

type ConsultationStatusFilter = 'all' | 'read' | 'unread';

type ConsultationLead = {
  id: string;
  trackingNumber: number;
  trackingId: string;
  fullName: string;
  userRole: string;
  whatsappNumber: string;
  phoneNumber: string;
  emailAddress: string | null;
  passingYear: string;
  neetScore: string | null;
  stateName: string;
  preferredCollege: string | null;
  message: string | null;
  sourcePage: string | null;
  submissionDate: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DetailFieldProps = {
  label: string;
  value: ReactNode;
};

const CONSULTATION_LEADS_QUERY_KEY = ['consultation-leads'] as const;
const consultationLeadsEndpoint = '/consultation-leads';
const statusFilters: Array<{ value: ConsultationStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const getSanitizedStatusFilter = (value: string | null): ConsultationStatusFilter =>
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

const buildListSearchParams = (search: string, status: ConsultationStatusFilter) => {
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

const formatDateOnly = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
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

  return `${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dhaka',
  }).format(date)} Asia/Dhaka`;
};

const stopEventPropagation = (event: MouseEvent<HTMLElement>) => {
  event.stopPropagation();
};

const syncLeadCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  lead: ConsultationLead,
) => {
  queryClient.setQueryData(['consultation-lead', lead.id], lead);
  queryClient.setQueriesData<ConsultationLead[]>({ queryKey: CONSULTATION_LEADS_QUERY_KEY }, (items) =>
    Array.isArray(items)
      ? items
          .map((item) => (item.id === lead.id ? lead : item))
          .sort((firstLead, secondLead) => {
            const firstIsUnread = firstLead.readAt === null;
            const secondIsUnread = secondLead.readAt === null;

            if (firstIsUnread !== secondIsUnread) {
              return firstIsUnread ? -1 : 1;
            }

            return new Date(secondLead.createdAt).getTime() - new Date(firstLead.createdAt).getTime();
          })
      : items,
  );
};

const removeLeadFromCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  leadId: string,
) => {
  queryClient.setQueriesData<ConsultationLead[]>({ queryKey: CONSULTATION_LEADS_QUERY_KEY }, (items) =>
    Array.isArray(items) ? items.filter((item) => item.id !== leadId) : items,
  );
  queryClient.removeQueries({ queryKey: ['consultation-lead', leadId] });
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

export function ConsultationLeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [status, setStatus] = useState<ConsultationStatusFilter>(getSanitizedStatusFilter(searchParams.get('status')));
  const [deletingLead, setDeletingLead] = useState<ConsultationLead | null>(null);
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

  const leadsQuery = useQuery({
    queryKey: [...CONSULTATION_LEADS_QUERY_KEY, { search: normalizedSearch, status }],
    queryFn: async () => {
      const response = await apiClient.get(consultationLeadsEndpoint, {
        params: {
          ...(normalizedSearch ? { search: normalizedSearch } : {}),
          ...(status !== 'all' ? { status } : {}),
        },
      });

      return extractApiData<ConsultationLead[]>(response);
    },
    placeholderData: (previousData) => previousData,
  });

  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await apiClient.delete(`${consultationLeadsEndpoint}/${leadId}`);
      return extractApiData(response);
    },
    onSuccess: (_data, leadId) => {
      toast.success('Consultation lead deleted successfully.');
      removeLeadFromCaches(queryClient, leadId);
      void queryClient.invalidateQueries({ queryKey: CONSULTATION_LEADS_QUERY_KEY });
      setDeletingLead(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const openDetails = (leadId: string) => {
    navigate({
      pathname: `/consultation-leads/${leadId}`,
      search: currentListSearchParams ? `?${currentListSearchParams}` : '',
    });
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>, leadId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openDetails(leadId);
  };

  const isFiltering = normalizedSearch.length > 0 || status !== 'all';
  const items = leadsQuery.data ?? [];

  const emptyState = normalizedSearch
    ? {
        title: 'No consultation leads match your search.',
        description: 'Try a different tracking ID, name, phone, role, or page URL keyword.',
      }
    : status !== 'all'
      ? {
          title: 'No consultation leads found.',
          description: 'There are no consultation leads in this status right now.',
        }
      : {
          title: 'No consultation leads found.',
          description: 'New Book Free Consultation submissions will appear here automatically.',
        };

  return (
    <div className="space-y-6">
      <Card className="page-frame border-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Consultation Leads</CardTitle>
            <CardDescription>
              Track Book Free Consultation submissions with their saved MBD IDs, read status, and full form details.
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:justify-end 2xl:flex-nowrap">
            <div className="relative w-full xl:min-w-[320px] xl:max-w-[420px] xl:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
                placeholder="Search by lead ID, name, phone, role, state, or page..."
                aria-label="Search consultation leads"
              />
            </div>

            <div
              className="flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1 shadow-sm sm:w-auto"
              aria-label="Filter consultation leads by status"
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
          </div>
        </CardHeader>
      </Card>

      {leadsQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-[220px] items-center justify-center">
            <Spinner />
          </CardContent>
        </Card>
      ) : leadsQuery.isError ? (
        <ErrorStateCard
          title="Could not load consultation leads."
          description="The consultation lead inbox could not be loaded right now. Please try again."
          onRetry={() => {
            void leadsQuery.refetch();
          }}
        />
      ) : items.length === 0 ? (
        <EmptyState title={emptyState.title} description={emptyState.description} />
      ) : (
        <>
          <Card className="xl:hidden">
            <CardContent className="space-y-4 p-4 sm:p-6">
              {items.map((lead) => (
                <article
                  key={lead.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    lead.readAt ? 'hover:bg-muted/30' : 'bg-amber-50/40 hover:bg-amber-50/60',
                  )}
                  onClick={() => openDetails(lead.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, lead.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <StatusBadge readAt={lead.readAt} />
                      <p className="text-xs text-muted-foreground">{formatDateTime(lead.createdAt)}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Lead ID</p>
                        <div className="mt-1">
                          <Badge variant="success">{lead.trackingId}</Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
                        <p className={cn('mt-1 text-sm text-foreground', lead.readAt ? '' : 'font-semibold')}>
                          {lead.fullName}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Phone</p>
                        <p className={cn('mt-1 text-sm text-foreground', lead.readAt ? '' : 'font-medium')}>
                          {lead.phoneNumber}
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
                          openDetails(lead.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full justify-center"
                        onClick={(event) => {
                          stopEventPropagation(event);
                          setDeletingLead(lead);
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
                      Lead
                    </th>
                    <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Phone
                    </th>
                    <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Role
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
                  {items.map((lead) => (
                    <tr
                      key={lead.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'cursor-pointer align-top transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        lead.readAt ? 'hover:bg-muted/30' : 'bg-amber-50/35 hover:bg-amber-50/55',
                      )}
                      onClick={() => openDetails(lead.id)}
                      onKeyDown={(event) => handleRowKeyDown(event, lead.id)}
                    >
                      <td className="px-4 py-4 align-middle">
                        <StatusBadge readAt={lead.readAt} />
                      </td>
                      <td
                        className={cn(
                          'max-w-0 px-4 py-4 text-sm text-foreground [overflow-wrap:anywhere]',
                          lead.readAt ? '' : 'font-semibold',
                        )}
                      >
                        <div className="space-y-2">
                          <Badge variant="success">{lead.trackingId}</Badge>
                          <p className="text-sm text-foreground">{lead.fullName}</p>
                        </div>
                      </td>
                      <td className={cn('px-4 py-4 text-sm text-foreground', lead.readAt ? '' : 'font-medium')}>
                        {lead.phoneNumber}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">{lead.userRole}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{formatDateTime(lead.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="justify-center whitespace-nowrap"
                            onClick={(event) => {
                              stopEventPropagation(event);
                              openDetails(lead.id);
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
                            onClick={(event) => {
                              stopEventPropagation(event);
                              setDeletingLead(lead);
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
        {isFiltering ? 'Showing filtered consultation leads.' : 'Showing all consultation leads.'} Last refreshed{' '}
        {formatDateTime(new Date().toISOString())}
      </div>

      <DeleteConfirmDialog
        open={Boolean(deletingLead)}
        title="Delete Consultation Lead"
        description="This will permanently delete the selected consultation lead. This action cannot be undone."
        isLoading={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingLead(null);
          }
        }}
        onConfirm={() => {
          if (!deletingLead) {
            return;
          }

          deleteMutation.mutate(deletingLead.id);
        }}
      />
    </div>
  );
}

export function ConsultationLeadDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { leadId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const autoReadAttemptedRef = useRef(false);
  const backHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/consultation-leads?${query}` : '/consultation-leads';
  }, [searchParams]);

  useEffect(() => {
    autoReadAttemptedRef.current = false;
  }, [leadId]);

  const leadQuery = useQuery({
    queryKey: ['consultation-lead', leadId],
    enabled: Boolean(leadId),
    queryFn: async () => {
      const response = await apiClient.get(`${consultationLeadsEndpoint}/${leadId}`);
      return extractApiData<ConsultationLead>(response);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch(`${consultationLeadsEndpoint}/${leadId}/read`);
      return extractApiData<ConsultationLead>(response);
    },
    onSuccess: (updatedLead) => {
      syncLeadCaches(queryClient, updatedLead);
      void queryClient.invalidateQueries({ queryKey: CONSULTATION_LEADS_QUERY_KEY });
    },
    onError: () => {
      autoReadAttemptedRef.current = false;
      toast.error('The lead opened, but its read status could not be updated.');
    },
  });

  const markStatusMutation = useMutation({
    mutationFn: async () => {
      const targetEndpoint = leadQuery.data?.readAt
        ? `${consultationLeadsEndpoint}/${leadId}/unread`
        : `${consultationLeadsEndpoint}/${leadId}/read`;
      const response = await apiClient.patch(targetEndpoint);
      return extractApiData<ConsultationLead>(response);
    },
    onSuccess: (updatedLead) => {
      syncLeadCaches(queryClient, updatedLead);
      void queryClient.invalidateQueries({ queryKey: CONSULTATION_LEADS_QUERY_KEY });
      toast.success(updatedLead.readAt ? 'Consultation lead marked as read.' : 'Consultation lead marked as unread.');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`${consultationLeadsEndpoint}/${leadId}`);
      return extractApiData(response);
    },
    onSuccess: () => {
      toast.success('Consultation lead deleted successfully.');
      removeLeadFromCaches(queryClient, leadId);
      void queryClient.invalidateQueries({ queryKey: CONSULTATION_LEADS_QUERY_KEY });
      navigate(backHref, { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!leadQuery.isSuccess || !leadQuery.data || leadQuery.data.readAt || autoReadAttemptedRef.current) {
      return;
    }

    autoReadAttemptedRef.current = true;
    markReadMutation.mutate();
  }, [leadQuery.data, leadQuery.isSuccess, markReadMutation]);

  if (!leadId) {
    return null;
  }

  if (leadQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[320px] items-center justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (leadQuery.isError || !leadQuery.data) {
    return (
      <div className="space-y-6">
        <Link to={backHref} className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
          <ArrowLeft className="h-4 w-4" />
          Consultation Leads
        </Link>

        <ErrorStateCard
          title="Could not load this consultation lead."
          description="The consultation lead details are unavailable right now. Please try again."
          onRetry={() => {
            void leadQuery.refetch();
          }}
        />
      </div>
    );
  }

  const lead = leadQuery.data;

  return (
    <div className="space-y-6">
      <Card className="page-frame border-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link to={backHref} className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
              <ArrowLeft className="h-4 w-4" />
              Consultation Leads
            </Link>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-2xl">{lead.fullName}</CardTitle>
                <Badge variant="success">{lead.trackingId}</Badge>
                <StatusBadge readAt={lead.readAt} />
                {markReadMutation.isPending ? (
                  <Badge variant="info" className="gap-1.5">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    Updating status
                  </Badge>
                ) : null}
              </div>
              <CardDescription>
                Submitted {formatDateTime(lead.createdAt)} from {getReadablePageLabel(lead.sourcePage)}.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={markStatusMutation.isPending}
              onClick={() => {
                markStatusMutation.mutate();
              }}
            >
              {lead.readAt ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {lead.readAt ? 'Mark as Unread' : 'Mark as Read'}
            </Button>
            <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete Lead
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Submission Summary</CardTitle>
            <CardDescription>Primary contact, status, and tracking details for this Book Free Consultation lead.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label="Tracking ID" value={lead.trackingId} />
              <DetailField label="Form Name" value="Book Free Consultation" />
              <DetailField label="Read Status" value={lead.readAt ? 'Read' : 'Unread'} />
              <DetailField label="Read Date" value={lead.readAt ? formatDateOnly(lead.readAt) : 'Not read yet'} />
              <DetailField label="Read Time" value={lead.readAt ? formatTimeOnly(lead.readAt) : 'Not read yet'} />
              <DetailField label="Customer/Student Name" value={lead.fullName} />
              <DetailField label="Phone Number" value={lead.phoneNumber} />
              <DetailField label="WhatsApp Number" value={lead.whatsappNumber} />
              <DetailField label="Role" value={lead.userRole} />
              <DetailField label="Passing Year" value={lead.passingYear} />
              <DetailField label="NEET Score" value={lead.neetScore ?? 'Not provided'} />
              <DetailField label="State / Region" value={lead.stateName} />
              <DetailField label="Preferred College" value={lead.preferredCollege ?? 'Not provided'} />
              <DetailField
                label="Email Address"
                value={
                  lead.emailAddress ? (
                    <a
                      href={`mailto:${lead.emailAddress}`}
                      className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
                    >
                      {lead.emailAddress}
                    </a>
                  ) : (
                    'Not provided'
                  )
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Information</CardTitle>
            <CardDescription>Saved metadata generated from the server-side submission record.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <DetailField label="Submitted From" value={getReadablePageLabel(lead.sourcePage)} />
              <DetailField
                label="Source Page URL"
                value={
                  lead.sourcePage ? (
                    <a
                      href={lead.sourcePage}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
                    >
                      <span className="min-w-0 [overflow-wrap:anywhere]">{lead.sourcePage}</span>
                      <ExternalLink className="h-4 w-4 shrink-0" />
                    </a>
                  ) : (
                    'Not available'
                  )
                }
              />
              <DetailField label="Submission Date" value={formatDateOnly(lead.createdAt)} />
              <DetailField label="Submission Time" value={formatTimeOnly(lead.createdAt)} />
              <DetailField label="Form Submission Timestamp" value={formatDateTime(lead.submissionDate ?? lead.createdAt)} />
              <DetailField label="Created At" value={formatDateTime(lead.createdAt)} />
              <DetailField label="Last Updated" value={formatDateTime(lead.updatedAt)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Fill-up Details</CardTitle>
          <CardDescription>The saved field order follows the current Book Free Consultation form structure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Step 1 - Personal Information</h3>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label="Student/Customer Name" value={lead.fullName} />
              <DetailField label="Role" value={lead.userRole} />
              <DetailField label="WhatsApp Number" value={lead.whatsappNumber} />
              <DetailField label="Phone Number" value={lead.phoneNumber} />
              {lead.emailAddress ? (
                <DetailField
                  label="Email Address"
                  value={
                    <a
                      href={`mailto:${lead.emailAddress}`}
                      className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
                    >
                      {lead.emailAddress}
                    </a>
                  }
                />
              ) : null}
            </dl>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Step 2 - Academic Information</h3>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label="Passing Year" value={lead.passingYear} />
              <DetailField label="NEET Score" value={lead.neetScore ?? 'Not provided'} />
              <DetailField label="State / Region" value={lead.stateName} />
              <DetailField label="Preferred College" value={lead.preferredCollege ?? 'Not provided'} />
            </dl>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Step 3 - Additional Information</h3>
            <dl className="grid gap-5">
              <DetailField label="Message" value={lead.message?.trim() ? lead.message : 'No additional message was provided.'} />
            </dl>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Delete Consultation Lead"
        description="This will permanently delete this consultation lead. This action cannot be undone."
        isLoading={deleteMutation.isPending}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          deleteMutation.mutate();
        }}
      />
    </div>
  );
}
