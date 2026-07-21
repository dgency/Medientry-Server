const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

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

export const getYouTubeThumbnailUrls = (videoId: string) => {
  const normalizedVideoId = normalizeVideoId(videoId);

  if (!normalizedVideoId) {
    return [];
  }

  return [
    `https://i.ytimg.com/vi/${normalizedVideoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${normalizedVideoId}/hqdefault.jpg`,
  ];
};

export const getYouTubeEmbedUrl = (videoId: string, autoplay = false) => {
  const normalizedVideoId = normalizeVideoId(videoId);

  if (!normalizedVideoId) {
    return null;
  }

  const searchParams = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    cc_load_policy: '0',
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
  });

  return `https://www.youtube-nocookie.com/embed/${normalizedVideoId}?${searchParams.toString()}`;
};
