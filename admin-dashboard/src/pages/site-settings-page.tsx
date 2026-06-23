import { useEffect, type ChangeEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { FileUploadField } from '../components/cms/file-upload-field';
import { EmptyState } from '../components/ui/empty-state';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Spinner } from '../components/ui/spinner';
import { Textarea } from '../components/ui/textarea';
import { apiClient, extractApiData, getApiErrorMessage } from '../lib/api-client';

type SiteSettingsFormValues = {
  logoLight: string;
  logoDark: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  phone: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
};

const fallbackColorValues = {
  primaryColor: '#186839',
  secondaryColor: '#f4f6f4',
  accentColor: '#c61022',
  textColor: '#15281f',
} satisfies Pick<
  SiteSettingsFormValues,
  'primaryColor' | 'secondaryColor' | 'accentColor' | 'textColor'
>;

type ColorFieldName = keyof typeof fallbackColorValues;

const defaultValues: SiteSettingsFormValues = {
  logoLight: '',
  logoDark: '',
  favicon: '',
  primaryColor: fallbackColorValues.primaryColor,
  secondaryColor: fallbackColorValues.secondaryColor,
  accentColor: fallbackColorValues.accentColor,
  textColor: fallbackColorValues.textColor,
  phone: '',
  email: '',
  address: '',
  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
};

const isSixDigitHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value.trim());

const expandShortHexColor = (value: string) => {
  if (!/^#[0-9a-fA-F]{3}$/.test(value.trim())) {
    return null;
  }

  const [, r, g, b] = value.trim();
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
};

const hslToHexColor = (value: string) => {
  const match = value
    .trim()
    .match(
      /^hsl\(\s*(-?\d+(?:\.\d+)?)\s*(?:deg)?(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)%(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)%\s*\)$/i,
    );

  if (!match) {
    return null;
  }

  const hue = ((Number(match[1]) % 360) + 360) % 360;
  const saturation = Math.max(0, Math.min(100, Number(match[2]))) / 100;
  const lightness = Math.max(0, Math.min(100, Number(match[3]))) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hueSegment = hue / 60;
  const secondary = chroma * (1 - Math.abs((hueSegment % 2) - 1));
  const matchLightness = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSegment >= 0 && hueSegment < 1) {
    red = chroma;
    green = secondary;
  } else if (hueSegment < 2) {
    red = secondary;
    green = chroma;
  } else if (hueSegment < 3) {
    green = chroma;
    blue = secondary;
  } else if (hueSegment < 4) {
    green = secondary;
    blue = chroma;
  } else if (hueSegment < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  const toHex = (channel: number) =>
    Math.round((channel + matchLightness) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

const normalizeColorValue = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmedValue = value.trim();

  if (isSixDigitHexColor(trimmedValue)) {
    return trimmedValue.toLowerCase();
  }

  const shortHexValue = expandShortHexColor(trimmedValue);
  if (shortHexValue) {
    return shortHexValue;
  }

  const hslHexValue = hslToHexColor(trimmedValue);
  if (hslHexValue) {
    return hslHexValue.toLowerCase();
  }

  return fallback;
};

const toStringValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};

const normalizeSiteSettingsValues = (value?: Partial<SiteSettingsFormValues> | null) => ({
  ...defaultValues,
  logoLight: toStringValue(value?.logoLight).trim(),
  logoDark: toStringValue(value?.logoDark).trim(),
  favicon: toStringValue(value?.favicon).trim(),
  primaryColor: normalizeColorValue(
    value?.primaryColor,
    fallbackColorValues.primaryColor,
  ),
  secondaryColor: normalizeColorValue(
    value?.secondaryColor,
    fallbackColorValues.secondaryColor,
  ),
  accentColor: normalizeColorValue(
    value?.accentColor,
    fallbackColorValues.accentColor,
  ),
  textColor: normalizeColorValue(value?.textColor, fallbackColorValues.textColor),
  phone: toStringValue(value?.phone),
  email: toStringValue(value?.email),
  address: toStringValue(value?.address),
  facebook: toStringValue(value?.facebook),
  instagram: toStringValue(value?.instagram),
  linkedin: toStringValue(value?.linkedin),
  youtube: toStringValue(value?.youtube),
});

const sanitizeSiteSettingsPayload = (values: SiteSettingsFormValues) => {
  const normalizedValues = normalizeSiteSettingsValues(values);

  return {
    logoLight: normalizedValues.logoLight,
    logoDark: normalizedValues.logoDark,
    favicon: normalizedValues.favicon,
    primaryColor: normalizedValues.primaryColor,
    secondaryColor: normalizedValues.secondaryColor,
    accentColor: normalizedValues.accentColor,
    textColor: normalizedValues.textColor,
    phone: normalizedValues.phone.trim(),
    email: normalizedValues.email.trim(),
    address: normalizedValues.address.trim(),
    facebook: normalizedValues.facebook.trim(),
    instagram: normalizedValues.instagram.trim(),
    linkedin: normalizedValues.linkedin.trim(),
    youtube: normalizedValues.youtube.trim(),
  };
};

export function SiteSettingsPage() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<SiteSettingsFormValues>({
    defaultValues,
  });

  const settingsQuery = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/site-settings');
      return extractApiData<Partial<SiteSettingsFormValues>>(response);
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      reset(normalizeSiteSettingsValues(settingsQuery.data));
    }
  }, [reset, settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (values: SiteSettingsFormValues) => {
      const response = await apiClient.put(
        '/site-settings',
        sanitizeSiteSettingsPayload(values),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return extractApiData(response);
    },
    onSuccess: () => {
      toast.success('Site settings updated successfully.');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await updateMutation.mutateAsync(values);
  });

  const handleColorChange =
    (fieldName: ColorFieldName, onChange: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(normalizeColorValue(event.target.value, fallbackColorValues[fieldName]));
    };

  if (settingsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[240px] items-center justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (settingsQuery.isError) {
    return (
      <EmptyState
        title="Could not load site settings"
        description={getApiErrorMessage(settingsQuery.error)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="page-frame border-none">
        <CardHeader>
          <CardTitle className="text-2xl">Site Settings</CardTitle>
          <CardDescription>
            Control logos, colors, contact details, and social links used across
            the frontend.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-6">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="field-grid">
              {[
                ['logoLight', 'Logo Light', 'image'],
                ['logoDark', 'Logo Dark', 'image'],
                ['favicon', 'Favicon', 'image'],
              ].map(([name, label, uploadKind]) => (
                <div key={name} className="md:col-span-2">
                  <div className="space-y-2">
                    <Label htmlFor={name}>{label}</Label>
                    <Controller
                      name={name as keyof SiteSettingsFormValues}
                      control={control}
                      render={({ field }) => (
                        <FileUploadField
                          value={toStringValue(field.value)}
                          onChange={field.onChange}
                          uploadKind={uploadKind as 'image'}
                          previewLabel={`Preview ${label.toLowerCase()}`}
                        />
                      )}
                    />
                  </div>
                </div>
              ))}

              {[
                ['primaryColor', 'Primary Color'],
                ['secondaryColor', 'Secondary Color'],
                ['accentColor', 'Accent Color'],
                ['textColor', 'Text Color'],
              ].map(([name, label]) => (
                <div key={name}>
                  <div className="space-y-2">
                    <Label htmlFor={name}>{label}</Label>
                    <Controller
                      name={name as ColorFieldName}
                      control={control}
                      render={({ field }) => {
                        const fieldName = name as ColorFieldName;
                        const normalizedValue = normalizeColorValue(
                          field.value,
                          fallbackColorValues[fieldName],
                        );

                        return (
                          <div className="flex gap-3">
                            <Input
                              id={name}
                              type="color"
                              className="h-11 w-16 p-1"
                              value={normalizedValue}
                              onChange={handleColorChange(fieldName, field.onChange)}
                            />
                            <Input
                              type="text"
                              className="flex-1"
                              value={normalizedValue}
                              inputMode="text"
                              onChange={handleColorChange(fieldName, field.onChange)}
                            />
                          </div>
                        );
                      }}
                    />
                  </div>
                </div>
              ))}

              {[
                ['phone', 'Phone'],
                ['email', 'Email'],
                ['facebook', 'Facebook'],
                ['instagram', 'Instagram'],
                ['linkedin', 'LinkedIn'],
                ['youtube', 'YouTube'],
              ].map(([name, label]) => (
                <div key={name}>
                  <div className="space-y-2">
                    <Label htmlFor={name}>{label}</Label>
                    <Input
                      id={name}
                      type="text"
                      {...register(name as keyof SiteSettingsFormValues)}
                    />
                  </div>
                </div>
              ))}

              <div className="md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" rows={4} {...register('address')} />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
              >
                {isSubmitting || updateMutation.isPending
                  ? 'Saving...'
                  : 'Save site settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
