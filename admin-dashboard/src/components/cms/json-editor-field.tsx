import { Braces, Eye, RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { isRecord, parseJsonTextareaValue } from '../../lib/utils';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

type JsonEditorFieldProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

const summarizeJsonValue = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.slice(0, 5).map((item, index) => `${index + 1}. ${typeof item === 'string' ? item : JSON.stringify(item)}`);
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .slice(0, 6)
      .map(([key, item]) => `${key}: ${typeof item === 'string' ? item : JSON.stringify(item)}`);
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [String(value)];
};

export function JsonEditorField({
  value,
  onChange,
  rows = 10,
  placeholder,
}: JsonEditorFieldProps) {
  const [showPreview, setShowPreview] = useState(false);

  const parsedValue = useMemo(() => {
    try {
      return value.trim() ? parseJsonTextareaValue(value) : null;
    } catch {
      return undefined;
    }
  }, [value]);

  const previewItems = useMemo(() => summarizeJsonValue(parsedValue), [parsedValue]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            try {
              const formatted = value.trim() ? JSON.stringify(parseJsonTextareaValue(value), null, 2) : '';
              onChange(formatted);
            } catch {
              return;
            }
          }}
        >
          <RefreshCcw className="h-4 w-4" />
          Format JSON
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview((current) => !current)}>
          {showPreview ? <Braces className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Hide preview' : 'Preview blocks'}
        </Button>
      </div>

      <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} placeholder={placeholder} />

      {showPreview ? (
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          {parsedValue === undefined ? (
            <p className="text-sm text-destructive">JSON preview unavailable until the content is valid.</p>
          ) : previewItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocks to preview yet.</p>
          ) : (
            <div className="space-y-2">
              {previewItems.map((item) => (
                <div key={item} className="rounded-xl bg-white px-3 py-2 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
