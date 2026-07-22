import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { FileUploadField } from './file-upload-field';

type FeatureCardItem = {
  icon: string;
  title: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

type FeatureCardsFieldProps = {
  value: unknown;
  onChange: (value: FeatureCardItem[]) => void;
  helperText: string;
};

const defaultCard = (): FeatureCardItem => ({
  icon: '',
  title: '',
  description: '',
  sortOrder: 1,
  isActive: true,
});

const normalizeCards = (value: unknown): FeatureCardItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): FeatureCardItem | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      return {
        icon: typeof candidate.icon === 'string' ? candidate.icon : '',
        title: typeof candidate.title === 'string' ? candidate.title : '',
        description: typeof candidate.description === 'string' ? candidate.description : '',
        sortOrder:
          typeof candidate.sortOrder === 'number' && Number.isFinite(candidate.sortOrder)
            ? candidate.sortOrder
            : index + 1,
        isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : true,
      };
    })
    .filter((item): item is FeatureCardItem => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
};

const withNormalizedOrder = (items: FeatureCardItem[]) =>
  items.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));

export function FeatureCardsField({
  value,
  onChange,
  helperText,
}: FeatureCardsFieldProps) {
  const cards = normalizeCards(value);

  const updateCards = (nextCards: FeatureCardItem[]) => {
    onChange(withNormalizedOrder(nextCards));
  };

  const updateCard = (index: number, patch: Partial<FeatureCardItem>) => {
    updateCards(cards.map((card, cardIndex) => (cardIndex === index ? { ...card, ...patch } : card)));
  };

  const moveCard = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= cards.length) {
      return;
    }

    const nextCards = [...cards];
    const [item] = nextCards.splice(index, 1);
    nextCards.splice(nextIndex, 0, item);
    updateCards(nextCards);
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
            updateCards([
              ...cards,
              {
                ...defaultCard(),
                sortOrder: cards.length + 1,
              },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          Add card
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          No cards yet. Add a card to populate this section.
        </div>
      ) : null}

      <div className="space-y-4">
        {cards.map((card, index) => (
          <div key={`${card.sortOrder}-${index}`} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Card {index + 1}</p>
                <p className="text-xs text-muted-foreground">Display order: {card.sortOrder}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => moveCard(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveCard(index, 1)} disabled={index === cards.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => updateCards(cards.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Icon</Label>
                <FileUploadField
                  value={card.icon}
                  onChange={(nextValue) => updateCard(index, { icon: nextValue })}
                  uploadKind="image"
                  placeholder="/home-page-icons/example.svg"
                  previewLabel="Preview icon"
                />
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={card.title} onChange={(event) => updateCard(index, { title: event.target.value })} placeholder="Trusted College Network" />
              </div>

              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
                  <Switch checked={card.isActive} onCheckedChange={(checked) => updateCard(index, { isActive: checked === true })} />
                  <span className="ml-3 text-sm text-muted-foreground">{card.isActive ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={card.description}
                  onChange={(event) => updateCard(index, { description: event.target.value })}
                  placeholder="Describe this card in simple user-friendly language."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
