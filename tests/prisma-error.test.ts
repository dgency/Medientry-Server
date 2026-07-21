import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library';

import { mapPrismaErrorToHttp } from '../src/utils/prisma-error';

const createKnownRequestError = (code: string, meta?: Record<string, unknown>) =>
  Object.assign(Object.create(PrismaClientKnownRequestError.prototype), {
    code,
    meta,
    clientVersion: 'test',
    message: `Prisma known error ${code}`,
  }) as PrismaClientKnownRequestError;

const createInitializationError = (errorCode: string, message: string) =>
  Object.assign(Object.create(PrismaClientInitializationError.prototype), {
    errorCode,
    clientVersion: 'test',
    message,
  }) as PrismaClientInitializationError;

test('maps missing database columns to HTTP 500 with Prisma code P2022', () => {
  const result = mapPrismaErrorToHttp(
    createKnownRequestError('P2022', {
      modelName: 'ConsultationLead',
      column: 'trackingNumber',
    }),
  );

  assert.ok(result);
  assert.equal(result.statusCode, 500);
  assert.equal(result.code, 'P2022');
  assert.equal(result.message, 'A required database column is missing.');
  assert.deepEqual(result.diagnostics, {
    prismaCode: 'P2022',
    modelName: 'ConsultationLead',
    column: 'trackingNumber',
  });
});

test('maps duplicate database values to HTTP 409 with Prisma code P2002', () => {
  const result = mapPrismaErrorToHttp(
    createKnownRequestError('P2002', {
      target: ['trackingId'],
    }),
  );

  assert.ok(result);
  assert.equal(result.statusCode, 409);
  assert.equal(result.code, 'P2002');
  assert.equal(result.message, 'A record with this value already exists.');
  assert.deepEqual(result.diagnostics, {
    prismaCode: 'P2002',
    target: ['trackingId'],
  });
});

test('maps Prisma initialization connectivity failures to HTTP 503', () => {
  const result = mapPrismaErrorToHttp(
    createInitializationError(
      'P1001',
      "Can't reach database server at db.example.internal:25060",
    ),
  );

  assert.ok(result);
  assert.equal(result.statusCode, 503);
  assert.equal(result.code, 'P1001');
  assert.equal(result.message, 'Database connection is currently unavailable.');
});
