import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

type SeatAllocationItem = {
  country: string;
  mbbs: number | null;
  bds: number | null;
  sortOrder: number;
  isActive: boolean;
};

type SeatAllocationFieldProps = {
  value: unknown;
  onChange: (value: SeatAllocationItem[]) => void;
  helperText: string;
};

const defaultRow = (): SeatAllocationItem => ({
  country: '',
  mbbs: null,
  bds: null,
  sortOrder: 1,
  isActive: true,
});

const normalizeRows = (value: unknown): SeatAllocationItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): SeatAllocationItem | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      return {
        country: typeof candidate.country === 'string' ? candidate.country : '',
        mbbs:
          typeof candidate.mbbs === 'number' && Number.isFinite(candidate.mbbs)
            ? candidate.mbbs
            : null,
        bds:
          typeof candidate.bds === 'number' && Number.isFinite(candidate.bds)
            ? candidate.bds
            : null,
        sortOrder:
          typeof candidate.sortOrder === 'number' && Number.isFinite(candidate.sortOrder)
            ? candidate.sortOrder
            : index + 1,
        isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : true,
      };
    })
    .filter((item): item is SeatAllocationItem => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
};

const withNormalizedOrder = (rows: SeatAllocationItem[]) =>
  rows.map((row, index) => ({
    ...row,
    sortOrder: index + 1,
  }));

export function SeatAllocationField({
  value,
  onChange,
  helperText,
}: SeatAllocationFieldProps) {
  const rows = normalizeRows(value);

  const updateRows = (nextRows: SeatAllocationItem[]) => {
    onChange(withNormalizedOrder(nextRows));
  };

  const updateRow = (index: number, patch: Partial<SeatAllocationItem>) => {
    updateRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= rows.length) {
      return;
    }

    const nextRows = [...rows];
    const [item] = nextRows.splice(index, 1);
    nextRows.splice(nextIndex, 0, item);
    updateRows(nextRows);
  };

  const parseNumberInput = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{helperText}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            updateRows([
              ...rows,
              {
                ...defaultRow(),
                sortOrder: rows.length + 1,
              },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          Add row
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          No rows yet. Add a seat row to populate this table.
        </div>
      ) : null}

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={`${row.sortOrder}-${index}`} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Seat Row {index + 1}</p>
                <p className="text-xs text-muted-foreground">Display order: {row.sortOrder}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => moveRow(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => updateRows(rows.filter((_, rowIndex) => rowIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Country</Label>
                <Input value={row.country} onChange={(event) => updateRow(index, { country: event.target.value })} placeholder="India" />
              </div>

              <div className="space-y-2">
                <Label>MBBS Seats</Label>
                <Input
                  type="number"
                  min="0"
                  value={row.mbbs ?? ''}
                  onChange={(event) => updateRow(index, { mbbs: parseNumberInput(event.target.value) })}
                  placeholder="22"
                />
              </div>

              <div className="space-y-2">
                <Label>BDS Seats</Label>
                <Input
                  type="number"
                  min="0"
                  value={row.bds ?? ''}
                  onChange={(event) => updateRow(index, { bds: parseNumberInput(event.target.value) })}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
                  <Switch checked={row.isActive} onCheckedChange={(checked) => updateRow(index, { isActive: checked === true })} />
                  <span className="ml-3 text-sm text-muted-foreground">{row.isActive ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
