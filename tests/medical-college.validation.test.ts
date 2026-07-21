import assert from 'node:assert/strict';
import test from 'node:test';

import { updateMedicalCollegeSchema } from '../src/validations/medical-college.validation';

test('medical college updates ignore legacy fee row ids and keep valid text fields', () => {
  const result = updateMedicalCollegeSchema.safeParse({
    params: {
      id: '976daa09-0d88-48b3-a0d0-defe0e8c98b1',
    },
    body: {
      name: 'Updated College Name',
      feeStructure: [
        {
          id: '03003ae8-099e-ff57-201e-cd2353f03887',
          label: 'Legacy Tuition Fee',
          amountUsd: 48000,
          amountInr: 4050000,
          billingPeriod: 'total',
          description: null,
          sortOrder: 1,
          isTotal: true,
          isActive: true,
        },
      ],
    },
  });

  assert.equal(result.success, true);

  if (!result.success) {
    return;
  }

  assert.equal(result.data.body.name, 'Updated College Name');
  assert.deepEqual(result.data.body.feeStructure, [
    {
      label: 'Legacy Tuition Fee',
      amountUsd: 48000,
      amountInr: 4050000,
      billingPeriod: 'total',
      description: null,
      sortOrder: 1,
      isTotal: true,
      isActive: true,
    },
  ]);
});
