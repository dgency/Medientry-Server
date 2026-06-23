import { useRef, useState } from 'react';
import { ImagePlus, Link2, LoaderCircle, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { apiClient, extractApiData, getApiErrorMessage } from '../../lib/api-client';
import { resolveCmsAssetUrl } from '../../lib/media';
import { cn } from '../../lib/utils';
import type { UploadKind } from '../../types/app';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type UploadedFile = {
  url: string;
  fullUrl: string;
  filename: string;
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
    </div>
  );
}
