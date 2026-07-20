import { useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Eye, Search, Trash2 } from 'lucide-react';
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
import { cn, formatDateTime } from '../lib/utils';

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
  createdAt: string;
  updatedAt: string;
};

type DetailFieldProps = {
  label: string;
  value: ReactNode;
};

const CONSULTATION_LEADS_QUERY_KEY = ['consultation-leads'] as const;
const consultationLeadsEndpoint = '/consultation-leads';

const stopEventPropagation = (event: MouseEvent<HTMLElement>) => {
  event.stopPropagation();
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
  const [deletingLead, setDeletingLead] = useState<ConsultationLead | null>(null);

  const leadsQuery = useQuery({
    queryKey: CONSULTATION_LEADS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get(consultationLeadsEndpoint);
      return extractApiData<ConsultationLead[]>(response);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await apiClient.delete(`${consultationLeadsEndpoint}/${leadId}`);
      return extractApiData(response);
    },
    onSuccess: (_data, leadId) => {
      toast.success('Consultation lead deleted successfully.');
      removeLeadFromCaches(queryClient, leadId);
      setDeletingLead(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const normalizedSearch = search.trim().toLowerCase();

  const filteredLeads = useMemo(() => {
    const items = leadsQuery.data ?? [];

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((lead) =>
      [
        lead.trackingId,
        lead.fullName,
        lead.phoneNumber,
        lead.whatsappNumber,
        lead.emailAddress,
        lead.userRole,
        lead.stateName,
        lead.preferredCollege,
        lead.sourcePage,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch)),
    );
  }, [leadsQuery.data, normalizedSearch]);

  const openDetails = (leadId: string) => {
    const nextSearchParams = new URLSearchParams();

    if (search.trim()) {
      nextSearchParams.set('search', search.trim());
    }

    setSearchParams(nextSearchParams, { replace: true });
    navigate({
      pathname: `/consultation-leads/${leadId}`,
      search: nextSearchParams.toString() ? `?${nextSearchParams.toString()}` : '',
    });
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>, leadId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openDetails(leadId);
  };

  if (leadsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[220px] items-center justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (leadsQuery.isError) {
    return (
      <ErrorStateCard
        title="Could not load consultation leads."
        description="The consultation lead inbox could not be loaded right now. Please try again."
        onRetry={() => {
          void leadsQuery.refetch();
        }}
      />
    );
  }

  const emptyState = normalizedSearch
    ? {
        title: 'No consultation leads match your search.',
        description: 'Try a different tracking ID, name, phone, role, or page URL keyword.',
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
              Track Book Free Consultation submissions with their saved MBD IDs and full form details.
            </CardDescription>
          </div>

          <div className="relative w-full lg:min-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              placeholder="Search consultation leads..."
              aria-label="Search consultation leads"
            />
          </div>
        </CardHeader>
      </Card>

      {filteredLeads.length === 0 ? (
        <EmptyState title={emptyState.title} description={emptyState.description} />
      ) : (
        <>
          <Card className="xl:hidden">
            <CardContent className="space-y-4 p-4 sm:p-6">
              {filteredLeads.map((lead) => (
                <article
                  key={lead.id}
                  role="button"
                  tabIndex={0}
                  className="rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openDetails(lead.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, lead.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <Badge variant="success">{lead.trackingId}</Badge>
                      <p className="text-xs text-muted-foreground">{formatDateTime(lead.createdAt)}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{lead.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Phone</p>
                        <p className="mt-1 text-sm text-foreground">{lead.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Role</p>
                        <p className="mt-1 text-sm text-foreground">{lead.userRole}</p>
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
                    <th className="w-[150px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tracking ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Name
                    </th>
                    <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Phone
                    </th>
                    <th className="w-[160px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Role
                    </th>
                    <th className="w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Submitted
                    </th>
                    <th className="w-[250px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer align-top transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      onClick={() => openDetails(lead.id)}
                      onKeyDown={(event) => handleRowKeyDown(event, lead.id)}
                    >
                      <td className="px-4 py-4 align-middle">
                        <Badge variant="success">{lead.trackingId}</Badge>
                      </td>
                      <td className="max-w-0 px-4 py-4 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                        {lead.fullName}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">{lead.phoneNumber}</td>
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
        {normalizedSearch ? 'Showing filtered consultation leads.' : 'Showing all consultation leads.'} Last refreshed{' '}
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
  const backHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/consultation-leads?${query}` : '/consultation-leads';
  }, [searchParams]);

  const leadQuery = useQuery({
    queryKey: ['consultation-lead', leadId],
    enabled: Boolean(leadId),
    queryFn: async () => {
      const response = await apiClient.get(`${consultationLeadsEndpoint}/${leadId}`);
      return extractApiData<ConsultationLead>(response);
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
      navigate(backHref, { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

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
              </div>
              <CardDescription>
                Submitted {formatDateTime(lead.createdAt)} from {lead.sourcePage ?? 'an unknown page'}.
              </CardDescription>
            </div>
          </div>

          <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete Lead
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Submission Summary</CardTitle>
            <CardDescription>Primary contact and tracking details for this Book Free Consultation lead.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label="Tracking ID" value={lead.trackingId} />
              <DetailField label="Form Name" value="Book Free Consultation" />
              <DetailField label="Customer/Student Name" value={lead.fullName} />
              <DetailField label="Phone Number" value={lead.phoneNumber} />
              <DetailField label="WhatsApp Number" value={lead.whatsappNumber} />
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

          {lead.message?.trim() ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Step 3 - Additional Information</h3>
              <dl className="grid gap-5">
                <DetailField label="Message" value={lead.message} />
              </dl>
            </div>
          ) : null}
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
