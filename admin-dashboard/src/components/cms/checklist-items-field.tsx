import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

type ChecklistItem = {
  text: string;
  sortOrder: number;
  isActive: boolean;
};

type ChecklistItemsFieldProps = {
  value: unknown;
  onChange: (value: ChecklistItem[]) => void;
};

const normalizeItems = (value: unknown): ChecklistItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): ChecklistItem | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      return {
        text: typeof candidate.text === 'string' ? candidate.text : '',
        sortOrder:
          typeof candidate.sortOrder === 'number' && Number.isFinite(candidate.sortOrder)
            ? candidate.sortOrder
            : index + 1,
        isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : true,
      };
    })
    .filter((item): item is ChecklistItem => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
};

const withNormalizedOrder = (items: ChecklistItem[]) =>
  items.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));

export function ChecklistItemsField({
  value,
  onChange,
}: ChecklistItemsFieldProps) {
  const items = normalizeItems(value);

  const updateItems = (nextItems: ChecklistItem[]) => {
    onChange(withNormalizedOrder(nextItems));
  };

  const updateItem = (index: number, patch: Partial<ChecklistItem>) => {
    updateItems(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Manage the checklist bullets shown in the right column.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            updateItems([
              ...items,
              {
                text: '',
                sortOrder: items.length + 1,
                isActive: true,
              },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          No checklist items yet. Add an item to populate the list.
        </div>
      ) : null}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${item.sortOrder}-${index}`} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Checklist Item {index + 1}</p>
                <p className="text-xs text-muted-foreground">Display order: {item.sortOrder}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => updateItems(items.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <Label>Text</Label>
                <Input value={item.text} onChange={(event) => updateItem(index, { text: event.target.value })} placeholder="Clear explanation of why some colleges should be avoided" />
              </div>

              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
                  <Switch checked={item.isActive} onCheckedChange={(checked) => updateItem(index, { isActive: checked === true })} />
                  <span className="ml-3 text-sm text-muted-foreground">{item.isActive ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
