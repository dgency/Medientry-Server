import assert from 'node:assert/strict';
import test from 'node:test';

import type { Request } from 'express';

import { captureRequestClientInfo } from '../src/utils/request-client-info';

const createRequest = ({
  headers,
  ip,
  remoteAddress,
}: {
  headers?: Record<string, string>;
  ip?: string;
  remoteAddress?: string;
}) =>
  ({
    headers: headers ?? {},
    ip,
    socket: {
      remoteAddress,
    },
  }) as Request;

test('captureRequestClientInfo extracts proxy ip, geo headers, and desktop device info', () => {
  const request = createRequest({
    ip: '10.0.0.1',
    remoteAddress: '10.0.0.2',
    headers: {
      'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      'x-vercel-ip-city': 'Dhaka',
      'x-vercel-ip-country-region': 'Dhaka Division',
      'x-vercel-ip-country': 'BD',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    },
  });

  const result = captureRequestClientInfo(request);

  assert.equal(result.ipAddress, '203.0.113.10');
  assert.equal(result.ipLocation, 'Dhaka, Dhaka Division, BD');
  assert.equal(result.deviceType, 'Desktop');
  assert.equal(result.deviceLabel, 'Desktop • Windows • Chrome');
});

test('captureRequestClientInfo normalizes localhost ip and mobile user agents', () => {
  const request = createRequest({
    ip: '::1',
    headers: {
      'cf-ipcountry': 'IN',
      'user-agent':
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
    },
  });

  const result = captureRequestClientInfo(request);

  assert.equal(result.ipAddress, '127.0.0.1');
  assert.equal(result.ipLocation, 'IN');
  assert.equal(result.deviceType, 'Mobile');
  assert.equal(result.deviceLabel, 'Mobile • Android • Chrome');
});
