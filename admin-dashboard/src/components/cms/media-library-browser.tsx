import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Columns2,
  FileImage,
  FileText,
  Film,
  Grid3X3,
  List,
  LoaderCircle,
  RefreshCcw,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiClient, extractApiData, getApiErrorMessage } from '../../lib/api-client';
import { cn } from '../../lib/utils';
import type { UploadKind } from '../../types/app';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import type { MediaKind, MediaListItem, MediaSelection } from '../../lib/media';
import { detectMediaKind, resolveCmsAssetUrl } from '../../lib/media';

type MediaListResponse = {
  items: MediaListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type MediaLibraryBrowserProps = {
  allowedKinds?: MediaKind[];
  multiple?: boolean;
  selectedValue?: string | null;
  selectedValues?: string[];
  onSelect?: (selection: MediaSelection | MediaSelection[]) => void;
  onClose?: () => void;
  embedded?: boolean;
  allowUpload?: boolean;
  allowDelete?: boolean;
  uploadKind?: UploadKind | 'all';
  showFooter?: boolean;
};

type ViewMode = 'grid' | 'list';
type MediaFilter = 'all' | MediaKind;
type MediaSort = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'largest' | 'smallest';

const mediaPageSize = 24;
const viewModeStorageKey = 'medientry-media-library-view-mode';

const sortOptions: Array<{ label: string; value: MediaSort }> = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Name A-Z', value: 'name-asc' },
  { label: 'Name Z-A', value: 'name-desc' },
  { label: 'Largest', value: 'largest' },
  { label: 'Smallest', value: 'smallest' },
];

const uploadAcceptByKind: Record<UploadKind | 'all', string> = {
  all: 'image/*,video/mp4,video/webm,video/ogg,video/quicktime,application/pdf',
  image: 'image/*',
  document: 'application/pdf',
  video: 'video/mp4,video/webm,video/ogg,video/quicktime',
  videoThumbnail: 'image/*',
};

const filterOrder: MediaFilter[] = ['all', 'image', 'svg', 'video', 'document'];

const getInitialViewMode = (): ViewMode => {
  if (typeof window === 'undefined') {
    return 'grid';
  }

  const storedValue = window.localStorage.getItem(viewModeStorageKey);
  return storedValue === 'list' ? 'list' : 'grid';
};

const getMediaFilterOptions = (allowedKinds?: MediaKind[]) => {
  if (!allowedKinds || allowedKinds.length === 0) {
    return filterOrder;
  }

  return filterOrder.filter((option) => option === 'all' || allowedKinds.includes(option));
};

const filterMediaItemsByAllowedKinds = (items: MediaListItem[], allowedKinds?: MediaKind[]) => {
  if (!allowedKinds || allowedKinds.length === 0) {
    return items;
  }

  return items.filter((item) => allowedKinds.includes(item.kind));
};

const inferUploadKind = (file: File, preferredUploadKind?: UploadKind | 'all'): UploadKind => {
  if (preferredUploadKind && preferredUploadKind !== 'all') {
    return preferredUploadKind;
  }

  if (file.type === 'application/pdf') {
    return 'document';
  }

  if (file.type.startsWith('video/')) {
    return 'video';
  }

  return 'image';
};

const formatFileSize = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 'Unknown size';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatMediaMeta = (item: MediaListItem) => {
  if (item.kind === 'video' && item.duration) {
    return `${Math.max(item.duration, 0)}s`;
  }

  if (item.width && item.height) {
    return `${item.width} x ${item.height}`;
  }

  return item.extension ? item.extension.toUpperCase() : 'Media';
};

const getMediaBadgeLabel = (kind: MediaKind) => {
  switch (kind) {
    case 'svg':
      return 'SVG';
    case 'video':
      return 'Video';
    case 'document':
      return 'Document';
    case 'image':
      return 'Image';
    default:
      return 'Media';
  }
};

const getSelectionKey = (item: Pick<MediaListItem, 'id' | 'source'>) => `${item.source}:${item.id}`;

const toSelection = (item: MediaListItem): MediaSelection => ({
  id: item.id,
  url: item.url ?? '',
  storedValue: item.storedValue ?? null,
  title: item.title ?? null,
  filename: item.filename,
  mimeType: item.mimeType ?? null,
  kind: item.kind,
  source: item.source,
  thumbnailUrl: item.thumbnailUrl ?? null,
});

function MediaPreviewCard({
  item,
  selected,
  selectable,
  failedUrls,
  onPreviewError,
  onClick,
  showDelete,
  onDelete,
  listView,
}: {
  item: MediaListItem;
  selected: boolean;
  selectable: boolean;
  failedUrls: Set<string>;
  onPreviewError: (url: string) => void;
  onClick: () => void;
  showDelete: boolean;
  onDelete?: () => void;
  listView: boolean;
}) {
  const resolvedPreviewUrl = resolveCmsAssetUrl(item.url ?? item.publicUrl ?? item.storedValue);
  const resolvedThumbnailUrl = resolveCmsAssetUrl(item.thumbnailUrl ?? item.url ?? item.publicUrl ?? item.storedValue);
  const mediaKind = item.kind || detectMediaKind(item.mimeType, item.url ?? item.storedValue);
  const hasFailedPreview = Boolean(resolvedPreviewUrl) && failedUrls.has(resolvedPreviewUrl);
  const previewUnavailable = !resolvedPreviewUrl || hasFailedPreview;
  const canSelectItem = selectable && Boolean(item.storedValue || item.url);

  const renderVisual = () => {
    if (previewUnavailable) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/30 px-4 text-center text-xs text-muted-foreground">
          {mediaKind === 'document' ? <FileText className="h-8 w-8" /> : mediaKind === 'video' ? <Film className="h-8 w-8" /> : <FileImage className="h-8 w-8" />}
          <span>{item.filename}</span>
          <span>Preview unavailable</span>
        </div>
      );
    }

    if (mediaKind === 'video') {
      return (
        <div className="relative h-full w-full bg-black">
          <video
            src={resolvedPreviewUrl}
            poster={resolvedThumbnailUrl || undefined}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            onError={() => onPreviewError(resolvedPreviewUrl)}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <div className="rounded-full bg-white/90 p-2 text-foreground shadow-sm">
              <Film className="h-4 w-4" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <img
        src={resolvedThumbnailUrl || resolvedPreviewUrl}
        alt={item.altText || item.title || item.filename}
        loading="lazy"
        className={cn('h-full w-full', listView ? 'object-cover' : 'object-cover')}
        onError={() => onPreviewError(resolvedThumbnailUrl || resolvedPreviewUrl)}
      />
    );
  };

  return (
    <div
      role={canSelectItem ? 'button' : undefined}
      tabIndex={canSelectItem ? 0 : undefined}
      onClick={() => {
        if (canSelectItem) {
          onClick();
        }
      }}
      onKeyDown={(event) => {
        if (!canSelectItem) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      aria-selected={selected}
      className={cn(
        'group overflow-hidden rounded-2xl border bg-white text-left transition',
        listView ? 'flex w-full gap-4 p-3' : 'flex flex-col',
        canSelectItem ? 'hover:border-primary/45 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35' : 'opacity-80',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border/70',
      )}
    >
      <div className={cn('overflow-hidden rounded-xl bg-muted/20', listView ? 'h-20 w-24 shrink-0' : 'aspect-[4/3] w-full')}>
        {renderVisual()}
      </div>
      <div className={cn('min-w-0 flex-1', listView ? 'flex items-center justify-between gap-3' : 'space-y-2 px-4 py-3')}>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={selected ? 'success' : 'outline'}>{getMediaBadgeLabel(mediaKind)}</Badge>
            {selected ? <Badge variant="success"><Check className="mr-1 h-3 w-3" />Selected</Badge> : null}
            {item.source === 'gallery-legacy' ? <Badge variant="outline">Legacy</Badge> : null}
          </div>
          <div className="space-y-1">
            <p className="truncate text-sm font-semibold text-foreground">{item.title || item.filename}</p>
            <p className="truncate text-xs text-muted-foreground">{item.filename}</p>
            <p className="text-xs text-muted-foreground">{formatMediaMeta(item)} • {formatFileSize(item.size)}</p>
            {!canSelectItem ? <p className="text-xs text-destructive">The stored media URL is invalid.</p> : null}
          </div>
        </div>
        {showDelete && item.source === 'media' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-destructive hover:text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function MediaLibraryBrowser({
  allowedKinds,
  multiple = false,
  selectedValue,
  selectedValues,
  onSelect,
  onClose,
  embedded = false,
  allowUpload = true,
  allowDelete = false,
  uploadKind = 'all',
  showFooter = true,
}: MediaLibraryBrowserProps) {
  const queryClient = useQueryClient();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaFilter>(() => {
    const options = getMediaFilterOptions(allowedKinds);
    return options[0] ?? 'all';
  });
  const [sort, setSort] = useState<MediaSort>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [page, setPage] = useState(1);
  const [selectedMap, setSelectedMap] = useState<Record<string, MediaSelection>>({});
  const [failedPreviewUrls, setFailedPreviewUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(viewModeStorageKey, viewMode);
    }
  }, [viewMode]);

  const buildMediaLibraryQueryKey = (pageValue: number) =>
    ['media-library', search, typeFilter, sort, pageValue] as const;

  const mediaQuery = useQuery({
    queryKey: buildMediaLibraryQueryKey(page),
    queryFn: async () => {
      const response = await apiClient.get('/media', {
        params: {
          page,
          pageSize: mediaPageSize,
          search,
          type: typeFilter,
          sort,
        },
      });
      return extractApiData<MediaListResponse>(response);
    },
  });

  const cachedPageResponses = useMemo(() => {
    const responses: MediaListResponse[] = [];

    for (let currentPage = 1; currentPage <= page; currentPage += 1) {
      const response = queryClient.getQueryData<MediaListResponse>(
        buildMediaLibraryQueryKey(currentPage),
      );

      if (response) {
        responses.push(response);
      }
    }

    return responses;
  }, [mediaQuery.data, page, queryClient, search, sort, typeFilter]);

  const items = useMemo(() => {
    const mergedItems: MediaListItem[] = [];
    const existingIds = new Set<string>();

    for (const response of cachedPageResponses) {
      for (const item of filterMediaItemsByAllowedKinds(response.items, allowedKinds)) {
        const selectionKey = getSelectionKey(item);

        if (existingIds.has(selectionKey)) {
          continue;
        }

        existingIds.add(selectionKey);
        mergedItems.push(item);
      }
    }

    return mergedItems;
  }, [allowedKinds, cachedPageResponses]);

  const latestResponse = cachedPageResponses[cachedPageResponses.length - 1] ?? mediaQuery.data ?? null;
  const hasMore = latestResponse?.hasMore ?? false;
  const totalItems = latestResponse?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/media/${id}`);
    },
    onSuccess: () => {
      toast.success('Media item deleted successfully.');
      setPage(1);
      void queryClient.invalidateQueries({ queryKey: ['media-library'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      const nextUploadKind = inferUploadKind(file, uploadKind);
      formData.append('kind', nextUploadKind);
      formData.append('file', file);

      const response = await apiClient.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return extractApiData<{
        id: string;
        url: string;
        storedValue: string;
        filename: string;
        originalName?: string | null;
        mimeType: string | null;
        kind: MediaKind;
        title?: string | null;
      }>(response);
    },
    onSuccess: (payload) => {
      const nextSelection: MediaSelection = {
        id: payload.id,
        url: payload.url,
        storedValue: payload.storedValue,
        title: payload.title ?? payload.originalName ?? payload.filename,
        filename: payload.filename,
        mimeType: payload.mimeType,
        kind: payload.kind,
        source: 'media',
        thumbnailUrl: payload.url,
      };

      setSelectedMap(() => ({
        [`media:${payload.id}`]: nextSelection,
      }));
      setPage(1);
      void queryClient.invalidateQueries({ queryKey: ['media-library'] });
      toast.success('Upload completed.');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error) || 'Upload failed.');
    },
  });

  const filterOptions = useMemo(() => getMediaFilterOptions(allowedKinds), [allowedKinds]);
  const controlledSelectedMap = useMemo(() => {
    const selections: Record<string, MediaSelection> = {};

    for (const item of items) {
      if (selectedValue && item.storedValue === selectedValue) {
        selections[getSelectionKey(item)] = toSelection(item);
      }

      if (selectedValues?.includes(item.storedValue ?? '')) {
        selections[getSelectionKey(item)] = toSelection(item);
      }
    }

    return selections;
  }, [items, selectedValue, selectedValues]);
  const effectiveSelectedMap = useMemo(
    () => ({
      ...controlledSelectedMap,
      ...selectedMap,
    }),
    [controlledSelectedMap, selectedMap],
  );
  const selectedItems = Object.values(effectiveSelectedMap);
  const primarySelection = selectedItems[0] ?? null;
  const containerClasses = embedded
    ? 'space-y-4'
    : 'space-y-4';

  const onPreviewError = (url: string) => {
    setFailedPreviewUrls((currentValue) => new Set(currentValue).add(url));
    if (import.meta.env.DEV) {
      console.warn('[media] Preview unavailable.', { url });
    }
  };

  const toggleSelection = (item: MediaListItem) => {
    const selectionKey = getSelectionKey(item);
    const nextSelection = toSelection(item);

    setSelectedMap((currentValue) => {
      if (!multiple) {
        return {
          [selectionKey]: nextSelection,
        };
      }

      if (currentValue[selectionKey]) {
        const nextValue = { ...currentValue };
        delete nextValue[selectionKey];
        return nextValue;
      }

      return {
        ...currentValue,
        [selectionKey]: nextSelection,
      };
    });
  };

  const applySelection = () => {
    if (!onSelect) {
      return;
    }

    if (multiple) {
      onSelect(selectedItems);
      return;
    }

    if (primarySelection) {
      onSelect(primarySelection);
    }
  };

  return (
    <div className={containerClasses}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 space-y-2">
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            Search media
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={inputId}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title, filename, alt text, caption, or extension"
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Type</label>
            <select
              className="flex h-11 min-w-[120px] rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as MediaFilter);
                setPage(1);
              }}
            >
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All media' : getMediaBadgeLabel(option)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Sort</label>
            <select
              className="flex h-11 min-w-[120px] rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as MediaSort);
                setPage(1);
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">View</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" aria-label="Grid view" onClick={() => setViewMode('grid')}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button type="button" variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" aria-label="List view" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {allowUpload ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Upload</span>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={uploadAcceptByKind[uploadKind]}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      uploadMutation.mutate(file);
                    }

                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {mediaQuery.isLoading && items.length === 0 ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border/70 bg-muted/10">
          <Spinner />
        </div>
      ) : mediaQuery.isError && items.length === 0 ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-10 text-center text-sm text-destructive">
          <p>Could not load Media Library.</p>
          <p className="mt-2">{getApiErrorMessage(mediaQuery.error)}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void mediaQuery.refetch()}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
          {search || typeFilter !== 'all'
            ? 'No media files found.'
            : 'No media files have been uploaded yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={cn(
              'max-h-[60vh] overflow-y-auto pr-1',
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
                : 'space-y-3',
            )}
          >
            {items.map((item) => {
              const selectionKey = getSelectionKey(item);

              return (
                <MediaPreviewCard
                  key={selectionKey}
                  item={item}
                  selected={Boolean(effectiveSelectedMap[selectionKey])}
                  selectable={Boolean(onSelect)}
                  failedUrls={failedPreviewUrls}
                  onPreviewError={onPreviewError}
                  onClick={() => {
                    if (!onSelect) {
                      return;
                    }

                    toggleSelection(item);
                  }}
                  showDelete={allowDelete}
                  onDelete={allowDelete && item.source === 'media' ? () => deleteMutation.mutate(item.id) : undefined}
                  listView={viewMode === 'list'}
                />
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Loaded {items.length}{totalItems ? ` of ${totalItems}` : ''} media items
            </div>
            <div className="flex items-center gap-2">
              {mediaQuery.isFetching ? <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              {hasMore ? (
                <Button type="button" variant="outline" onClick={() => setPage((currentValue) => currentValue + 1)} disabled={mediaQuery.isFetching}>
                  <Columns2 className="h-4 w-4" />
                  Load More
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {showFooter ? (
        <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-10 text-sm text-muted-foreground">
            {selectedItems.length > 0 ? (
              multiple
                ? `${selectedItems.length} media files selected`
                : `Selected: ${primarySelection?.title || primarySelection?.filename}`
            ) : 'No media selected yet.'}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {onClose ? (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={applySelection}
              disabled={selectedItems.length === 0}
            >
              Select Media
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
