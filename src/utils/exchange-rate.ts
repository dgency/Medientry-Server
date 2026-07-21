export type ExchangeRateSettings = {
  exchangeRateUsdToInr: number | null;
  showExchangeRateNote: boolean;
  customExchangeRateNote: string | null;
  exchangeRateUpdatedAt: string | null;
};

export const convertUsdToInr = (
  usdAmount: number | null | undefined,
  exchangeRate: number | null | undefined,
) => {
  if (
    typeof usdAmount !== 'number' ||
    !Number.isFinite(usdAmount) ||
    typeof exchangeRate !== 'number' ||
    !Number.isFinite(exchangeRate) ||
    exchangeRate <= 0
  ) {
    return null;
  }

  return Number((usdAmount * exchangeRate).toFixed(2));
};

export const getDefaultExchangeRateSettings = (): ExchangeRateSettings => ({
  exchangeRateUsdToInr: null,
  showExchangeRateNote: false,
  customExchangeRateNote: null,
  exchangeRateUpdatedAt: null,
});
