import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { FileUploadField } from './file-upload-field';

type MediaGalleryListFieldProps = {
  value: unknown;
  onChange: (value: string[]) => void;
};

const normalizeItems = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

export function MediaGalleryListField({
  value,
  onChange,
}: MediaGalleryListFieldProps) {
  const items = normalizeItems(value);

  const updateItem = (index: number, nextValue: string) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? nextValue : item)));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    const [item] = nextItems.splice(index, 1);
    nextItems.splice(nextIndex, 0, item);
    onChange(nextItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Manage gallery images in display order. Each row stores one media URL in the existing JSON array.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ''])}>
          <Plus className="h-4 w-4" />
          Add image
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          No gallery images yet. Add an image to populate the gallery.
        </div>
      ) : null}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${index}-${item}`} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Gallery Image {index + 1}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <FileUploadField
                value={item}
                onChange={(nextValue) => updateItem(index, nextValue)}
                uploadKind="image"
                previewLabel="Preview gallery image"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
