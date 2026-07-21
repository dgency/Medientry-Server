import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';

import { buildZodErrorDetails } from '../src/utils/zod-error';

test('buildZodErrorDetails preserves nested body field paths', () => {
  const schema = z.object({
    body: z.object({
      feeStructure: z.array(
        z.object({
          id: z.string().uuid(),
        }),
      ),
    }),
  });

  const result = schema.safeParse({
    body: {
      feeStructure: [
        { id: 'not-a-uuid' },
      ],
    },
  });

  assert.equal(result.success, false);

  if (result.success) {
    return;
  }

  assert.deepEqual(buildZodErrorDetails(result.error), {
    fieldErrors: {
      'feeStructure.0.id': ['Invalid UUID'],
    },
    formErrors: [],
  });
});
