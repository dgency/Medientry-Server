import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

type ContactOfficeItem = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  googleMapsUrl: string;
};

type ContactOfficesFieldProps = {
  value: unknown;
  onChange: (value: ContactOfficeItem[]) => void;
};

const defaultOffice = (index: number): ContactOfficeItem => ({
  id: `office-${index + 1}`,
  name: '',
  address: '',
  phone: '',
  email: '',
  googleMapsUrl: '',
});

const normalizeAddress = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  if (!Array.isArray(value)) {
    return '';
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .join('\n');
};

const normalizeOffices = (value: unknown): ContactOfficeItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): ContactOfficeItem | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const fallbackName =
        (typeof candidate.title === 'string' ? candidate.title : '') ||
        (typeof candidate.company === 'string' ? candidate.company : '');

      return {
        id:
          typeof candidate.id === 'string' && candidate.id.trim().length > 0
            ? candidate.id
            : `office-${index + 1}`,
        name:
          typeof candidate.name === 'string'
            ? candidate.name
            : fallbackName,
        address: normalizeAddress(candidate.address),
        phone: typeof candidate.phone === 'string' ? candidate.phone : '',
        email: typeof candidate.email === 'string' ? candidate.email : '',
        googleMapsUrl:
          typeof candidate.googleMapsUrl === 'string'
            ? candidate.googleMapsUrl
            : typeof candidate.googleMapsLink === 'string'
              ? candidate.googleMapsLink
              : '',
      };
    })
    .filter((item): item is ContactOfficeItem => Boolean(item))
    .map((office, index) => ({
      ...office,
      id: office.id.trim() || `office-${index + 1}`,
    }));
};

export function ContactOfficesField({
  value,
  onChange,
}: ContactOfficesFieldProps) {
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const offices = normalizeOffices(value);

  const updateOffices = (nextOffices: ContactOfficeItem[]) => {
    onChange(
      nextOffices.map((office, index) => ({
        ...office,
        id: office.id.trim() || `office-${index + 1}`,
      })),
    );
  };

  const updateOffice = (index: number, patch: Partial<ContactOfficeItem>) => {
    updateOffices(
      offices.map((office, officeIndex) =>
        officeIndex === index ? { ...office, ...patch } : office,
      ),
    );
  };

  const moveOffice = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= offices.length) {
      return;
    }

    const nextOffices = [...offices];
    const [item] = nextOffices.splice(index, 1);
    nextOffices.splice(nextIndex, 0, item);
    updateOffices(nextOffices);
  };

  const pendingOffice =
    pendingDeleteIndex !== null ? offices[pendingDeleteIndex] ?? null : null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Manage the office cards shown in the Contact page office section.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateOffices([...offices, defaultOffice(offices.length)])}
          >
            <Plus className="h-4 w-4" />
            Add Office
          </Button>
        </div>

        {offices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            No offices yet. Add an office to populate this section.
          </div>
        ) : null}

        <div className="space-y-4">
          {offices.map((office, index) => (
            <div
              key={`${office.id}-${index}`}
              className="rounded-2xl border border-border/70 bg-muted/20 p-4"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Office {index + 1}
                  </p>
                  <p className="text-xs text-muted-foreground">{office.id}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveOffice(index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveOffice(index, 1)}
                    disabled={index === offices.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingDeleteIndex(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Office Name</Label>
                  <Input
                    value={office.name}
                    onChange={(event) =>
                      updateOffice(index, { name: event.target.value })
                    }
                    placeholder="Dhaka Office"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Office Address</Label>
                  <Textarea
                    value={office.address}
                    onChange={(event) =>
                      updateOffice(index, { address: event.target.value })
                    }
                    rows={4}
                    placeholder="Complete office address"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={office.phone}
                    onChange={(event) =>
                      updateOffice(index, { phone: event.target.value })
                    }
                    placeholder="+880 1713 456 910"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={office.email}
                    onChange={(event) =>
                      updateOffice(index, { email: event.target.value })
                    }
                    placeholder="info@medientrybd.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Google Maps Link</Label>
                  <Input
                    value={office.googleMapsUrl}
                    onChange={(event) =>
                      updateOffice(index, { googleMapsUrl: event.target.value })
                    }
                    placeholder="https://www.google.com/maps/..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DeleteConfirmDialog
        open={pendingDeleteIndex !== null}
        title="Delete Office?"
        description="This office entry will be removed from the Contact page settings."
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteIndex(null);
          }
        }}
        onConfirm={() => {
          if (pendingDeleteIndex === null) {
            return;
          }

          updateOffices(
            offices.filter((_, officeIndex) => officeIndex !== pendingDeleteIndex),
          );
          setPendingDeleteIndex(null);
        }}
      >
        {pendingOffice ? (
          <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {pendingOffice.name.trim() || `Office ${pendingDeleteIndex! + 1}`}
            </span>{' '}
            will be removed.
          </div>
        ) : null}
      </DeleteConfirmDialog>
    </>
  );
}
