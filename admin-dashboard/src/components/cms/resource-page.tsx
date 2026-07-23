import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, PencilLine, Plus, Search, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Pagination } from '../dashboard/pagination';
import {
  apiClient,
  extractApiData,
  extractApiPagination,
  getApiErrorMessage,
} from '../../lib/api-client';
import { buildLocalPaginationMeta, clampPage, dashboardPageSize } from '../../lib/pagination';
import { formatDateTime, parseJsonTextareaValue, parseKeywordsValue } from '../../lib/utils';
import { normalizeContentValue } from '../../lib/rich-content';
import type { ResourceConfig } from '../../types/app';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import { Switch } from '../ui/switch';
import { buttonVariants } from '../ui/button-variants';
import { cn } from '../../lib/utils';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { ResourceFormDialog } from './resource-form-dialog';

type ResourceItem = { id: string; [key: string]: unknown };

type ResourcePageProps = {
  config: ResourceConfig<ResourceItem>;
};

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

const normalizePayload = (
  config: ResourceConfig<ResourceItem>,
  values: Record<string, unknown>,
  mode: 'create' | 'edit',
) => {
  const payload: Record<string, unknown> = {};

  for (const field of config.fields) {
    const rawValue = values[field.name];

    if (mode === 'edit' && field.omitIfEmptyOnUpdate && (rawValue === '' || rawValue === undefined)) {
      continue;
    }

    switch (field.type) {
      case 'json':
        payload[field.name] =
          typeof rawValue === 'string' && rawValue.trim() ? parseJsonTextareaValue(rawValue) : null;
        break;
      case 'rich-content':
        payload[field.name] = normalizeContentValue(
          rawValue,
          field.richContentStorageMode ?? 'json-object',
        );
        break;
      case 'keywords':
        payload[field.name] = typeof rawValue === 'string' ? parseKeywordsValue(rawValue) : [];
        break;
      case 'number':
        payload[field.name] =
          rawValue === '' || rawValue === null || rawValue === undefined || Number.isNaN(rawValue)
            ? null
            : Number(rawValue);
        break;
      case 'switch':
        payload[field.name] = Boolean(rawValue);
        break;
      case 'datetime-local':
        payload[field.name] = rawValue ? new Date(String(rawValue)).toISOString() : null;
        break;
      default:
        payload[field.name] = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
    }
  }

  return config.buildPayload ? config.buildPayload(payload, mode) : payload;
};

const extractItems = (
  config: ResourceConfig<ResourceItem>,
  payload: unknown,
) => {
  if (config.getListItems) {
    return config.getListItems(payload);
  }

  return Array.isArray(payload) ? payload : [];
};

export function ResourcePage({ config }: ResourcePageProps) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPageFromUrl = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const currentPage = Number.isFinite(currentPageFromUrl) && currentPageFromUrl > 0 ? currentPageFromUrl : 1;
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ResourceItem | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const normalizedSearch = debouncedSearch.trim();

  useEffect(() => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (normalizedSearch) {
      nextSearchParams.set('search', normalizedSearch);
    } else {
      nextSearchParams.delete('search');
    }

    const normalizedPage = normalizedSearch !== (searchParams.get('search') ?? '').trim()
      ? 1
      : currentPage;
    nextSearchParams.set('page', String(normalizedPage));

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [currentPage, normalizedSearch, searchParams, setSearchParams]);

  const resourceQuery = useQuery({
    queryKey: ['resource', config.key, { page: currentPage, search: normalizedSearch }],
    queryFn: async () => {
      if (config.loadItems) {
        return {
          items: await config.loadItems(),
          pagination: null,
        };
      }

      const response = await apiClient.get(config.listEndpoint ?? config.endpoint, {
        params: {
          ...(normalizedSearch ? { search: normalizedSearch } : {}),
          page: currentPage,
          limit: dashboardPageSize,
        },
      });

      return {
        items: extractItems(config, extractApiData<unknown>(response)),
        pagination: extractApiPagination(response) ?? null,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const payload = normalizePayload(config, values, 'create');
      const response = await apiClient.post(config.endpoint, payload);
      return extractApiData(response);
    },
    onSuccess: () => {
      toast.success(`${config.singular} created successfully.`);
      void queryClient.invalidateQueries({ queryKey: ['resource', config.key] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Record<string, unknown>;
    }) => {
      const payload = normalizePayload(config, values, 'edit');
      const method = config.updateMethod ?? 'put';
      const response = await apiClient[method](`${config.endpoint}/${id}`, payload);
      return extractApiData(response);
    },
    onSuccess: () => {
      toast.success(`${config.singular} updated successfully.`);
      void queryClient.invalidateQueries({ queryKey: ['resource', config.key] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`${config.endpoint}/${id}`);
      return extractApiData(response);
    },
    onSuccess: () => {
      toast.success(`${config.singular} deleted successfully.`);
      if (currentPage > 1 && pagedItems.length === 1) {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set('page', String(currentPage - 1));
        setSearchParams(nextSearchParams, { replace: true });
      }
      void queryClient.invalidateQueries({ queryKey: ['resource', config.key] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const statusToggleMutation = useMutation({
    mutationFn: async ({
      updatePath,
      payload,
    }: {
      id: string;
      updatePath: string;
      payload: Record<string, unknown>;
    }) => {
      const method = config.updateMethod ?? 'put';
      const response = await apiClient[method](updatePath, payload);
      return extractApiData(response);
    },
    onSuccess: () => {
      toast.success('Status updated successfully.');
      void queryClient.invalidateQueries({ queryKey: ['resource', config.key] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const items = useMemo(() => resourceQuery.data?.items ?? [], [resourceQuery.data?.items]);
  const serverPagination = resourceQuery.data?.pagination ?? null;

  const filteredItems = useMemo(() => {
    if (serverPagination) {
      return items;
    }

    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => config.getSearchText(item).toLowerCase().includes(query));
  }, [config, items, search, serverPagination]);
  const localPagination = useMemo(
    () =>
      buildLocalPaginationMeta({
        page: currentPage,
        limit: dashboardPageSize,
        totalItems: filteredItems.length,
      }),
    [currentPage, filteredItems.length],
  );
  const effectivePagination = serverPagination ?? localPagination;
  const pagedItems = serverPagination
    ? filteredItems
    : filteredItems.slice(
        (effectivePagination.page - 1) * effectivePagination.limit,
        (effectivePagination.page - 1) * effectivePagination.limit + effectivePagination.limit,
      );
  const hasSearchFilter = normalizedSearch.length > 0;

  useEffect(() => {
    const clampedPage = clampPage(currentPage, effectivePagination.totalPages);

    if (clampedPage !== currentPage) {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set('page', String(clampedPage));
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [currentPage, effectivePagination.totalPages, searchParams, setSearchParams]);

  const editValues = editingItem && config.getEditValues ? config.getEditValues(editingItem) : editingItem ?? undefined;

  const openCreateDialog = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: ResourceItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const renderPreviewAction = (item: ResourceItem, compact = false) => {
    if (!config.previewUrlBuilder) {
      return null;
    }

    const previewUrl = config.previewUrlBuilder(item);

    if (!previewUrl) {
      return null;
    }

    return (
      <a
        href={previewUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          compact ? 'flex-1 justify-center sm:flex-none' : '',
        )}
      >
        <Eye className="h-4 w-4" />
        Preview
      </a>
    );
  };

  const renderStatusToggle = (item: ResourceItem, compact = false) => {
    if (!config.statusToggle) {
      return null;
    }

    const updatePath = config.getItemUpdatePath?.(item) ?? `${config.endpoint}/${item.id}`;

    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2',
          compact ? 'w-full justify-between' : '',
        )}
      >
        <Switch
          checked={String(item[config.statusToggle.fieldName] ?? '') === config.statusToggle.activeValue}
          disabled={statusToggleMutation.isPending}
          onCheckedChange={(checked) => {
            statusToggleMutation.mutate({
              id: item.id,
              updatePath,
              payload: {
                [config.statusToggle?.fieldName ?? 'status']: checked
                  ? config.statusToggle?.activeValue
                  : config.statusToggle?.inactiveValue,
              },
            });
          }}
        />
        <span className="text-xs font-medium text-muted-foreground">Status</span>
      </div>
    );
  };

  const renderActions = (item: ResourceItem, compact = false) => (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        compact ? '[&>*]:min-h-10' : 'justify-end',
      )}
    >
      {config.getItemEditHref?.(item) ? (
        <Link
          to={config.getItemEditHref(item) ?? '#'}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            compact ? 'flex-1 justify-center sm:flex-none' : '',
          )}
        >
          <PencilLine className="h-4 w-4" />
          Edit
        </Link>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={compact ? 'flex-1 justify-center sm:flex-none' : ''}
          onClick={() => openEditDialog(item)}
        >
          <PencilLine className="h-4 w-4" />
          Edit
        </Button>
      )}
      {renderPreviewAction(item, compact)}
      {renderStatusToggle(item, compact)}
      {config.allowDelete !== false && (config.canDeleteItem ? config.canDeleteItem(item) : true) ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className={compact ? 'flex-1 justify-center sm:flex-none' : ''}
          disabled={deleteMutation.isPending}
          onClick={() => {
            setDeletingItem(item);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="page-frame border-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
                placeholder={`Search ${config.title.toLowerCase()}...`}
              />
            </div>
            {config.allowCreate !== false ? (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={openCreateDialog}
              >
                <Plus className="h-4 w-4" />
                {config.createButtonLabel}
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {resourceQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-[220px] items-center justify-center">
            <Spinner />
          </CardContent>
        </Card>
      ) : resourceQuery.isError ? (
        <EmptyState title={`Could not load ${config.title.toLowerCase()}`} description={getApiErrorMessage(resourceQuery.error)} />
      ) : items.length > 0 && (serverPagination ? effectivePagination.totalItems === 0 : filteredItems.length === 0) ? (
        <EmptyState
          title={`No matching ${config.title.toLowerCase()}`}
          description={
            hasSearchFilter
              ? `No ${config.title.toLowerCase()} matched "${normalizedSearch}". Try a different keyword.`
              : `No ${config.title.toLowerCase()} matched the current filters.`
          }
        />
      ) : pagedItems.length === 0 ? (
        <EmptyState title={config.emptyTitle} description={config.emptyDescription} />
      ) : (
        <>
          <Card className="xl:hidden">
            <CardContent className="space-y-4 p-4 sm:p-6">
              {pagedItems.map((item) => (
                <article key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="space-y-3">
                    {config.columns.map((column) => (
                      <div key={column.key} className="border-b border-border/70 pb-3 last:border-b-0 last:pb-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {column.label}
                        </p>
                        <div className="mt-1 text-sm text-foreground [overflow-wrap:anywhere]">
                          {column.render(item)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-border/70 pt-4">
                    {renderActions(item, true)}
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
                    {config.columns.map((column) => (
                      <th
                        key={column.key}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="w-[260px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground 2xl:w-[320px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {pagedItems.map((item) => (
                    <tr key={item.id} className="align-top">
                      {config.columns.map((column) => (
                        <td key={column.key} className="max-w-0 px-4 py-4 text-sm text-foreground [overflow-wrap:anywhere]">
                          {column.render(item)}
                        </td>
                      ))}
                      <td className="px-4 py-4 align-top">
                        {renderActions(item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <Pagination
        pagination={effectivePagination}
        onPageChange={(page) => {
          const nextSearchParams = new URLSearchParams(searchParams);
          nextSearchParams.set('page', String(page));
          setSearchParams(nextSearchParams);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-xs text-muted-foreground">
        Last refreshed {formatDateTime(new Date().toISOString())}
      </div>

      <ResourceFormDialog
        config={config}
        mode={editingItem ? 'edit' : 'create'}
        open={dialogOpen}
        initialValues={editValues}
        onOpenChange={(open) => {
          setDialogOpen(open);

          if (!open) {
            setEditingItem(null);
          }
        }}
        onSubmit={async (values) => {
          if (editingItem) {
            await updateMutation.mutateAsync({ id: editingItem.id, values });
            return;
          }

          await createMutation.mutateAsync(values);
        }}
      />

      <DeleteConfirmDialog
        open={Boolean(deletingItem)}
        title={`Delete ${config.singular}`}
        description={`This will permanently delete the selected ${config.singular.toLowerCase()}. This action cannot be undone.`}
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

          deleteMutation.mutate(deletingItem.id, {
            onSuccess: () => {
              setDeletingItem(null);
            },
          });
        }}
      />
    </div>
  );
}
