import assert from 'node:assert/strict';
import test from 'node:test';

import { updateSiteSettingSchema } from '../src/validations/site-setting.validation';

test('site settings accepts string exchange-rate inputs and normalizes booleans', () => {
  const result = updateSiteSettingSchema.safeParse({
    body: {
      exchangeRateUsdToInr: '91.75',
      showExchangeRateNote: 'true',
      customExchangeRateNote: '  Indicative INR conversion only.  ',
    },
  });

  assert.equal(result.success, true);

  if (!result.success) {
    return;
  }

  assert.equal(result.data.body.exchangeRateUsdToInr, 91.75);
  assert.equal(result.data.body.showExchangeRateNote, true);
  assert.equal(
    result.data.body.customExchangeRateNote,
    'Indicative INR conversion only.',
  );
});

test('site settings rejects the exchange-rate note toggle when no valid rate is provided', () => {
  const result = updateSiteSettingSchema.safeParse({
    body: {
      exchangeRateUsdToInr: '',
      showExchangeRateNote: 'true',
    },
  });

  assert.equal(result.success, false);

  if (result.success) {
    return;
  }

  assert.match(
    JSON.stringify(result.error.issues),
    /valid USD-to-INR exchange rate/i,
  );
});
