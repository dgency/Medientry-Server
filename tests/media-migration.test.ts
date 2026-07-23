import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  getLegacyUploadReference,
  resolveLegacyUploadAbsolutePath,
} from '../src/utils/media-migration';
import { normalizeStoredMediaValue } from '../src/utils/media-path';

test('normalizeStoredMediaValue converts old project upload URLs into stable legacy paths', () => {
  assert.equal(
    normalizeStoredMediaValue('https://medientrybd.com/uploads/images/example.webp'),
    '/uploads/images/example.webp',
  );
  assert.equal(
    normalizeStoredMediaValue('http://localhost:5000/uploads/documents/notice.pdf'),
    '/uploads/documents/notice.pdf',
  );
});

test('getLegacyUploadReference extracts the stable Spaces migration key from legacy values', () => {
  assert.deepEqual(
    getLegacyUploadReference('https://medientrybd.com/uploads/images/example.webp'),
    {
      normalizedPath: '/uploads/images/example.webp',
      relativeFilePath: 'images/example.webp',
      storageKey: 'uploads/images/example.webp',
      category: 'images',
    },
  );
});

test('resolveLegacyUploadAbsolutePath maps the configured uploads root to the actual local file path', () => {
  const reference = getLegacyUploadReference('/uploads/documents/test-file.pdf');

  assert.ok(reference);
  assert.equal(
    resolveLegacyUploadAbsolutePath('C:\\project\\uploads', reference),
    path.resolve('C:\\project\\uploads', 'documents', 'test-file.pdf'),
  );
});
