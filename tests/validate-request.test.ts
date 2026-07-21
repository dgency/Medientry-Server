import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';

import { validateRequest } from '../src/middlewares/validate-request';

test('validateRequest validates body, query, and params in the correct request sections', () => {
  const middleware = validateRequest(
    z.object({
      body: z.object({
        name: z.string().min(1),
      }),
      query: z.object({
        page: z.coerce.number().int().positive(),
      }),
      params: z.object({
        id: z.string().uuid(),
      }),
    }),
  );

  const req = {
    body: { name: 'Updated Name' },
    query: { page: '2' },
    params: { id: '976daa09-0d88-48b3-a0d0-defe0e8c98b1' },
  } as Parameters<ReturnType<typeof validateRequest>>[0];

  let nextCalled = false;

  middleware(req, {} as Parameters<ReturnType<typeof validateRequest>>[1], () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.body, { name: 'Updated Name' });
  assert.deepEqual(req.query, { page: 2 });
  assert.deepEqual(req.params, { id: '976daa09-0d88-48b3-a0d0-defe0e8c98b1' });
});
