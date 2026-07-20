import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrls,
  getYouTubeVideoDetails,
} from '../src/utils/youtube';

const regularVideoId = 'dQw4w9WgXcQ';
const shortsVideoId = '9bZkp7q19f0';

test('extractYouTubeVideoId supports regular watch URLs with extra parameters', () => {
  assert.equal(
    extractYouTubeVideoId(`https://www.youtube.com/watch?v=${regularVideoId}&feature=shared`),
    regularVideoId,
  );
});

test('extractYouTubeVideoId supports youtu.be short URLs', () => {
  assert.equal(extractYouTubeVideoId(`https://youtu.be/${regularVideoId}?si=abc123`), regularVideoId);
});

test('extractYouTubeVideoId supports YouTube shorts URLs', () => {
  assert.equal(extractYouTubeVideoId(`https://www.youtube.com/shorts/${shortsVideoId}`), shortsVideoId);
});

test('extractYouTubeVideoId supports YouTube embed URLs', () => {
  assert.equal(extractYouTubeVideoId(`https://www.youtube.com/embed/${regularVideoId}`), regularVideoId);
});

test('extractYouTubeVideoId rejects invalid or non-YouTube URLs', () => {
  assert.equal(extractYouTubeVideoId('https://vimeo.com/123456789'), null);
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch?v=bad-id'), null);
});

test('getYouTubeVideoDetails normalizes watch URLs and preserves shorts layout detection', () => {
  assert.deepEqual(getYouTubeVideoDetails(`https://www.youtube.com/watch?v=${regularVideoId}`), {
    videoId: regularVideoId,
    normalizedUrl: `https://www.youtube.com/watch?v=${regularVideoId}`,
    isShort: false,
  });

  assert.deepEqual(getYouTubeVideoDetails(`https://www.youtube.com/shorts/${shortsVideoId}?feature=share`), {
    videoId: shortsVideoId,
    normalizedUrl: `https://www.youtube.com/shorts/${shortsVideoId}`,
    isShort: true,
  });
});

test('getYouTubeThumbnailUrls returns maxres and hq fallbacks', () => {
  assert.deepEqual(getYouTubeThumbnailUrls(regularVideoId), [
    `https://img.youtube.com/vi/${regularVideoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${regularVideoId}/hqdefault.jpg`,
  ]);
});

test('getYouTubeEmbedUrl builds the privacy-enhanced autoplay URL', () => {
  assert.equal(
    getYouTubeEmbedUrl(regularVideoId, true),
    `https://www.youtube-nocookie.com/embed/${regularVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
  );
});
