import { formatFeeCurrency } from '../../lib/fee-currency';
import { formatDateTime } from '../../lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

type ExchangeRateNoteSettingsCardProps = {
  exchangeRateUsdToInr: string;
  showExchangeRateNote: boolean;
  customExchangeRateNote: string;
  exchangeRateUpdatedAt?: string | null;
  warningMessage?: string | null;
  onExchangeRateChange: (value: string) => void;
  onShowExchangeRateNoteChange: (value: boolean) => void;
  onCustomExchangeRateNoteChange: (value: string) => void;
};

const readNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function ExchangeRateNoteSettingsCard({
  exchangeRateUsdToInr,
  showExchangeRateNote,
  customExchangeRateNote,
  exchangeRateUpdatedAt,
  warningMessage,
  onExchangeRateChange,
  onShowExchangeRateNoteChange,
  onCustomExchangeRateNoteChange,
}: ExchangeRateNoteSettingsCardProps) {
  const exchangeRateValue = readNumber(exchangeRateUsdToInr);

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">
          Exchange-Rate Note Settings
        </p>
        <p className="text-sm text-muted-foreground">
          Use one global USD to INR rate for public fee calculations and the
          shared exchange-rate note.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="exchangeRateUsdToInr">Exchange Rate (USD to INR)</Label>
          <Input
            id="exchangeRateUsdToInr"
            type="number"
            min={0}
            step="any"
            value={exchangeRateUsdToInr}
            onChange={(event) => onExchangeRateChange(event.target.value)}
            placeholder="90"
          />
          <p className="text-xs text-muted-foreground">
            Current value:{' '}
            {exchangeRateValue != null
              ? formatFeeCurrency(exchangeRateValue, 'INR')
              : 'Not provided'}
          </p>
          <p className="text-xs text-muted-foreground">
            Last updated: {formatDateTime(exchangeRateUpdatedAt)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="showExchangeRateNote">Show Exchange-Rate Note</Label>
          <div
            id="showExchangeRateNote"
            className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3"
          >
            <Switch
              checked={showExchangeRateNote}
              onCheckedChange={(checked) =>
                onShowExchangeRateNoteChange(checked === true)
              }
            />
            <span className="ml-3 text-sm text-muted-foreground">
              {showExchangeRateNote ? 'Note visible' : 'Note hidden'}
            </span>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customExchangeRateNote">Custom Fee Note</Label>
          <Textarea
            id="customExchangeRateNote"
            rows={3}
            value={customExchangeRateNote}
            onChange={(event) =>
              onCustomExchangeRateNoteChange(event.target.value)
            }
            placeholder="Leave blank to use the default exchange-rate note on the public page."
          />
        </div>
      </div>

      {warningMessage ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {warningMessage}
        </div>
      ) : null}
    </div>
  );
}
