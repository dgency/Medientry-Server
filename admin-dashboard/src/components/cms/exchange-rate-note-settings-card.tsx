import { formatFeeCurrency } from '../../lib/fee-currency';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

export type ExchangeRateNoteSettingsValue = {
  exchangeRateUsdToInr: number | null;
  showExchangeRateNote: boolean;
  customExchangeRateNote: string | null;
  exchangeRateUpdatedAt: string | null;
};

type ExchangeRateNoteSettingsCardProps = {
  value: ExchangeRateNoteSettingsValue;
  onChange: (value: ExchangeRateNoteSettingsValue) => void;
  currentSavedExchangeRateUsdToInr?: number | null;
  showMissingRateWarning?: boolean;
};

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

const readString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const defaultExchangeRateNoteSettingsValue =
  (): ExchangeRateNoteSettingsValue => ({
    exchangeRateUsdToInr: null,
    showExchangeRateNote: false,
    customExchangeRateNote: null,
    exchangeRateUpdatedAt: null,
  });

export const normalizeExchangeRateNoteSettingsValue = (
  value: unknown,
): ExchangeRateNoteSettingsValue => {
  if (!isRecord(value)) {
    return defaultExchangeRateNoteSettingsValue();
  }

  return {
    exchangeRateUsdToInr: readNumber(value.exchangeRateUsdToInr),
    showExchangeRateNote:
      value.showExchangeRateNote === true || value.showExchangeRateNote === 'true',
    customExchangeRateNote:
      readString(value.customExchangeRateNote) ?? readString(value.feeNote),
    exchangeRateUpdatedAt: readString(value.exchangeRateUpdatedAt),
  };
};

export const parseNullableNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function ExchangeRateNoteSettingsCard({
  value,
  onChange,
  currentSavedExchangeRateUsdToInr,
  showMissingRateWarning = false,
}: ExchangeRateNoteSettingsCardProps) {
  const savedExchangeRateUsdToInr =
    currentSavedExchangeRateUsdToInr ?? value.exchangeRateUsdToInr;
  const hasValidExchangeRate =
    value.exchangeRateUsdToInr != null && value.exchangeRateUsdToInr > 0;

  return (
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
            value={value.exchangeRateUsdToInr ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                exchangeRateUsdToInr: parseNullableNumber(event.target.value),
              })
            }
            placeholder="90"
          />
          <p className="text-xs text-muted-foreground">
            Current value:{' '}
            {savedExchangeRateUsdToInr != null
              ? formatFeeCurrency(savedExchangeRateUsdToInr, 'INR')
              : 'Not provided'}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Show Exchange-Rate Note</Label>
          <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
            <Switch
              checked={value.showExchangeRateNote}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  showExchangeRateNote: checked === true,
                })
              }
            />
            <span className="ml-3 text-sm text-muted-foreground">
              {value.showExchangeRateNote ? 'Note visible' : 'Note hidden'}
            </span>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Custom Fee Note</Label>
          <Textarea
            rows={3}
            value={value.customExchangeRateNote ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                customExchangeRateNote: event.target.value || null,
              })
            }
            placeholder="Leave blank to use the default exchange-rate note on the public page."
          />
        </div>
      </div>

      {showMissingRateWarning && !hasValidExchangeRate ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            Add a valid USD-to-INR exchange rate to enable INR calculations.
          </p>
        </div>
      ) : null}
    </div>
  );
}
