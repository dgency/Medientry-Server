import assert from 'node:assert/strict';
import test from 'node:test';

import { MediaKind } from '@prisma/client';

import { buildPublicMediaUrl, detectMediaKind, normalizeStoredMediaValue } from '../src/utils/media';

test('normalizeStoredMediaValue repairs legacy upload and public asset paths', () => {
  assert.equal(
    normalizeStoredMediaValue('F:\\Custom Coding Project\\Medientry LiveSite\\Medientry-Server\\uploads\\images\\photo.jpg'),
    '/uploads/images/photo.jpg',
  );
  assert.equal(
    normalizeStoredMediaValue('public/images/hero-campus-students.jpeg'),
    '/images/hero-campus-students.jpeg',
  );
  assert.equal(
    normalizeStoredMediaValue('\\uploads\\images\\vector.svg'),
    '/uploads/images/vector.svg',
  );
});

test('buildPublicMediaUrl maps upload and legacy frontend assets to the backend public origin', () => {
  assert.equal(
    buildPublicMediaUrl('/uploads/images/photo.jpg', {
      backendBaseUrl: 'http://localhost:5000',
      frontendBaseUrl: 'http://localhost:3000',
    }),
    'http://localhost:5000/uploads/images/photo.jpg',
  );
  assert.equal(
    buildPublicMediaUrl('/images/hero-campus-students.jpeg', {
      backendBaseUrl: 'http://localhost:5000',
      frontendBaseUrl: 'http://localhost:3000',
    }),
    'http://localhost:5000/images/hero-campus-students.jpeg',
  );
});

test('detectMediaKind distinguishes svg, image, video, document, and unknown', () => {
  assert.equal(detectMediaKind('image/svg+xml', 'file.svg'), MediaKind.SVG);
  assert.equal(detectMediaKind('image/jpeg', 'file.jpg'), MediaKind.IMAGE);
  assert.equal(detectMediaKind('video/mp4', 'file.mp4'), MediaKind.VIDEO);
  assert.equal(detectMediaKind('application/pdf', 'file.pdf'), MediaKind.DOCUMENT);
  assert.equal(detectMediaKind('application/octet-stream', 'file.bin'), MediaKind.UNKNOWN);
});
