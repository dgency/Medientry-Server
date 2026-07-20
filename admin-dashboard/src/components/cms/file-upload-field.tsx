import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, LoaderCircle, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { apiClient, extractApiData, getApiErrorMessage } from '../../lib/api-client';
import { resolveCmsAssetUrl } from '../../lib/media';
import { cn } from '../../lib/utils';
import type { UploadKind } from '../../types/app';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type UploadedFile = {
  url: string;
  fullUrl: string;
  filename: string;
};

type GalleryImageItem = {
  id: string;
  title: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail: string | null;
  status: string;
};

type FileUploadFieldProps = {
  value: string;
  onChange: (value: string) => void;
  uploadKind: UploadKind;
  accept?: string;
  placeholder?: string;
  previewable?: boolean;
  previewLabel?: string;
};

const defaultAcceptByKind: Record<UploadKind, string> = {
  image:
    'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg',
  document: 'application/pdf',
  videoThumbnail:
    'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg',
};

export function FileUploadField({
  value,
  onChange,
  uploadKind,
  accept,
  placeholder,
  previewable = true,
  previewLabel = 'Preview file',
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewErrorUrl, setPreviewErrorUrl] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryItems, setLibraryItems] = useState<GalleryImageItem[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const canUseLibrary = uploadKind === 'image' || uploadKind === 'videoThumbnail';

  useEffect(() => {
    if (!isLibraryOpen || !canUseLibrary) {
      return;
    }

    let isActive = true;

    const loadLibraryItems = async () => {
      setIsLoadingLibrary(true);
      setLibraryError(null);

      try {
        const response = await apiClient.get('/gallery');
        const payload = extractApiData<GalleryImageItem[]>(response);

        if (!isActive) {
          return;
        }

        setLibraryItems(
          payload.filter((item) => item.type === 'IMAGE' && typeof item.url === 'string' && item.url.trim().length > 0),
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

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
  }, [canUseLibrary, isLibraryOpen]);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('kind', uploadKind);
    formData.append('file', file);

    setIsUploading(true);

    try {
      const response = await apiClient.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const payload = extractApiData<UploadedFile>(response);
      onChange(payload.url);
      toast.success('File uploaded successfully.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const isImagePreview =
    previewable &&
    uploadKind !== 'document' &&
    Boolean(resolveCmsAssetUrl(value)) &&
    /\.(jpg|jpeg|png|webp|gif|svg|ico)$/i.test(value);
  const previewUrl = resolveCmsAssetUrl(value);
  const hasPreviewError = Boolean(previewUrl) && previewErrorUrl === previewUrl;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept={accept ?? defaultAcceptByKind[uploadKind]}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void handleFileUpload(file);
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
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
        {canUseLibrary ? (
          <Button type="button" variant="outline" className="sm:w-auto" onClick={() => setIsLibraryOpen(true)}>
            <ImagePlus className="h-4 w-4" />
            Media Library
          </Button>
        ) : null}
        {value.trim() ? (
          <Button type="button" variant="ghost" className="sm:w-auto" onClick={() => onChange('')}>
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

          {isImagePreview && !hasPreviewError ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-white p-2">
              <img
                src={previewUrl}
                alt={previewLabel}
                className="h-36 w-full rounded-xl object-contain"
                onError={() => {
                  setPreviewErrorUrl(previewUrl);
                }}
              />
            </div>
          ) : null}

          {isImagePreview && hasPreviewError ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              Image preview unavailable. The saved file path is kept, but this image could not be displayed here.
            </div>
          ) : null}
        </div>
      ) : null}

      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select from Media Library</DialogTitle>
            <DialogDescription>Choose an existing image from the Gallery module.</DialogDescription>
          </DialogHeader>

          {isLoadingLibrary ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading media library...
            </div>
          ) : libraryError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-sm text-destructive">
              {libraryError}
            </div>
          ) : libraryItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
              No image items are available in the media library yet.
            </div>
          ) : (
            <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {libraryItems.map((item) => {
                const itemUrl = resolveCmsAssetUrl(item.url);
                const isSelected = value.trim() === item.url.trim();

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.url);
                      setIsLibraryOpen(false);
                      toast.success('Image selected from media library.');
                    }}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-white text-left transition hover:border-primary/40 hover:shadow-soft',
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border/70',
                    )}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted/20">
                      {itemUrl ? (
                        <img src={itemUrl} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Preview unavailable
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 px-4 py-3">
                      <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.status}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
