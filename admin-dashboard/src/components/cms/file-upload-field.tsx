import { useRef, useState } from 'react';
import { ImagePlus, Link2, LoaderCircle, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { apiClient, extractApiData, getApiErrorMessage } from '../../lib/api-client';
import { resolveCmsAssetUrl } from '../../lib/media';
import {
  defaultAcceptByKind,
  getAssetUrl,
  MediaPreview,
  MediaLibraryBrowser,
} from './media-library-browser';
import type { MediaLibraryAsset } from './media-library-browser';
import { cn } from '../../lib/utils';
import type { UploadKind } from '../../types/app';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type UploadedFile = {
  url: string;
  fullUrl: string;
  filename: string;
  asset: MediaLibraryAsset;
};

type BrokenPreviewMap = Record<string, true>;

type FileUploadFieldProps = {
  value: string;
  onChange: (value: string) => void;
  uploadKind: UploadKind;
  accept?: string;
  placeholder?: string;
  previewable?: boolean;
  previewLabel?: string;
  allowManualEntry?: boolean;
  allowMultipleUploads?: boolean;
  assetId?: string;
  onAssetSelect?: (asset: MediaLibraryAsset | null) => void;
};

export function FileUploadField({
  value,
  onChange,
  uploadKind,
  accept,
  placeholder,
  previewable = true,
  previewLabel = 'Preview file',
  allowManualEntry = true,
  allowMultipleUploads = false,
  assetId,
  onAssetSelect,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [brokenPreviewUrls, setBrokenPreviewUrls] = useState<BrokenPreviewMap>({});
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const canUseLibrary = uploadKind === 'image' || uploadKind === 'videoThumbnail';

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

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const uploadedPayloads: UploadedFile[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('kind', uploadKind);
        formData.append('file', file);

        const response = await apiClient.post('/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        uploadedPayloads.push(extractApiData<UploadedFile>(response));
      }

      if (uploadedPayloads.length === 0) {
        return;
      }

      const primaryAsset = uploadedPayloads[0]?.asset ?? null;

      if (primaryAsset) {
        const primaryAssetUrl = getAssetUrl(primaryAsset) ?? uploadedPayloads[0].url;
        onChange(primaryAssetUrl);
        onAssetSelect?.(primaryAsset);
      }

      toast.success(
        uploadedPayloads.length === 1
          ? 'File uploaded successfully.'
          : `${uploadedPayloads.length} files uploaded successfully.`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };
  const previewUrl = resolveCmsAssetUrl(value);
  const isImagePreview = previewable && uploadKind !== 'document' && Boolean(previewUrl);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);

            if (!event.target.value.trim()) {
              onAssetSelect?.(null);
            }
          }}
          placeholder={placeholder}
          className="flex-1"
          readOnly={!allowManualEntry}
        />
        <input
          ref={inputRef}
          type="file"
          accept={accept ?? defaultAcceptByKind[uploadKind]}
          className="hidden"
          multiple={allowMultipleUploads}
          onChange={(event) => {
            const selectedFiles = Array.from(event.target.files ?? []);

            if (selectedFiles.length > 0) {
              void uploadFiles(selectedFiles);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="sm:w-auto"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {isUploading ? 'Uploading...' : allowMultipleUploads ? 'Upload Files' : 'Upload'}
        </Button>
        {canUseLibrary ? (
          <Button type="button" variant="outline" className="sm:w-auto" onClick={() => setIsLibraryOpen(true)}>
            <ImagePlus className="h-4 w-4" />
            Media Library
          </Button>
        ) : null}
        {value.trim() ? (
          <Button
            type="button"
            variant="ghost"
            className="sm:w-auto"
            onClick={() => {
              onChange('');
              onAssetSelect?.(null);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        ) : null}
      </div>

      {previewable && previewUrl ? (
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/80',
              )}
            >
              {isImagePreview ? <ImagePlus className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {previewLabel}
            </a>
          </div>

          {isImagePreview ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-white p-2">
              <div className="h-36 overflow-hidden rounded-xl">
                <MediaPreview
                  src={previewUrl}
                  alt={previewLabel}
                  fit="contain"
                  brokenPreviewUrls={brokenPreviewUrls}
                  onPreviewError={(url) => {
                    markPreviewAsBroken(url, {
                      mediaId: assetId ?? null,
                      storedValue: value || null,
                    });
                  }}
                  onRetry={retryPreview}
                  fallbackHint="The current saved file path is still kept, but this image could not be loaded."
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <Dialog
        open={isLibraryOpen}
        onOpenChange={(open) => {
          setIsLibraryOpen(open);
        }}
      >
        <DialogContent className="max-h-[88vh] w-[85vw] max-w-[85vw] overflow-hidden p-0">
          <MediaLibraryBrowser
            variant="dialog"
            title="Select from Media Library"
            description="Browse uploaded assets, filter the library, switch between grid and list views, and edit image SEO metadata before using an asset."
            allowedAssetTypes={uploadKind === 'document' ? ['DOCUMENT'] : ['IMAGE', 'SVG']}
            selectedAssetId={assetId ?? null}
            selectedValue={value}
            onSelectAsset={(asset) => {
              const itemUrl = getAssetUrl(asset);

              if (!itemUrl) {
                toast.error('This asset does not have a usable URL yet.');
                return;
              }

              onChange(itemUrl);
              onAssetSelect?.(asset);
            }}
            onAssetUpdated={(updatedAsset) => {
              if (assetId && updatedAsset.id === assetId) {
                onAssetSelect?.(updatedAsset);
              }
            }}
            onCloseRequest={() => setIsLibraryOpen(false)}
            selectionActionLabel={uploadKind === 'document' ? 'Use File' : 'Use Image'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
