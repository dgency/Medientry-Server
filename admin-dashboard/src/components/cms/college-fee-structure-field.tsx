import { ArrowDown, ArrowUp, Calculator, Plus, Trash2 } from 'lucide-react';

import {
  feeAmountFieldLayoutClassName,
  formatFeeCurrency,
  multiplyDecimalValues,
} from '../../lib/fee-currency';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

type BillingPeriod =
  | 'total'
  | 'one_time'
  | 'admission'
  | 'installment'
  | 'monthly'
  | 'yearly'
  | 'custom';

type CollegeFeeItemValue = {
  id?: string | null;
  label: string;
  amountUsd: number | null;
  amountInr: number | null;
  billingPeriod: BillingPeriod;
  description: string | null;
  sortOrder: number;
  isTotal: boolean;
  isActive: boolean;
};

type FeeSettingsValue = {
  exchangeRateUsdToInr: number | null;
  showExchangeRateNote: boolean;
  feeNote: string | null;
};

type CollegeFeeStructureValue = {
  feeStructure: CollegeFeeItemValue[];
  feeSettings: FeeSettingsValue;
};

type CollegeFeeStructureFieldProps = {
  value: unknown;
  onChange: (value: CollegeFeeStructureValue) => void;
};

const billingPeriodOptions: Array<{ label: string; value: BillingPeriod }> = [
  { label: 'Total', value: 'total' },
  { label: 'One-Time', value: 'one_time' },
  { label: 'Admission', value: 'admission' },
  { label: 'Installment', value: 'installment' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom', value: 'custom' },
];

const buildDefaultFeeItems = (): CollegeFeeItemValue[] => [
  {
    label: 'Total Tuition Fees (Including 1-Year Internship)',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'total',
    description: null,
    sortOrder: 1,
    isTotal: true,
    isActive: true,
  },
  {
    label: 'Seat Booking Amount',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'one_time',
    description: null,
    sortOrder: 2,
    isTotal: false,
    isActive: true,
  },
  {
    label: 'Pay During Admission',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'admission',
    description: null,
    sortOrder: 3,
    isTotal: false,
    isActive: true,
  },
  {
    label: 'Remaining Amount (Pay in 5 Years)',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'installment',
    description: null,
    sortOrder: 4,
    isTotal: false,
    isActive: true,
  },
  {
    label: 'AC Hostel + Food (Per Month)',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'monthly',
    description: null,
    sortOrder: 5,
    isTotal: false,
    isActive: true,
  },
];

const defaultFeeSettings = (): FeeSettingsValue => ({
  exchangeRateUsdToInr: null,
  showExchangeRateNote: false,
  feeNote: null,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeItems = (value: unknown): CollegeFeeItemValue[] => {
  if (!Array.isArray(value)) {
    return buildDefaultFeeItems();
  }

  const items = value
    .map((item, index): CollegeFeeItemValue | null => {
      if (!isRecord(item)) {
        return null;
      }

      const billingPeriod = billingPeriodOptions.some(
        (option) => option.value === item.billingPeriod,
      )
        ? (item.billingPeriod as BillingPeriod)
        : 'custom';

      return {
        id: typeof item.id === 'string' ? item.id : null,
        label: typeof item.label === 'string' ? item.label : '',
        amountUsd: readNumber(item.amountUsd),
        amountInr: readNumber(item.amountInr),
        billingPeriod,
        description:
          typeof item.description === 'string' ? item.description : null,
        sortOrder:
          typeof item.sortOrder === 'number' && Number.isFinite(item.sortOrder)
            ? item.sortOrder
            : index + 1,
        isTotal: item.isTotal === true,
        isActive: item.isActive !== false,
      };
    })
    .filter((item): item is CollegeFeeItemValue => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));

  if (items.length === 0) {
    return buildDefaultFeeItems();
  }

  if (!items.some((item) => item.isTotal)) {
    items[0] = {
      ...items[0],
      isTotal: true,
    };
  }

  return items;
};

const normalizeSettings = (value: unknown): FeeSettingsValue => {
  if (!isRecord(value)) {
    return defaultFeeSettings();
  }

  return {
    exchangeRateUsdToInr: readNumber(value.exchangeRateUsdToInr),
    showExchangeRateNote: value.showExchangeRateNote === true,
    feeNote: typeof value.feeNote === 'string' ? value.feeNote : null,
  };
};

const normalizeValue = (value: unknown): CollegeFeeStructureValue => {
  if (!isRecord(value)) {
    return {
      feeStructure: buildDefaultFeeItems(),
      feeSettings: defaultFeeSettings(),
    };
  }

  return {
    feeStructure: normalizeItems(value.feeStructure),
    feeSettings: normalizeSettings(value.feeSettings),
  };
};

const withNormalizedOrder = (items: CollegeFeeItemValue[]) =>
  items.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));

const parseNullableNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function CollegeFeeStructureField({
  value,
  onChange,
}: CollegeFeeStructureFieldProps) {
  const normalizedValue = normalizeValue(value);
  const items = normalizedValue.feeStructure;
  const settings = normalizedValue.feeSettings;

  const updateValue = (nextValue: Partial<CollegeFeeStructureValue>) => {
    onChange({
      feeStructure: nextValue.feeStructure ?? items,
      feeSettings: nextValue.feeSettings ?? settings,
    });
  };

  const updateItems = (nextItems: CollegeFeeItemValue[]) => {
    updateValue({
      feeStructure: withNormalizedOrder(nextItems),
    });
  };

  const updateItem = (
    index: number,
    patch: Partial<CollegeFeeItemValue>,
  ) => {
    const nextItems = items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );

    updateItems(nextItems);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    const [item] = nextItems.splice(index, 1);
    nextItems.splice(nextIndex, 0, item);
    updateItems(nextItems);
  };

  const removeItem = (index: number) => {
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);

    if (nextItems.length > 0 && !nextItems.some((item) => item.isTotal)) {
      nextItems[0] = {
        ...nextItems[0],
        isTotal: true,
      };
    }

    updateItems(nextItems);
  };

  const addItem = () => {
    updateItems([
      ...items,
      {
        label: '',
        amountUsd: null,
        amountInr: null,
        billingPeriod: 'custom',
        description: null,
        sortOrder: items.length + 1,
        isTotal: false,
        isActive: true,
      },
    ]);
  };

  const updateSettings = (patch: Partial<FeeSettingsValue>) => {
    updateValue({
      feeSettings: {
        ...settings,
        ...patch,
      },
    });
  };

  const calculateInrAmount = (index: number) => {
    const amountInr = multiplyDecimalValues(
      items[index]?.amountUsd,
      settings.exchangeRateUsdToInr,
    );

    if (amountInr == null) {
      return;
    }

    updateItem(index, { amountInr });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Fee Structure</p>
          <p className="text-sm text-muted-foreground">
            Manage editable USD and INR fee rows, order, and public visibility.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Add fee component
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const canCalculateInr =
            item.amountUsd != null &&
            settings.exchangeRateUsdToInr != null &&
            settings.exchangeRateUsdToInr > 0;

          return (
            <div
              key={`${item.id ?? 'new'}-${item.sortOrder}-${index}`}
              className="rounded-2xl border border-border/70 bg-muted/20 p-4"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Row {index + 1}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saved order: {item.sortOrder}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Fee Component Title</Label>
                  <Input
                    value={item.label}
                    onChange={(event) =>
                      updateItem(index, { label: event.target.value })
                    }
                    placeholder="Total Tuition Fees (Including 1-Year Internship)"
                  />
                </div>

                <div className={feeAmountFieldLayoutClassName}>
                  <div className="space-y-2">
                    <Label>Amount (USD)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={item.amountUsd ?? ''}
                      onChange={(event) =>
                        updateItem(index, {
                          amountUsd: parseNullableNumber(event.target.value),
                        })
                      }
                      placeholder="48000"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Amount (INR)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => calculateInrAmount(index)}
                        disabled={!canCalculateInr}
                      >
                        <Calculator className="h-4 w-4" />
                        Calculate INR
                      </Button>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={item.amountInr ?? ''}
                      onChange={(event) =>
                        updateItem(index, {
                          amountInr: parseNullableNumber(event.target.value),
                        })
                      }
                      placeholder="4050000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter manually, or calculate from the rate below.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Billing Period</Label>
                  <select
                    value={item.billingPeriod}
                    onChange={(event) =>
                      updateItem(index, {
                        billingPeriod: event.target.value as BillingPeriod,
                      })
                    }
                    className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {billingPeriodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    value={item.description ?? ''}
                    onChange={(event) =>
                      updateItem(index, {
                        description: event.target.value || null,
                      })
                    }
                    placeholder="Optional note about how or when this component is billed."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Main Total</Label>
                  <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
                    <Switch
                      checked={item.isTotal}
                      onCheckedChange={(checked) => {
                        const nextItems = items.map((currentItem, currentIndex) => ({
                          ...currentItem,
                          isTotal:
                            checked === true
                              ? currentIndex === index
                              : currentIndex === index
                                ? false
                                : currentItem.isTotal,
                        }));
                        updateItems(nextItems);
                      }}
                    />
                    <span className="ml-3 text-sm text-muted-foreground">
                      {item.isTotal ? 'Highlighted total row' : 'Normal row'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Active</Label>
                  <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
                    <Switch
                      checked={item.isActive}
                      onCheckedChange={(checked) =>
                        updateItem(index, { isActive: checked === true })
                      }
                    />
                    <span className="ml-3 text-sm text-muted-foreground">
                      {item.isActive ? 'Visible publicly' : 'Hidden publicly'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground">
            Exchange-Rate Note Settings
          </p>
          <p className="text-sm text-muted-foreground">
            Use a manual USD to INR rate only when you want to calculate an INR
            value or show a note on the public page.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Exchange Rate (USD to INR)</Label>
            <Input
              type="number"
              min={0}
              step="any"
              value={settings.exchangeRateUsdToInr ?? ''}
              onChange={(event) =>
                updateSettings({
                  exchangeRateUsdToInr: parseNullableNumber(event.target.value),
                })
              }
              placeholder="90"
            />
            <p className="text-xs text-muted-foreground">
              Current value:{' '}
              {settings.exchangeRateUsdToInr != null
                ? formatFeeCurrency(settings.exchangeRateUsdToInr, 'INR')
                : 'Not provided'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Show Exchange-Rate Note</Label>
            <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
              <Switch
                checked={settings.showExchangeRateNote}
                onCheckedChange={(checked) =>
                  updateSettings({ showExchangeRateNote: checked === true })
                }
              />
              <span className="ml-3 text-sm text-muted-foreground">
                {settings.showExchangeRateNote ? 'Note enabled' : 'Note hidden'}
              </span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Custom Fee Note</Label>
            <Textarea
              rows={3}
              value={settings.feeNote ?? ''}
              onChange={(event) =>
                updateSettings({
                  feeNote: event.target.value || null,
                })
              }
              placeholder="Leave blank to use the default exchange-rate note on the public page."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
