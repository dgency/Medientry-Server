export type FeeCurrencyCode = 'USD' | 'INR';

export const feeAmountFieldLayoutClassName =
  'space-y-2 md:col-span-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0';

const toScaledInteger = (value: number | string) => {
  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    return null;
  }

  const isNegative = normalizedValue.startsWith('-');
  const unsignedValue = isNegative ? normalizedValue.slice(1) : normalizedValue;
  const [integerPart, decimalPart = ''] = unsignedValue.split('.');

  if (!/^\d+$/.test(integerPart || '0') || !/^\d*$/.test(decimalPart)) {
    return null;
  }

  const scale = decimalPart.length;
  const scaledValue = BigInt(`${integerPart || '0'}${decimalPart}`);

  return {
    scaledValue: isNegative ? -scaledValue : scaledValue,
    scale,
  };
};

export const multiplyDecimalValues = (
  firstValue: number | string | null | undefined,
  secondValue: number | string | null | undefined,
) => {
  if (
    firstValue === null ||
    firstValue === undefined ||
    secondValue === null ||
    secondValue === undefined
  ) {
    return null;
  }

  const parsedFirstValue = toScaledInteger(firstValue);
  const parsedSecondValue = toScaledInteger(secondValue);

  if (!parsedFirstValue || !parsedSecondValue) {
    return null;
  }

  const product = parsedFirstValue.scaledValue * parsedSecondValue.scaledValue;
  const scale = parsedFirstValue.scale + parsedSecondValue.scale;
  const divisor = BigInt(10) ** BigInt(scale);
  const hundred = BigInt(100);
  const halfDivisor = divisor / BigInt(2);
  const roundedProduct =
    (product * hundred + (product >= BigInt(0) ? halfDivisor : -halfDivisor)) /
    divisor;

  return Number(roundedProduct) / Number(hundred);
};

export const convertUsdToInr = (
  usdAmount: number | string | null | undefined,
  exchangeRate: number | string | null | undefined,
) => multiplyDecimalValues(usdAmount, exchangeRate);

export const formatFeeCurrency = (
  amount: number | null | undefined,
  currency: FeeCurrencyCode,
) => {
  if (
    amount === null ||
    amount === undefined ||
    Number.isNaN(amount) ||
    !Number.isFinite(amount)
  ) {
    return 'Not provided';
  }

  const formatter = new Intl.NumberFormat(
    currency === 'USD' ? 'en-US' : 'en-IN',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    },
  );

  return formatter.format(amount);
};
