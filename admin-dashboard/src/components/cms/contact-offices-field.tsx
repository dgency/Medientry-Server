import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type ContactOfficeItem = {
  id: string;
  title: string;
  company: string;
  country: string;
  address: string[];
  phone: string;
  phoneHref: string;
  email?: string;
  emailHref?: string;
};

type ContactOfficesFieldProps = {
  value: unknown;
  onChange: (value: ContactOfficeItem[]) => void;
};

const defaultOffice = (index: number): ContactOfficeItem => ({
  id: `office-${index + 1}`,
  title: '',
  company: '',
  country: '',
  address: [''],
  phone: '',
  phoneHref: '',
  email: '',
  emailHref: '',
});

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item : ''))
    : [''];

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
      return {
        id:
          typeof candidate.id === 'string' && candidate.id.trim().length > 0
            ? candidate.id
            : `office-${index + 1}`,
        title: typeof candidate.title === 'string' ? candidate.title : '',
        company: typeof candidate.company === 'string' ? candidate.company : '',
        country: typeof candidate.country === 'string' ? candidate.country : '',
        address: normalizeStringArray(candidate.address),
        phone: typeof candidate.phone === 'string' ? candidate.phone : '',
        phoneHref: typeof candidate.phoneHref === 'string' ? candidate.phoneHref : '',
        email: typeof candidate.email === 'string' ? candidate.email : '',
        emailHref: typeof candidate.emailHref === 'string' ? candidate.emailHref : '',
      };
    })
    .filter((item): item is ContactOfficeItem => Boolean(item))
    .map((office, index) => ({
      ...office,
      id: office.id || `office-${index + 1}`,
      address: office.address.length > 0 ? office.address : [''],
    }));
};

export function ContactOfficesField({
  value,
  onChange,
}: ContactOfficesFieldProps) {
  const offices = normalizeOffices(value);

  const updateOffices = (nextOffices: ContactOfficeItem[]) => {
    onChange(nextOffices.map((office, index) => ({
      ...office,
      id: office.id.trim() || `office-${index + 1}`,
      address: office.address.length > 0 ? office.address : [''],
    })));
  };

  const updateOffice = (index: number, patch: Partial<ContactOfficeItem>) => {
    updateOffices(offices.map((office, officeIndex) => (officeIndex === index ? { ...office, ...patch } : office)));
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

  const updateAddressLine = (officeIndex: number, lineIndex: number, nextValue: string) => {
    const nextAddress = offices[officeIndex].address.map((line, index) =>
      index === lineIndex ? nextValue : line,
    );
    updateOffice(officeIndex, { address: nextAddress });
  };

  const addAddressLine = (officeIndex: number) => {
    updateOffice(officeIndex, {
      address: [...offices[officeIndex].address, ''],
    });
  };

  const moveAddressLine = (officeIndex: number, lineIndex: number, direction: -1 | 1) => {
    const nextIndex = lineIndex + direction;
    const nextAddress = [...offices[officeIndex].address];

    if (nextIndex < 0 || nextIndex >= nextAddress.length) {
      return;
    }

    const [item] = nextAddress.splice(lineIndex, 1);
    nextAddress.splice(nextIndex, 0, item);
    updateOffice(officeIndex, { address: nextAddress });
  };

  const removeAddressLine = (officeIndex: number, lineIndex: number) => {
    const nextAddress = offices[officeIndex].address.filter((_, index) => index !== lineIndex);
    updateOffice(officeIndex, { address: nextAddress.length > 0 ? nextAddress : [''] });
  };

  return (
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
          Add office
        </Button>
      </div>

      {offices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          No office cards yet. Add an office to populate this section.
        </div>
      ) : null}

      <div className="space-y-4">
        {offices.map((office, index) => (
          <div key={`${office.id}-${index}`} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Office {index + 1}</p>
                <p className="text-xs text-muted-foreground">{office.id}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => moveOffice(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => moveOffice(index, 1)} disabled={index === offices.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => updateOffices(offices.filter((_, officeIndex) => officeIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Office ID</Label>
                <Input value={office.id} onChange={(event) => updateOffice(index, { id: event.target.value })} placeholder={`office-${index + 1}`} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={office.country} onChange={(event) => updateOffice(index, { country: event.target.value })} placeholder="Bangladesh" />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={office.title} onChange={(event) => updateOffice(index, { title: event.target.value })} placeholder="Bangladesh Office" />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={office.company} onChange={(event) => updateOffice(index, { company: event.target.value })} placeholder="Medientry Bangladesh" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={office.phone} onChange={(event) => updateOffice(index, { phone: event.target.value })} placeholder="+880 1713 456 910" />
              </div>
              <div className="space-y-2">
                <Label>Phone Link</Label>
                <Input value={office.phoneHref} onChange={(event) => updateOffice(index, { phoneHref: event.target.value })} placeholder="tel:+8801713456910" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={office.email ?? ''} onChange={(event) => updateOffice(index, { email: event.target.value })} placeholder="info@medientrybd.com" />
              </div>
              <div className="space-y-2">
                <Label>Email Link</Label>
                <Input value={office.emailHref ?? ''} onChange={(event) => updateOffice(index, { emailHref: event.target.value })} placeholder="mailto:info@medientrybd.com" />
              </div>

              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Address Lines</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addAddressLine(index)}>
                    <Plus className="h-4 w-4" />
                    Add line
                  </Button>
                </div>

                <div className="space-y-3">
                  {office.address.map((line, lineIndex) => (
                    <div key={`${office.id}-${lineIndex}`} className="rounded-xl border border-border/70 bg-white p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground">Address line {lineIndex + 1}</p>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => moveAddressLine(index, lineIndex, -1)} disabled={lineIndex === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => moveAddressLine(index, lineIndex, 1)} disabled={lineIndex === office.address.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeAddressLine(index, lineIndex)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Input value={line} onChange={(event) => updateAddressLine(index, lineIndex, event.target.value)} placeholder="Office address line" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
