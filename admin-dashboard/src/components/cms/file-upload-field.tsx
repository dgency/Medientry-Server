import { useRef, useState } from 'react';
import {
  FileText,
  Film,
  ImagePlus,
  LoaderCircle,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiClient, extractApiData, getApiErrorMessage } from '../../lib/api-client';
import { detectMediaKind, resolveCmsAssetUrl, type MediaKind, type MediaSelection } from '../../lib/media';
import { cn } from '../../lib/utils';
import type { UploadKind } from '../../types/app';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MediaLibraryBrowser } from './media-library-browser';

type UploadedFile = {
  id: string;
  url: string;
  storedValue: string;
  fullUrl: string;
  filename: string;
  originalName?: string | null;
  mimeType: string | null;
  kind: MediaKind;
  title?: string | null;
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
  image: 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg',
  document: 'application/pdf',
  video: 'video/mp4,video/webm,video/ogg,video/quicktime',
  videoThumbnail: 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg',
};

const allowedKindsByUploadKind: Record<UploadKind, MediaKind[]> = {
  image: ['image', 'svg'],
  document: ['document'],
  video: ['video'],
  videoThumbnail: ['image', 'svg'],
};

const inferUploadKindFromFile = (file: File): UploadKind => {
  if (file.type === 'application/pdf') {
    return 'document';
  }

  if (file.type.startsWith('video/')) {
    return 'video';
  }

  return 'image';
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

  const canUseLibrary = true;
  const previewUrl = resolveCmsAssetUrl(value);
  const previewKind = detectMediaKind(undefined, value);
  const hasPreviewError = Boolean(previewUrl) && previewErrorUrl === previewUrl;
  const isPreviewUnavailable = !previewUrl || hasPreviewError;

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('kind', uploadKind === 'videoThumbnail' ? 'image' : (uploadKind === 'video' ? 'video' : inferUploadKindFromFile(file)));
    formData.append('file', file);

    setIsUploading(true);

    try {
      const response = await apiClient.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const payload = extractApiData<UploadedFile>(response);
      onChange(payload.storedValue || payload.url);
      setPreviewErrorUrl(null);
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

  const handleMediaSelect = (selection: MediaSelection | MediaSelection[]) => {
    const nextSelection = Array.isArray(selection) ? selection[0] : selection;

    if (!nextSelection) {
      return;
    }

    onChange(nextSelection.storedValue ?? nextSelection.url);
    setPreviewErrorUrl(null);
    setIsLibraryOpen(false);
    toast.success('Media selected successfully.');
  };

  const renderPreview = () => {
    if (!previewable || !previewUrl) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className={cn('inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/80')}
          >
            {previewKind === 'video' ? <Film className="h-4 w-4" /> : previewKind === 'document' ? <FileText className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
            {previewLabel}
          </a>
        </div>

        {!isPreviewUnavailable ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-white p-2">
            {previewKind === 'video' ? (
              <video
                src={previewUrl}
                controls
                playsInline
                preload="metadata"
                className="h-48 w-full rounded-xl bg-black object-contain"
                onError={() => setPreviewErrorUrl(previewUrl)}
              />
            ) : previewKind === 'document' ? (
              <div className="flex min-h-24 items-center gap-3 rounded-xl bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                <FileText className="h-6 w-6" />
                <span>Document preview opens in a new tab.</span>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt={previewLabel}
                className="h-36 w-full rounded-xl object-contain"
                onError={() => setPreviewErrorUrl(previewUrl)}
              />
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            This media file could not be previewed. The stored value remains selectable, but the current preview URL failed to load.
          </div>
        )}
      </div>
    );
  };

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
        <Button type="button" variant="outline" className="sm:w-auto" onClick={() => inputRef.current?.click()} disabled={isUploading}>
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

      {renderPreview()}

      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] md:w-[92vw] md:max-w-[92vw] lg:w-[80vw] lg:max-w-[1440px]">
          <DialogHeader>
            <DialogTitle>Select from Media Library</DialogTitle>
            <DialogDescription>
              Browse uploaded media, legacy gallery assets, and supported previews without leaving the form.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[65vh] max-h-[88vh] overflow-hidden">
            <MediaLibraryBrowser
              allowedKinds={allowedKindsByUploadKind[uploadKind]}
              uploadKind={uploadKind}
              selectedValue={value}
              onSelect={handleMediaSelect}
              onClose={() => setIsLibraryOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
