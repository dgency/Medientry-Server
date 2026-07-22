const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const fallbackYouTubeThumbnail = '/images/hero-campus-students.jpeg';

const isValidYouTubeVideoId = (value: string) => YOUTUBE_VIDEO_ID_PATTERN.test(value);

const normalizeHostname = (value: string) => value.trim().toLowerCase();

const normalizeVideoId = (value: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return isValidYouTubeVideoId(trimmed) ? trimmed : null;
};

const getVideoIdFromPath = (pathname: string) => {
  const parts = pathname
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  if (parts[0] === 'embed' || parts[0] === 'shorts') {
    return normalizeVideoId(parts[1] ?? null);
  }

  return normalizeVideoId(parts[0]);
};

export type YouTubeVideoDetails = {
  videoId: string;
  normalizedUrl: string;
  isShort: boolean;
};

export const isYouTubeShortsUrl = (value: string) =>
  getYouTubeVideoDetails(value)?.isShort ?? false;

export const normalizeYouTubeUrl = (value: string) =>
  getYouTubeVideoDetails(value)?.normalizedUrl ?? null;

export const extractYouTubeVideoId = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const hostname = normalizeHostname(url.hostname);

    if (!YOUTUBE_HOSTS.has(hostname)) {
      return null;
    }

    if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
      return getVideoIdFromPath(url.pathname);
    }

    if (url.pathname === '/watch') {
      return normalizeVideoId(url.searchParams.get('v'));
    }

    return getVideoIdFromPath(url.pathname);
  } catch {
    return null;
  }
};

export const getYouTubeVideoDetails = (value: string): YouTubeVideoDetails | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const hostname = normalizeHostname(url.hostname);

    if (!YOUTUBE_HOSTS.has(hostname)) {
      return null;
    }

    const isShort =
      hostname !== 'youtu.be' &&
      hostname !== 'www.youtu.be' &&
      url.pathname
        .split('/')
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean)[0] === 'shorts';
    const videoId = extractYouTubeVideoId(trimmed);

    if (!videoId) {
      return null;
    }

    return {
      videoId,
      normalizedUrl: isShort
        ? `https://www.youtube.com/shorts/${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`,
      isShort,
    };
  } catch {
    return null;
  }
};

export const getYouTubeThumbnailCandidates = (
  videoId: string,
  customThumbnail?: string | null,
) => {
  const normalizedVideoId = normalizeVideoId(videoId);
  const customThumbnailValue = customThumbnail?.trim() ?? '';
  const candidates: string[] = [];

  if (customThumbnailValue) {
    candidates.push(customThumbnailValue);
  }

  if (normalizedVideoId) {
    candidates.push(
      `https://img.youtube.com/vi/${normalizedVideoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${normalizedVideoId}/hqdefault.jpg`,
    );
  }

  candidates.push(fallbackYouTubeThumbnail);

  return Array.from(new Set(candidates));
};

export const getYouTubeThumbnailUrls = (videoId: string) =>
  getYouTubeThumbnailCandidates(videoId).slice(0, 2);

export const getYouTubeEmbedUrl = (
  videoId: string,
  autoplay = false,
  extraSearchParams?: Record<string, boolean | number | string | undefined>,
) => {
  const normalizedVideoId = normalizeVideoId(videoId);

  if (!normalizedVideoId) {
    return null;
  }

  const searchParams = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });

  Object.entries(extraSearchParams ?? {}).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    searchParams.set(key, String(value));
  });

  return `https://www.youtube-nocookie.com/embed/${normalizedVideoId}?${searchParams.toString()}`;
};
