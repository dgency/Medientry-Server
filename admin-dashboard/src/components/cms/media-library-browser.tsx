import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Grid2x2,
  ImagePlus,
  List,
  LoaderCircle,
  PencilLine,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Pagination } from '../dashboard/pagination';
import {
  apiClient,
  extractApiData,
  extractApiPagination,
  getApiErrorMessage,
} from '../../lib/api-client';
import { resolveCmsAssetUrl } from '../../lib/media';
import { dashboardPageSize, type PaginationMeta } from '../../lib/pagination';
import { cn } from '../../lib/utils';
import type { UploadKind } from '../../types/app';
import { Button } from '../ui/button';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export type MediaLibraryAsset = {
  id: string;
  title: string | null;
  altText: string | null;
  caption: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  filename: string;
  originalName: string | null;
  url: string | null;
  publicUrl: string | null;
  fileType: 'IMAGE' | 'SVG' | 'VIDEO' | 'DOCUMENT' | 'UNKNOWN';
  status: string;
  createdAt: string;
  updatedAt: string;
};

type MediaAssetUsageReference = {
  key: string;
  label: string;
  count: number;
  examples: string[];
};

type MediaAssetUsageSummary = {
  assetId: string;
  isReferenced: boolean;
  totalReferences: number;
  references: MediaAssetUsageReference[];
};

type UploadedFile = {
  url: string;
  fullUrl: string;
  filename: string;
  asset: MediaLibraryAsset;
};

type MediaMetadataFormValues = {
  title: string;
  altText: string;
  seoTitle: string;
  seoDescription: string;
};

type BrokenPreviewMap = Record<string, true>;
type MediaViewMode = 'grid' | 'list';
type MediaStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type MediaAssetFilterType = 'ALL' | MediaLibraryAsset['fileType'];

export const defaultAcceptByKind: Record<UploadKind, string> = {
  image:
    'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg',
  document: 'application/pdf',
  videoThumbnail:
    'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg',
};

const uploadButtonLabels: Record<UploadKind, string> = {
  image: 'Upload Images',
  document: 'Upload PDFs',
  videoThumbnail: 'Upload Thumbnails',
};
const dialogVisibleAssetBatchSize = 16;

const normalizeNullableString = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const buildCanonicalAssetPath = (asset?: Pick<MediaLibraryAsset, 'id' | 'filename'> | null) => {
  if (!asset?.id || !asset.filename?.trim()) {
    return null;
  }

  return `/api/media/${encodeURIComponent(asset.id)}/${encodeURIComponent(asset.filename.trim())}`;
};

export const getAssetUrl = (asset?: MediaLibraryAsset | null) =>
  buildCanonicalAssetPath(asset)
  ?? normalizeNullableString(asset?.publicUrl)
  ?? normalizeNullableString(asset?.url);

const buildMediaMetadataFormValues = (
  item: MediaLibraryAsset | null,
): MediaMetadataFormValues => ({
  title: item?.title ?? '',
  altText: item?.altText ?? '',
  seoTitle: item?.seoTitle ?? '',
  seoDescription: item?.seoDescription ?? '',
});

const formatStatusLabel = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

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

const getSanitizedViewMode = (value: string | null): MediaViewMode =>
  value === 'list' ? 'list' : 'grid';

const getSanitizedMediaStatusFilter = (value: string | null): MediaStatusFilter =>
  value === 'ACTIVE' || value === 'INACTIVE' ? value : 'ALL';

const getSanitizedMediaFileTypeFilter = (
  value: string | null,
  availableFileTypes: MediaLibraryAsset['fileType'][],
): MediaAssetFilterType =>
  value && availableFileTypes.includes(value as MediaLibraryAsset['fileType'])
    ? (value as MediaAssetFilterType)
    : 'ALL';

const buildMediaLibrarySearchParams = ({
  search,
  status,
  fileType,
  viewMode,
  page,
}: {
  search: string;
  status: MediaStatusFilter;
  fileType: MediaAssetFilterType;
  viewMode: MediaViewMode;
  page: number;
}) => {
  const params = new URLSearchParams();
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }

  if (status !== 'ALL') {
    params.set('status', status);
  }

  if (fileType !== 'ALL') {
    params.set('fileType', fileType);
  }

  if (viewMode !== 'grid') {
    params.set('view', viewMode);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  return params;
};

type MediaPreviewProps = {
  src?: string | null;
  alt: string;
  fit?: 'cover' | 'contain';
  brokenPreviewUrls: BrokenPreviewMap;
  onPreviewError: (url: string, context?: Record<string, unknown>) => void;
  onRetry?: (url: string) => void;
  errorContext?: Record<string, unknown>;
  fallbackLabel?: string;
  fallbackHint?: string;
  className?: string;
  imageClassName?: string;
};

export function MediaPreview({
  src,
  alt,
  fit = 'cover',
  brokenPreviewUrls,
  onPreviewError,
  onRetry,
  errorContext,
  fallbackLabel = 'Preview unavailable',
  fallbackHint,
  className,
  imageClassName,
}: MediaPreviewProps) {
  const normalizedSrc = src?.trim() ?? '';
  const isBroken = Boolean(normalizedSrc) && brokenPreviewUrls[normalizedSrc] === true;
  const [isLoading, setIsLoading] = useState(Boolean(normalizedSrc) && !isBroken);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setIsLoading(Boolean(normalizedSrc) && !isBroken);
  }, [isBroken, normalizedSrc]);

  useEffect(() => {
    const image = imageRef.current;

    if (!image || !normalizedSrc || isBroken) {
      return;
    }

    if (image.complete && image.naturalWidth > 0) {
      setIsLoading(false);
      return;
    }

    if (image.complete && image.naturalWidth === 0) {
      setIsLoading(false);
      onPreviewError(normalizedSrc, errorContext);
    }
  }, [errorContext, isBroken, normalizedSrc, onPreviewError]);

  if (!normalizedSrc || isBroken) {
    return (
      <div
        className={cn(
          'flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] bg-[length:18px_18px] px-4 py-6 text-center',
          className,
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
          <ImagePlus className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{fallbackLabel}</p>
          {fallbackHint ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{fallbackHint}</p>
          ) : null}
        </div>
        {normalizedSrc && onRetry ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => onRetry(normalizedSrc)}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-slate-100', className)}>
      {isLoading ? (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200" />
      ) : null}
      <img
        ref={imageRef}
        src={normalizedSrc}
        alt={alt}
        className={cn(
          'h-full w-full transition duration-300',
          fit === 'contain' ? 'object-contain' : 'object-cover',
          imageClassName,
          isLoading ? 'opacity-0' : 'opacity-100',
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          onPreviewError(normalizedSrc, errorContext);
        }}
      />
    </div>
  );
}

type MediaLibraryBrowserProps = {
  title: string;
  description: string;
  variant?: 'dialog' | 'page';
  allowedAssetTypes?: MediaLibraryAsset['fileType'][];
  selectedAssetId?: string | null;
  selectedValue?: string;
  onSelectAsset?: (asset: MediaLibraryAsset) => void;
  onAssetUpdated?: (asset: MediaLibraryAsset) => void;
  onCloseRequest?: () => void;
  selectionActionLabel?: string;
  showUploadControls?: boolean;
  uploadKinds?: UploadKind[];
};

export function MediaLibraryBrowser({
  title,
  description,
  variant = 'dialog',
  allowedAssetTypes,
  selectedAssetId,
  selectedValue = '',
  onSelectAsset,
  onAssetUpdated,
  onCloseRequest,
  selectionActionLabel = 'Use Image',
  showUploadControls = false,
  uploadKinds = ['image'],
}: MediaLibraryBrowserProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldUseLocationSearchParams =
    variant === 'page' && (!allowedAssetTypes || allowedAssetTypes.length === 0);
  const effectiveAssetTypes = useMemo(
    () => (allowedAssetTypes && allowedAssetTypes.length > 0 ? allowedAssetTypes : null),
    [allowedAssetTypes],
  );
  const fileTypeOptions = useMemo<MediaLibraryAsset['fileType'][]>(() => {
    const sourceTypes = effectiveAssetTypes ?? ['IMAGE', 'SVG', 'DOCUMENT', 'VIDEO', 'UNKNOWN'];
    return Array.from(new Set(sourceTypes));
  }, [effectiveAssetTypes]);
  const inputRefs = useRef<Record<UploadKind, HTMLInputElement | null>>({
    image: null,
    document: null,
    videoThumbnail: null,
  });
  const [isUploadingByKind, setIsUploadingByKind] = useState<Record<UploadKind, boolean>>({
    image: false,
    document: false,
    videoThumbnail: false,
  });
  const [brokenPreviewUrls, setBrokenPreviewUrls] = useState<BrokenPreviewMap>({});
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryItems, setLibraryItems] = useState<MediaLibraryAsset[]>([]);
  const [serverPagination, setServerPagination] = useState<PaginationMeta | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<MediaViewMode>(
    shouldUseLocationSearchParams
      ? getSanitizedViewMode(searchParams.get('view'))
      : 'grid',
  );
  const [searchQuery, setSearchQuery] = useState(
    shouldUseLocationSearchParams ? searchParams.get('search') ?? '' : '',
  );
  const [statusFilter, setStatusFilter] = useState<MediaStatusFilter>(
    shouldUseLocationSearchParams
      ? getSanitizedMediaStatusFilter(searchParams.get('status'))
      : 'ALL',
  );
  const [fileTypeFilter, setFileTypeFilter] = useState<MediaAssetFilterType>(
    shouldUseLocationSearchParams
      ? getSanitizedMediaFileTypeFilter(searchParams.get('fileType'), fileTypeOptions)
      : 'ALL',
  );
  const [activeItem, setActiveItem] = useState<MediaLibraryAsset | null>(null);
  const [metadataValues, setMetadataValues] = useState<MediaMetadataFormValues>(
    buildMediaMetadataFormValues(null),
  );
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<MediaLibraryAsset | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [usageSummariesById, setUsageSummariesById] = useState<Record<string, MediaAssetUsageSummary>>({});
  const [usageLoadingIds, setUsageLoadingIds] = useState<Record<string, true>>({});
  const [libraryReloadKey, setLibraryReloadKey] = useState(0);
  const [dialogVisibleItemCount, setDialogVisibleItemCount] = useState(dialogVisibleAssetBatchSize);
  const allowSelection = Boolean(onSelectAsset);
  const isPageVariant = variant === 'page' && effectiveAssetTypes === null;
  const shouldUseServerPagination = isPageVariant;
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const normalizedSearchQuery = debouncedSearchQuery.trim();
  const currentPageFromUrl = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const currentPage =
    shouldUseServerPagination && Number.isFinite(currentPageFromUrl) && currentPageFromUrl > 0
      ? currentPageFromUrl
      : 1;

  useEffect(() => {
    if (!isPageVariant) {
      return;
    }

    const currentSearchValue = (searchParams.get('search') ?? '').trim();
    const currentStatusValue = getSanitizedMediaStatusFilter(searchParams.get('status'));
    const currentFileTypeValue = getSanitizedMediaFileTypeFilter(
      searchParams.get('fileType'),
      fileTypeOptions,
    );
    const nextPage =
      normalizedSearchQuery !== currentSearchValue
      || statusFilter !== currentStatusValue
      || fileTypeFilter !== currentFileTypeValue
        ? 1
        : currentPage;
    const nextSearchParams = buildMediaLibrarySearchParams({
      search: debouncedSearchQuery,
      status: statusFilter,
      fileType: fileTypeFilter,
      viewMode,
      page: nextPage,
    });

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    fileTypeFilter,
    fileTypeOptions,
    isPageVariant,
    normalizedSearchQuery,
    searchParams,
    setSearchParams,
    statusFilter,
    viewMode,
  ]);

  const reloadLibraryItems = () => {
    setLibraryReloadKey((currentValue) => currentValue + 1);
  };

  useEffect(() => {
    let isActive = true;

    const loadLibraryItems = async () => {
      setIsLoadingLibrary(true);
      setLibraryError(null);

      try {
        const response = await apiClient.get('/media-assets', {
          params: shouldUseServerPagination
            ? {
                ...(normalizedSearchQuery ? { search: normalizedSearchQuery } : {}),
                ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
                ...(fileTypeFilter !== 'ALL' ? { fileType: fileTypeFilter } : {}),
                page: currentPage,
                limit: dashboardPageSize,
              }
            : undefined,
        });
        const payload = extractApiData<MediaLibraryAsset[]>(response);

        if (!isActive) {
          return;
        }

        setServerPagination(
          shouldUseServerPagination ? extractApiPagination(response) ?? null : null,
        );
        setLibraryItems(
          shouldUseServerPagination
            ? payload
            : effectiveAssetTypes
            ? payload.filter((item) => effectiveAssetTypes.includes(item.fileType))
            : payload,
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

        setServerPagination(null);
        setLibraryError(getApiErrorMessage(error));
      } finally {
        if (isActive) {
          setIsLoadingLibrary(false);
        }
      }
    };

    void loadLibraryItems();

    return () => {
      isActive = false;
    };
  }, [
    currentPage,
    effectiveAssetTypes,
    fileTypeFilter,
    libraryReloadKey,
    normalizedSearchQuery,
    shouldUseServerPagination,
    statusFilter,
  ]);

  useEffect(() => {
    setMetadataValues(buildMediaMetadataFormValues(activeItem));
  }, [activeItem]);

  const filteredLibraryItems = useMemo(() => {
    if (shouldUseServerPagination) {
      return libraryItems;
    }

    const normalizedSearch = searchQuery.trim().toLowerCase();

    return libraryItems.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      if (fileTypeFilter !== 'ALL' && item.fileType !== fileTypeFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        item.title,
        item.originalName,
        item.filename,
        item.altText,
        item.caption,
        item.seoTitle,
        item.seoDescription,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [fileTypeFilter, libraryItems, searchQuery, shouldUseServerPagination, statusFilter]);
  const visibleLibraryItems = useMemo(
    () =>
      variant === 'dialog'
        ? filteredLibraryItems.slice(0, dialogVisibleItemCount)
        : filteredLibraryItems,
    [dialogVisibleItemCount, filteredLibraryItems, variant],
  );
  const hasMoreDialogItems =
    variant === 'dialog' && visibleLibraryItems.length < filteredLibraryItems.length;

  const visibleItemIds = useMemo(
    () => visibleLibraryItems.map((item) => item.id),
    [visibleLibraryItems],
  );

  useEffect(() => {
    if (variant !== 'dialog') {
      return;
    }

    setDialogVisibleItemCount(dialogVisibleAssetBatchSize);
  }, [fileTypeFilter, libraryReloadKey, normalizedSearchQuery, statusFilter, variant, viewMode]);
  const selectedVisibleCount = useMemo(
    () => selectedItemIds.filter((id) => visibleItemIds.includes(id)).length,
    [selectedItemIds, visibleItemIds],
  );
  const areAllVisibleSelected =
    visibleItemIds.length > 0 && selectedVisibleCount === visibleItemIds.length;
  const totalFilteredAssetCount = shouldUseServerPagination
    ? serverPagination?.totalItems ?? filteredLibraryItems.length
    : filteredLibraryItems.length;
  const totalAssetCount = shouldUseServerPagination
    ? serverPagination?.totalItems ?? libraryItems.length
    : libraryItems.length;

  useEffect(() => {
    setSelectedItemIds((currentIds) =>
      currentIds.filter((id) => libraryItems.some((item) => item.id === id)),
    );
  }, [libraryItems]);

  useEffect(() => {
    if (!shouldUseServerPagination || !serverPagination) {
      return;
    }

    if (currentPage <= serverPagination.totalPages) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);

    if (serverPagination.totalPages <= 1) {
      nextSearchParams.delete('page');
    } else {
      nextSearchParams.set('page', String(serverPagination.totalPages));
    }

    setSearchParams(nextSearchParams, { replace: true });
  }, [
    currentPage,
    searchParams,
    serverPagination,
    setSearchParams,
    shouldUseServerPagination,
  ]);

  useEffect(() => {
    if (!deleteTarget || usageSummariesById[deleteTarget.id] || usageLoadingIds[deleteTarget.id]) {
      return;
    }

    void (async () => {
      setUsageLoadingIds((currentState) => ({
        ...currentState,
        [deleteTarget.id]: true,
      }));

      try {
        const response = await apiClient.post('/media-assets/usage-summary', {
          ids: [deleteTarget.id],
        });
        const payload = extractApiData<MediaAssetUsageSummary[]>(response);
        setUsageSummariesById((currentState) => ({
          ...currentState,
          ...Object.fromEntries(payload.map((summary) => [summary.assetId, summary])),
        }));
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setUsageLoadingIds((currentState) => {
          const nextState = { ...currentState };
          delete nextState[deleteTarget.id];
          return nextState;
        });
      }
    })();
  }, [deleteTarget, usageLoadingIds, usageSummariesById]);

  useEffect(() => {
    if (!bulkDeleteDialogOpen) {
      return;
    }

    const missingIds = selectedItemIds.filter(
      (id) => !usageSummariesById[id] && !usageLoadingIds[id],
    );

    if (missingIds.length === 0) {
      return;
    }

    void (async () => {
      setUsageLoadingIds((currentState) => ({
        ...currentState,
        ...Object.fromEntries(missingIds.map((id) => [id, true])),
      }));

      try {
        const response = await apiClient.post('/media-assets/usage-summary', {
          ids: missingIds,
        });
        const payload = extractApiData<MediaAssetUsageSummary[]>(response);
        setUsageSummariesById((currentState) => ({
          ...currentState,
          ...Object.fromEntries(payload.map((summary) => [summary.assetId, summary])),
        }));
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setUsageLoadingIds((currentState) => {
          const nextState = { ...currentState };

          for (const id of missingIds) {
            delete nextState[id];
          }

          return nextState;
        });
      }
    })();
  }, [bulkDeleteDialogOpen, selectedItemIds, usageLoadingIds, usageSummariesById]);

  const markPreviewAsBroken = (previewUrl: string, context?: Record<string, unknown>) => {
    setBrokenPreviewUrls((currentState) => {
      if (currentState[previewUrl]) {
        return currentState;
      }

      if (import.meta.env.DEV) {
        console.warn('[media-preview] Failed to load image preview.', {
          resolvedUrl: previewUrl,
          errorCategory: 'image_request_failed',
          ...context,
        });
      }

      return {
        ...currentState,
        [previewUrl]: true,
      };
    });
  };

  const retryPreview = (previewUrl: string) => {
    setBrokenPreviewUrls((currentState) => {
      if (!currentState[previewUrl]) {
        return currentState;
      }

      const nextState = { ...currentState };
      delete nextState[previewUrl];
      return nextState;
    });
  };

  const uploadFiles = async (kind: UploadKind, files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setIsUploadingByKind((currentState) => ({
      ...currentState,
      [kind]: true,
    }));

    try {
      const uploadedPayloads: UploadedFile[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('kind', kind);
        formData.append('file', file);

        const response = await apiClient.post('/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        uploadedPayloads.push(extractApiData<UploadedFile>(response));
      }

      if (shouldUseServerPagination) {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.delete('page');
        setSearchParams(nextSearchParams, { replace: true });
        reloadLibraryItems();
      } else {
        setLibraryItems((currentItems) => {
          const nextItems = [...currentItems];

          for (const payload of uploadedPayloads) {
            if (!effectiveAssetTypes || effectiveAssetTypes.includes(payload.asset.fileType)) {
              if (!nextItems.some((item) => item.id === payload.asset.id)) {
                nextItems.unshift(payload.asset);
              }
            }
          }

          return nextItems;
        });
      }

      toast.success(
        uploadedPayloads.length === 1
          ? 'File uploaded successfully.'
          : `${uploadedPayloads.length} files uploaded successfully.`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploadingByKind((currentState) => ({
        ...currentState,
        [kind]: false,
      }));

      if (inputRefs.current[kind]) {
        inputRefs.current[kind]!.value = '';
      }
    }
  };

  const handleCopyUrl = async (item: MediaLibraryAsset) => {
    const itemUrl = getAssetUrl(item);
    const copyValue = itemUrl ? resolveCmsAssetUrl(itemUrl) || itemUrl : '';

    if (!copyValue) {
      toast.error('This asset does not have a usable URL yet.');
      return;
    }

    try {
      await navigator.clipboard.writeText(copyValue);
      toast.success('Asset URL copied successfully.');
    } catch {
      toast.error('Could not copy the asset URL.');
    }
  };

  const handleUseLibraryItem = (item: MediaLibraryAsset) => {
    const itemUrl = getAssetUrl(item);

    if (!itemUrl || !onSelectAsset) {
      toast.error('This asset does not have a usable URL yet.');
      return;
    }

    onSelectAsset(item);
    setActiveItem(null);
    onCloseRequest?.();
    toast.success('Image selected from media library.');
  };

  const handleToggleItemSelection = (itemId: string, isChecked: boolean) => {
    setSelectedItemIds((currentIds) => {
      if (isChecked) {
        return currentIds.includes(itemId) ? currentIds : [...currentIds, itemId];
      }

      return currentIds.filter((id) => id !== itemId);
    });
  };

  const handleToggleAllVisibleItems = (isChecked: boolean) => {
    if (!isChecked) {
      setSelectedItemIds((currentIds) =>
        currentIds.filter((id) => !visibleItemIds.includes(id)),
      );
      return;
    }

    setSelectedItemIds((currentIds) => [
      ...currentIds,
      ...visibleItemIds.filter((id) => !currentIds.includes(id)),
    ]);
  };

  const removeDeletedAssetsFromState = (deletedIds: string[]) => {
    setLibraryItems((currentItems) =>
      currentItems.filter((item) => !deletedIds.includes(item.id)),
    );
    setSelectedItemIds((currentIds) =>
      currentIds.filter((id) => !deletedIds.includes(id)),
    );

    if (activeItem && deletedIds.includes(activeItem.id)) {
      setActiveItem(null);
    }

    if (deleteTarget && deletedIds.includes(deleteTarget.id)) {
      setDeleteTarget(null);
    }

    setUsageSummariesById((currentState) => {
      const nextState = { ...currentState };

      for (const deletedId of deletedIds) {
        delete nextState[deletedId];
      }

      return nextState;
    });
  };

  const handleDeleteSingleAsset = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeletingSingle(true);

    try {
      await apiClient.delete(`/media-assets/${deleteTarget.id}`);
      if (shouldUseServerPagination && currentPage > 1 && filteredLibraryItems.length === 1) {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set('page', String(currentPage - 1));
        setSearchParams(nextSearchParams, { replace: true });
      }
      removeDeletedAssetsFromState([deleteTarget.id]);
      if (shouldUseServerPagination) {
        reloadLibraryItems();
      }
      toast.success('Media asset deleted successfully.');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleDeleteSelectedAssets = async () => {
    if (selectedItemIds.length === 0) {
      toast.error('Select at least one media asset to delete.');
      return;
    }

    setIsDeletingBulk(true);

    try {
      const response = await apiClient.post('/media-assets/bulk-delete', {
        ids: selectedItemIds,
      });
      const payload = extractApiData<{ deletedIds: string[]; deletedCount: number }>(response);
      const deletedCurrentPageAssetCount = filteredLibraryItems.filter((item) =>
        payload.deletedIds.includes(item.id),
      ).length;

      if (
        shouldUseServerPagination
        && currentPage > 1
        && deletedCurrentPageAssetCount > 0
        && deletedCurrentPageAssetCount === filteredLibraryItems.length
      ) {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.set('page', String(currentPage - 1));
        setSearchParams(nextSearchParams, { replace: true });
      }
      removeDeletedAssetsFromState(payload.deletedIds);
      if (shouldUseServerPagination) {
        reloadLibraryItems();
      }
      toast.success(
        payload.deletedCount === 1
          ? '1 media asset deleted successfully.'
          : `${payload.deletedCount} media assets deleted successfully.`,
      );
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!activeItem) {
      return;
    }

    setIsSavingMetadata(true);

    try {
      const response = await apiClient.put(`/media-assets/${activeItem.id}`, {
        title: metadataValues.title.trim() || null,
        altText: metadataValues.altText.trim() || null,
        seoTitle: metadataValues.seoTitle.trim() || null,
        seoDescription: metadataValues.seoDescription.trim() || null,
      });
      const updatedItem = extractApiData<MediaLibraryAsset>(response);

      setLibraryItems((currentItems) =>
        currentItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
      );
      if (shouldUseServerPagination) {
        reloadLibraryItems();
      }
      setActiveItem(updatedItem);
      onAssetUpdated?.(updatedItem);

      toast.success('Image metadata updated successfully.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const selectedAssetsForDelete = useMemo(() => {
    const selectedIds = new Set(selectedItemIds);

    return libraryItems
      .filter((item) => selectedIds.has(item.id))
      .sort(
        (left, right) =>
          selectedItemIds.indexOf(left.id) - selectedItemIds.indexOf(right.id),
      );
  }, [libraryItems, selectedItemIds]);

  const renderUsageSummary = (summary?: MediaAssetUsageSummary) => {
    if (!summary) {
      return null;
    }

    if (!summary.isReferenced) {
      return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          No CMS references were found for this asset in the main MediEntry content areas checked by the Media Library.
        </div>
      );
    }

    return (
      <div className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Warning: this asset is still referenced {summary.totalReferences} time
              {summary.totalReferences === 1 ? '' : 's'}.
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Deleting it may create broken images or files on those pages.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {summary.references.map((reference) => (
            <div
              key={reference.key}
              className="rounded-xl border border-amber-200 bg-white/80 px-3 py-3"
            >
              <div className="text-sm font-semibold text-slate-900">
                {reference.label}: {reference.count}
              </div>
              {reference.examples.length > 0 ? (
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Examples: {reference.examples.join(', ')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-white',
        variant === 'page'
          ? 'overflow-hidden rounded-[30px] border border-border/70 shadow-[0_18px_40px_rgba(15,61,39,0.08)]'
          : '',
      )}
    >
      <div className="border-b border-border/70 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          {showUploadControls ? (
            <div className="flex flex-wrap gap-2">
              {uploadKinds.map((kind) => (
                <div key={kind}>
                  <input
                    ref={(element) => {
                      inputRefs.current[kind] = element;
                    }}
                    type="file"
                    accept={defaultAcceptByKind[kind]}
                    className="hidden"
                    multiple
                    onChange={(event) => {
                      const selectedFiles = Array.from(event.target.files ?? []);

                      if (selectedFiles.length > 0) {
                        void uploadFiles(kind, selectedFiles);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => inputRefs.current[kind]?.click()}
                    disabled={isUploadingByKind[kind]}
                  >
                    {isUploadingByKind[kind] ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="h-4 w-4" />
                    )}
                    {isUploadingByKind[kind] ? 'Uploading...' : uploadButtonLabels[kind]}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-b border-border/70 bg-muted/20 px-6 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search title, filename, alt text, or SEO metadata"
                className="pl-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as MediaStatusFilter)}
              className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active only</option>
              <option value="INACTIVE">Inactive only</option>
            </select>

            <select
              value={fileTypeFilter}
              onChange={(event) => setFileTypeFilter(event.target.value as MediaAssetFilterType)}
              className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">All file types</option>
              {fileTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{visibleLibraryItems.length}</span> of{' '}
              <span className="font-semibold text-foreground">{totalFilteredAssetCount}</span> assets
              {shouldUseServerPagination && totalAssetCount !== totalFilteredAssetCount ? (
                <> from <span className="font-semibold text-foreground">{totalAssetCount}</span> total</>
              ) : null}
            </p>

            <div className="inline-flex rounded-xl border border-border/70 bg-white p-1 shadow-sm">
              <Button
                type="button"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="h-9 px-3"
                onClick={() => setViewMode('grid')}
              >
                <Grid2x2 className="h-4 w-4" />
                Grid
              </Button>
              <Button
                type="button"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-9 px-3"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="inline-flex items-center gap-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              checked={areAllVisibleSelected}
              onChange={(event) => handleToggleAllVisibleItems(event.target.checked)}
              disabled={visibleItemIds.length === 0}
            />
            Select all visible assets
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selectedItemIds.length}</span> selected
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selectedItemIds.length === 0}
              onClick={() => setSelectedItemIds([])}
            >
              Clear selection
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={selectedItemIds.length === 0}
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      </div>

      <div className={cn('flex-1 min-h-0 overflow-y-auto px-6 py-5', variant === 'page' ? 'min-h-[65vh]' : '')}>
        {isLoadingLibrary ? (
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading media library...
          </div>
        ) : libraryError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-sm text-destructive">
            {libraryError}
          </div>
        ) : filteredLibraryItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            No uploaded assets matched the current filters.
          </div>
        ) : viewMode === 'grid' ? (
          <div className="space-y-5">
            <div
              className={cn(
                'grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
                variant === 'page' ? '2xl:grid-cols-6' : '2xl:grid-cols-8',
              )}
            >
            {visibleLibraryItems.map((item) => {
              const itemUrl = resolveCmsAssetUrl(getAssetUrl(item));
              const isSelected =
                (selectedAssetId && selectedAssetId === item.id)
                || (Boolean(selectedValue.trim()) && selectedValue.trim() === (getAssetUrl(item) ?? ''));
              const isCheckedForDelete = selectedItemIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={cn(
                    'overflow-hidden rounded-[20px] border bg-white shadow-[0_8px_20px_rgba(15,61,39,0.07)] transition',
                    isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border/70',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
                      <label
                        className="absolute right-2 top-2 z-10 inline-flex items-center rounded-full bg-white/95 p-1.5 shadow-sm"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={isCheckedForDelete}
                          onChange={(event) =>
                            handleToggleItemSelection(item.id, event.target.checked)
                          }
                        />
                      </label>
                      <MediaPreview
                        src={itemUrl}
                        alt={item.altText ?? item.title ?? item.filename}
                        brokenPreviewUrls={brokenPreviewUrls}
                        onPreviewError={(url) =>
                          markPreviewAsBroken(url, {
                            mediaId: item.id,
                            storedValue: getAssetUrl(item) ?? null,
                            fileType: item.fileType,
                          })
                        }
                        onRetry={retryPreview}
                        fallbackHint={item.filename}
                        imageClassName="hover:scale-[1.02]"
                      />
                      {isSelected ? (
                        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
                          <Check className="h-3 w-3" />
                          Selected
                        </div>
                      ) : null}
                    </div>
                  </button>

                  <div className="space-y-2 px-3 py-3">
                    <div className="space-y-1">
                      <p
                        className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground"
                        title={item.title || item.originalName || item.filename}
                      >
                        {item.title || item.originalName || item.filename}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                        <span>{formatStatusLabel(item.status)}</span>
                        <span className="text-border">|</span>
                        <span>{item.fileType}</span>
                      </div>
                    </div>

                    {allowSelection ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 w-full text-xs"
                        onClick={() => handleUseLibraryItem(item)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {selectionActionLabel}
                      </Button>
                    ) : null}

                    <div className={cn('grid gap-2', allowSelection ? 'grid-cols-2' : 'grid-cols-2')}>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        onClick={() => setActiveItem(item)}
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                        Details
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => void handleCopyUrl(item)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
            {hasMoreDialogItems ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDialogVisibleItemCount((currentValue) => currentValue + dialogVisibleAssetBatchSize)
                  }
                >
                  Load more
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleLibraryItems.map((item) => {
              const itemUrl = resolveCmsAssetUrl(getAssetUrl(item));
              const isSelected =
                (selectedAssetId && selectedAssetId === item.id)
                || (Boolean(selectedValue.trim()) && selectedValue.trim() === (getAssetUrl(item) ?? ''));
              const isCheckedForDelete = selectedItemIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={cn(
                    'grid gap-4 rounded-[24px] border bg-white p-4 shadow-[0_8px_20px_rgba(15,61,39,0.06)] md:grid-cols-[180px_minmax(0,1fr)_auto]',
                    isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border/70',
                  )}
                >
                  <div className="space-y-3">
                    <label className="inline-flex items-center gap-3 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        checked={isCheckedForDelete}
                        onChange={(event) =>
                          handleToggleItemSelection(item.id, event.target.checked)
                        }
                      />
                      Select for bulk delete
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveItem(item)}
                      className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20"
                    >
                      <div className="aspect-[4/3] w-full">
                        <MediaPreview
                          src={itemUrl}
                          alt={item.altText ?? item.title ?? item.filename}
                          brokenPreviewUrls={brokenPreviewUrls}
                          onPreviewError={(url) =>
                            markPreviewAsBroken(url, {
                              mediaId: item.id,
                              storedValue: getAssetUrl(item) ?? null,
                              fileType: item.fileType,
                            })
                          }
                          onRetry={retryPreview}
                          fallbackHint={item.filename}
                        />
                      </div>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className="space-y-2 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">
                        {item.title || item.originalName || item.filename}
                      </p>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          <Check className="h-3.5 w-3.5" />
                          Selected
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{formatStatusLabel(item.status)}</span>
                      <span>{item.fileType}</span>
                      {item.altText ? <span>Alt text added</span> : null}
                      {item.seoTitle ? <span>SEO title added</span> : null}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {item.seoDescription || item.altText || 'Open details to manage SEO metadata for this asset.'}
                    </p>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                    {allowSelection ? (
                      <Button type="button" size="sm" onClick={() => handleUseLibraryItem(item)}>
                        <Check className="h-4 w-4" />
                        {selectionActionLabel}
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" variant="outline" onClick={() => setActiveItem(item)}>
                      <PencilLine className="h-4 w-4" />
                      Details
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => void handleCopyUrl(item)}>
                      <Copy className="h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
            {hasMoreDialogItems ? (
              <div className="flex justify-center pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDialogVisibleItemCount((currentValue) => currentValue + dialogVisibleAssetBatchSize)
                  }
                >
                  Load more
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {shouldUseServerPagination && serverPagination ? (
        <div className="border-t border-border/70 px-6 py-5">
          <Pagination
            pagination={serverPagination}
            onPageChange={(page) => {
              const nextSearchParams = new URLSearchParams(searchParams);

              if (page <= 1) {
                nextSearchParams.delete('page');
              } else {
                nextSearchParams.set('page', String(page));
              }

              setSearchParams(nextSearchParams);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      ) : null}

      <Dialog open={Boolean(activeItem)} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          {activeItem ? (
            <>
              <DialogHeader>
                <DialogTitle>Image Details</DialogTitle>
                <DialogDescription>
                  Update SEO metadata for this uploaded asset, then save it back to the shared media library.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[24px] border border-border/70 bg-muted/20">
                    <div className="max-h-[420px] min-h-[320px]">
                      <MediaPreview
                        src={resolveCmsAssetUrl(getAssetUrl(activeItem))}
                        alt={activeItem.altText ?? activeItem.title ?? activeItem.filename}
                        fit="contain"
                        brokenPreviewUrls={brokenPreviewUrls}
                        onPreviewError={(url) =>
                          markPreviewAsBroken(url, {
                            mediaId: activeItem.id,
                            storedValue: getAssetUrl(activeItem) ?? null,
                            fileType: activeItem.fileType,
                          })
                        }
                        onRetry={retryPreview}
                        fallbackHint={activeItem.filename}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Asset URL</p>
                        <p className="mt-1 break-all text-sm text-muted-foreground">
                          {resolveCmsAssetUrl(getAssetUrl(activeItem)) ?? getAssetUrl(activeItem) ?? 'Not available'}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          Deleting this asset removes the uploaded file from the shared media library. Any page or content still using this URL may show a broken image afterward.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => window.open(resolveCmsAssetUrl(getAssetUrl(activeItem)), '_blank', 'noopener,noreferrer')}>
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Button>
                        <Button type="button" variant="outline" onClick={() => void handleCopyUrl(activeItem)}>
                          <Copy className="h-4 w-4" />
                          Copy URL
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-border/70 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                        {formatStatusLabel(activeItem.status)}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
                        {activeItem.fileType}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="media-title">Title</Label>
                        <Input
                          id="media-title"
                          value={metadataValues.title}
                          onChange={(event) =>
                            setMetadataValues((currentValues) => ({
                              ...currentValues,
                              title: event.target.value,
                            }))
                          }
                          placeholder="Readable asset title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="media-alt-text">Alt Text</Label>
                        <Input
                          id="media-alt-text"
                          value={metadataValues.altText}
                          onChange={(event) =>
                            setMetadataValues((currentValues) => ({
                              ...currentValues,
                              altText: event.target.value,
                            }))
                          }
                          placeholder="Describe this image for accessibility"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="media-seo-title">SEO Title</Label>
                        <Input
                          id="media-seo-title"
                          value={metadataValues.seoTitle}
                          onChange={(event) =>
                            setMetadataValues((currentValues) => ({
                              ...currentValues,
                              seoTitle: event.target.value,
                            }))
                          }
                          placeholder="Optional SEO title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="media-seo-description">SEO Description</Label>
                        <Textarea
                          id="media-seo-description"
                          rows={5}
                          value={metadataValues.seoDescription}
                          onChange={(event) =>
                            setMetadataValues((currentValues) => ({
                              ...currentValues,
                              seoDescription: event.target.value,
                            }))
                          }
                          placeholder="Optional SEO description for search and internal asset management"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {allowSelection ? (
                        <Button type="button" onClick={() => handleUseLibraryItem(activeItem)}>
                          <Check className="h-4 w-4" />
                          {selectionActionLabel}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setDeleteTarget(activeItem)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Asset
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => setActiveItem(null)}>
                        Close
                      </Button>
                      <Button type="button" onClick={() => void handleSaveMetadata()} disabled={isSavingMetadata}>
                        {isSavingMetadata ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <PencilLine className="h-4 w-4" />
                        )}
                        {isSavingMetadata ? 'Saving...' : 'Save Metadata'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete media asset?"
        description="This will permanently delete the selected media file from the Media Library and remove the uploaded file from storage. Pages still using this URL may show a broken image afterward."
        isLoading={isDeletingSingle}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          void handleDeleteSingleAsset();
        }}
      >
        {deleteTarget && usageLoadingIds[deleteTarget.id] ? (
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
            Checking where this asset is used...
          </div>
        ) : (
          renderUsageSummary(
            deleteTarget ? usageSummariesById[deleteTarget.id] : undefined,
          )
        )}
      </DeleteConfirmDialog>

      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        title="Delete selected media assets?"
        description={`This will permanently delete ${selectedItemIds.length} selected media asset${selectedItemIds.length === 1 ? '' : 's'} from the Media Library and storage. Any page still using those URLs may show broken media afterward.`}
        isLoading={isDeletingBulk}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={() => {
          void handleDeleteSelectedAssets();
        }}
      >
        <div className="space-y-3">
          {selectedAssetsForDelete.map((item) => {
            const summary = usageSummariesById[item.id];
            const isLoadingUsage = usageLoadingIds[item.id] === true;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {item.title || item.originalName || item.filename}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.filename}</div>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {isLoadingUsage
                      ? 'Checking usage...'
                      : summary?.isReferenced
                        ? `${summary.totalReferences} reference${summary.totalReferences === 1 ? '' : 's'} found`
                        : 'No references found'}
                  </div>
                </div>

                {!isLoadingUsage ? renderUsageSummary(summary) : null}
              </div>
            );
          })}
        </div>
      </DeleteConfirmDialog>
    </div>
  );
}
