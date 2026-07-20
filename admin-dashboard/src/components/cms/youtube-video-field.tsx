import { useMemo, useState } from 'react';
import { AlertCircle, Play } from 'lucide-react';

import { resolveCmsAssetUrl } from '../../lib/media';
import {
  getYouTubeThumbnailCandidates,
  getYouTubeVideoDetails,
} from '../../lib/youtube';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

type YouTubeVideoFieldProps = {
  value: string;
  onChange: (value: string) => void;
  thumbnailValue?: string;
  placeholder?: string;
};

const fallbackPreviewImage =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 1138">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0a2216"/>
          <stop offset="100%" stop-color="#19412c"/>
        </linearGradient>
      </defs>
      <rect width="640" height="1138" fill="url(#g)"/>
      <circle cx="320" cy="569" r="84" fill="rgba(255,255,255,0.14)"/>
      <polygon points="305,530 305,608 372,569" fill="#ffffff"/>
    </svg>`,
  );

function PreviewImage({
  candidates,
  alt,
}: {
  candidates: string[];
  alt: string;
}) {
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const previewImage = candidates[thumbnailIndex] ?? fallbackPreviewImage;

  return (
    <img
      src={previewImage}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => {
        setThumbnailIndex((currentIndex) =>
          currentIndex + 1 < candidates.length ? currentIndex + 1 : currentIndex,
        );
      }}
    />
  );
}

export function YouTubeVideoField({
  value,
  onChange,
  thumbnailValue,
  placeholder,
}: YouTubeVideoFieldProps) {
  const details = useMemo(() => getYouTubeVideoDetails(value), [value]);
  const normalizedThumbnailValue = thumbnailValue?.trim() ?? '';
  const previewCandidates = useMemo(() => {
    if (normalizedThumbnailValue) {
      const resolvedCustomThumbnail =
        resolveCmsAssetUrl(normalizedThumbnailValue) || normalizedThumbnailValue;

      return [resolvedCustomThumbnail, fallbackPreviewImage];
    }

    if (!details) {
      return [fallbackPreviewImage];
    }

    return [...getYouTubeThumbnailCandidates(details.videoId), fallbackPreviewImage];
  }, [details, normalizedThumbnailValue]);
  const hasTypedValue = value.trim().length > 0;
  const hasValidVideo = Boolean(details);

  return (
    <div className="space-y-4">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <div className="space-y-2 text-xs text-muted-foreground">
        <p>Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` or `https://www.youtube.com/shorts/VIDEO_ID`</p>
        {hasTypedValue && !hasValidVideo ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-destructive/25 bg-destructive/5 px-3 py-1.5 text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            Please enter a valid YouTube video or YouTube Shorts URL.
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant={hasValidVideo ? 'success' : 'outline'}>
            {hasValidVideo ? 'Preview ready' : 'Waiting for a valid YouTube URL'}
          </Badge>
          {details ? (
            <Badge variant="info">{details.isShort ? 'YouTube Short' : 'YouTube Video'}</Badge>
          ) : null}
          {normalizedThumbnailValue ? (
            <Badge variant="outline">Custom thumbnail active</Badge>
          ) : details ? (
            <Badge variant="outline">YouTube thumbnail fallback</Badge>
          ) : null}
        </div>

        <div
          className={`relative overflow-hidden rounded-[20px] bg-[#041b11] ${
            details?.isShort ? 'aspect-[9/16] max-w-[240px]' : 'aspect-video'
          }`}
        >
          <PreviewImage
            key={previewCandidates.join('|')}
            candidates={previewCandidates}
            alt={details ? 'YouTube preview thumbnail' : 'Video preview placeholder'}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,27,17,0.1)_0%,rgba(4,27,17,0.55)_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[#041b11] shadow-[0_18px_44px_rgba(4,27,17,0.28)]">
              <Play className="ml-1 h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
