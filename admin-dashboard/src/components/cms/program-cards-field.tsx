import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

type ProgramCardItem = {
  title: string;
  duration: string;
  description: string;
  highlights: string[];
  sortOrder: number;
  isActive: boolean;
};

type ProgramCardsFieldProps = {
  value: unknown;
  onChange: (value: ProgramCardItem[]) => void;
  helperText: string;
};

const defaultCard = (): ProgramCardItem => ({
  title: '',
  duration: '',
  description: '',
  highlights: [],
  sortOrder: 1,
  isActive: true,
});

const normalizeCards = (value: unknown): ProgramCardItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): ProgramCardItem | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      return {
        title: typeof candidate.title === 'string' ? candidate.title : '',
        duration: typeof candidate.duration === 'string' ? candidate.duration : '',
        description: typeof candidate.description === 'string' ? candidate.description : '',
        highlights: Array.isArray(candidate.highlights)
          ? candidate.highlights.filter((highlight): highlight is string => typeof highlight === 'string')
          : [],
        sortOrder:
          typeof candidate.sortOrder === 'number' && Number.isFinite(candidate.sortOrder)
            ? candidate.sortOrder
            : index + 1,
        isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : true,
      };
    })
    .filter((item): item is ProgramCardItem => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
};

const withNormalizedOrder = (cards: ProgramCardItem[]) =>
  cards.map((card, index) => ({
    ...card,
    sortOrder: index + 1,
  }));

export function ProgramCardsField({
  value,
  onChange,
  helperText,
}: ProgramCardsFieldProps) {
  const cards = normalizeCards(value);

  const updateCards = (nextCards: ProgramCardItem[]) => {
    onChange(withNormalizedOrder(nextCards));
  };

  const updateCard = (index: number, patch: Partial<ProgramCardItem>) => {
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
          Add program
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          No programs yet. Add a program to populate this section.
        </div>
      ) : null}

      <div className="space-y-4">
        {cards.map((card, index) => (
          <div key={`${card.sortOrder}-${index}`} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Program {index + 1}</p>
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
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={card.title} onChange={(event) => updateCard(index, { title: event.target.value })} placeholder="MBBS in Georgia" />
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Input value={card.duration} onChange={(event) => updateCard(index, { duration: event.target.value })} placeholder="6 Years" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={card.description}
                  onChange={(event) => updateCard(index, { description: event.target.value })}
                  placeholder="Program overview for the card."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Highlights</Label>
                <Textarea
                  rows={4}
                  value={card.highlights.join('\n')}
                  onChange={(event) =>
                    updateCard(index, {
                      highlights: event.target.value
                        .split('\n')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={'WHO & NMC Recognized\nEnglish Medium\nHands-on Clinical Training'}
                />
                <p className="text-xs text-muted-foreground">
                  Add one highlight per line.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
                  <Switch checked={card.isActive} onCheckedChange={(checked) => updateCard(index, { isActive: checked === true })} />
                  <span className="ml-3 text-sm text-muted-foreground">{card.isActive ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
