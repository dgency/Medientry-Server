const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const isValidYouTubeVideoId = (value: string) => YOUTUBE_VIDEO_ID_PATTERN.test(value);

const normalizeVideoId = (value: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return isValidYouTubeVideoId(trimmed) ? trimmed : null;
};

const getPathVideoId = (pathname: string) => {
  const segments = pathname
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === 'embed' || segments[0] === 'shorts') {
    return normalizeVideoId(segments[1] ?? null);
  }

  return normalizeVideoId(segments[0]);
};

export type YouTubeVideoDetails = {
  videoId: string;
  normalizedUrl: string;
  isShort: boolean;
};

export const extractYouTubeVideoId = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.trim().toLowerCase();

    if (!YOUTUBE_HOSTS.has(hostname)) {
      return null;
    }

    if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
      return getPathVideoId(url.pathname);
    }

    if (url.pathname === '/watch') {
      return normalizeVideoId(url.searchParams.get('v'));
    }

    return getPathVideoId(url.pathname);
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
    const hostname = url.hostname.trim().toLowerCase();

    if (!YOUTUBE_HOSTS.has(hostname)) {
      return null;
    }

    const segments = url.pathname
      .split('/')
      .map((segment) => segment.trim().toLowerCase())
      .filter(Boolean);
    const videoId = extractYouTubeVideoId(trimmed);

    if (!videoId) {
      return null;
    }

    const isShort =
      hostname !== 'youtu.be' &&
      hostname !== 'www.youtu.be' &&
      segments[0] === 'shorts';

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

export const getYouTubeThumbnailCandidates = (videoId: string) => {
  const normalizedVideoId = normalizeVideoId(videoId);

  if (!normalizedVideoId) {
    return [];
  }

  return [
    `https://img.youtube.com/vi/${normalizedVideoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${normalizedVideoId}/hqdefault.jpg`,
  ];
};
