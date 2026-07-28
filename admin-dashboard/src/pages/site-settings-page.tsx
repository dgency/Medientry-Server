import { useEffect, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { FileUploadField } from '../components/cms/file-upload-field';
import { EmptyState } from '../components/ui/empty-state';
import {
  defaultExchangeRateNoteSettingsValue,
  ExchangeRateNoteSettingsCard,
} from '../components/cms/exchange-rate-note-settings-card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Spinner } from '../components/ui/spinner';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { apiClient, extractApiData, getApiErrorMessage } from '../lib/api-client';

type GoogleTagManagerMode = 'container-id' | 'custom-code';
type GoogleTagManagerEnvironment = 'production' | 'all';
type SiteRedirectRuleFormValue = {
  sourcePath: string;
  destination: string;
  permanent: boolean;
};

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
  exchangeRateUsdToInr: number | null;
  showExchangeRateNote: boolean;
  customExchangeRateNote: string | null;
  exchangeRateUpdatedAt: string | null;
  googleTagManagerEnabled: boolean;
  googleTagManagerMode: GoogleTagManagerMode;
  googleTagManagerId: string;
  googleTagManagerHeadCode: string;
  googleTagManagerBodyCode: string;
  googleTagManagerEnvironment: GoogleTagManagerEnvironment;
  redirectRules: SiteRedirectRuleFormValue[];
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

const defaultRedirectRules: SiteRedirectRuleFormValue[] = [
  {
    sourcePath: '/what-we-do',
    destination: '/why-medientry',
    permanent: true,
  },
  {
    sourcePath: '/colleges-we-represent',
    destination: '/colleges',
    permanent: true,
  },
];

const createEmptyRedirectRule = (): SiteRedirectRuleFormValue => ({
  sourcePath: '',
  destination: '',
  permanent: true,
});

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
  ...defaultExchangeRateNoteSettingsValue(),
  googleTagManagerEnabled: false,
  googleTagManagerMode: 'container-id',
  googleTagManagerId: '',
  googleTagManagerHeadCode: '',
  googleTagManagerBodyCode: '',
  googleTagManagerEnvironment: 'production',
  redirectRules: defaultRedirectRules,
};

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;
const gtmModeOptions: Array<{
  value: GoogleTagManagerMode;
  title: string;
  description: string;
}> = [
  {
    value: 'container-id',
    title: 'Container ID',
    description:
      'Recommended for most teams. Save one GTM container ID and MediEntry will generate the standard head and noscript snippets for you.',
  },
  {
    value: 'custom-code',
    title: 'Custom Code',
    description:
      'Use this only when Google Tag Manager needs fully custom head and body snippets managed by a trusted administrator.',
  },
];
const gtmEnvironmentOptions: Array<{
  value: GoogleTagManagerEnvironment;
  label: string;
  description: string;
}> = [
  {
    value: 'production',
    label: 'Production only',
    description:
      'Loads only on the main production website and stays off localhost, preview, and staging.',
  },
  {
    value: 'all',
    label: 'All environments',
    description:
      'Loads on localhost, preview, staging, and production for end-to-end verification.',
  },
];

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

const normalizeGtmIdValue = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toUpperCase();
};

const normalizeGtmModeValue = (value: unknown): GoogleTagManagerMode =>
  value === 'custom-code' ? 'custom-code' : 'container-id';

const normalizeGtmEnvironmentValue = (
  value: unknown,
): GoogleTagManagerEnvironment => (value === 'all' ? 'all' : 'production');

const toNumberValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeRedirectRulesValue = (
  value: unknown,
): SiteRedirectRuleFormValue[] => {
  if (!Array.isArray(value)) {
    return [...defaultRedirectRules];
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const candidate = item as Partial<SiteRedirectRuleFormValue>;
      const sourcePath = toStringValue(candidate.sourcePath).trim();
      const destination = toStringValue(candidate.destination).trim();

      if (!sourcePath || !destination) {
        return null;
      }

      return {
        sourcePath,
        destination,
        permanent: candidate.permanent !== false,
      };
    })
    .filter((item): item is SiteRedirectRuleFormValue => Boolean(item));

  return items;
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
  exchangeRateUsdToInr: toNumberValue(value?.exchangeRateUsdToInr),
  showExchangeRateNote: value?.showExchangeRateNote === true,
  customExchangeRateNote:
    typeof value?.customExchangeRateNote === 'string'
      ? value.customExchangeRateNote
      : null,
  exchangeRateUpdatedAt:
    typeof value?.exchangeRateUpdatedAt === 'string'
      ? value.exchangeRateUpdatedAt
      : null,
  googleTagManagerEnabled: value?.googleTagManagerEnabled === true,
  googleTagManagerMode: normalizeGtmModeValue(value?.googleTagManagerMode),
  googleTagManagerId: normalizeGtmIdValue(value?.googleTagManagerId),
  googleTagManagerHeadCode: toStringValue(value?.googleTagManagerHeadCode).replace(
    /\r\n?/g,
    '\n',
  ),
  googleTagManagerBodyCode: toStringValue(value?.googleTagManagerBodyCode).replace(
    /\r\n?/g,
    '\n',
  ),
  googleTagManagerEnvironment: normalizeGtmEnvironmentValue(
    value?.googleTagManagerEnvironment,
  ),
  redirectRules: normalizeRedirectRulesValue(value?.redirectRules),
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
    exchangeRateUsdToInr: normalizedValues.exchangeRateUsdToInr,
    showExchangeRateNote: normalizedValues.showExchangeRateNote,
    customExchangeRateNote:
      normalizedValues.customExchangeRateNote?.trim() || null,
    googleTagManagerEnabled: normalizedValues.googleTagManagerEnabled,
    googleTagManagerMode: normalizedValues.googleTagManagerMode,
    googleTagManagerId: normalizedValues.googleTagManagerId.trim(),
    googleTagManagerHeadCode:
      normalizedValues.googleTagManagerHeadCode.trim() || null,
    googleTagManagerBodyCode:
      normalizedValues.googleTagManagerBodyCode.trim() || null,
    googleTagManagerEnvironment: normalizedValues.googleTagManagerEnvironment,
    redirectRules: normalizedValues.redirectRules
      .map((item) => ({
        sourcePath: item.sourcePath.trim(),
        destination: item.destination.trim(),
        permanent: item.permanent !== false,
      }))
      .filter((item) => item.sourcePath.length > 0 || item.destination.length > 0),
  };
};

export function SiteSettingsPage() {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<SiteSettingsFormValues>({
    defaultValues,
  });
  const {
    fields: redirectRuleFields,
    append: appendRedirectRule,
    remove: removeRedirectRule,
  } = useFieldArray({
    control,
    name: 'redirectRules',
  });

  const settingsQuery = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/site-settings');
      return extractApiData<Partial<SiteSettingsFormValues>>(response);
    },
  });
  const exchangeRateUsdToInr = watch('exchangeRateUsdToInr');
  const showExchangeRateNote = watch('showExchangeRateNote');
  const customExchangeRateNote = watch('customExchangeRateNote');
  const exchangeRateUpdatedAt = watch('exchangeRateUpdatedAt');
  const googleTagManagerEnabled = watch('googleTagManagerEnabled');
  const googleTagManagerMode = watch('googleTagManagerMode');
  const googleTagManagerId = watch('googleTagManagerId');
  const googleTagManagerHeadCode = watch('googleTagManagerHeadCode');
  const googleTagManagerBodyCode = watch('googleTagManagerBodyCode');
  const googleTagManagerEnvironment = watch('googleTagManagerEnvironment');
  const hasValidGtmId = GTM_ID_PATTERN.test(normalizeGtmIdValue(googleTagManagerId));

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
      return extractApiData<Partial<SiteSettingsFormValues>>(response);
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['site-settings'], data);
      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      reset(normalizeSiteSettingsValues(data));
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
            Control logos, colors, contact details, exchange-rate guidance, and
            global Google Tag Manager settings used across the public website.
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

              <div className="md:col-span-2">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-xl">URL Redirects</CardTitle>
                    <CardDescription>
                      Manage old or custom URLs and redirect them to the right public page.
                      You can paste full URLs like
                      {' '}
                      <span className="font-mono">https://medientrybd.com/what-we-do/</span>
                      {' '}
                      or simple paths like
                      {' '}
                      <span className="font-mono">/what-we-do</span>
                      .
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {redirectRuleFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:items-end">
                          <div className="space-y-2">
                            <Label htmlFor={`redirectRules.${index}.sourcePath`}>
                              From URL
                            </Label>
                            <Input
                              id={`redirectRules.${index}.sourcePath`}
                              type="text"
                              placeholder="/what-we-do"
                              {...register(`redirectRules.${index}.sourcePath`)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`redirectRules.${index}.destination`}>
                              Redirect To
                            </Label>
                            <Input
                              id={`redirectRules.${index}.destination`}
                              type="text"
                              placeholder="/why-medientry"
                              {...register(`redirectRules.${index}.destination`)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-900">
                              Permanent
                            </Label>
                            <Controller
                              name={`redirectRules.${index}.permanent`}
                              control={control}
                              render={({ field: redirectField }) => (
                                <div className="flex h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3">
                                  <span className="text-sm text-slate-600">
                                    {redirectField.value ? '301/308' : '307'}
                                  </span>
                                  <Switch
                                    checked={redirectField.value}
                                    onCheckedChange={(checked) =>
                                      redirectField.onChange(checked === true)
                                    }
                                  />
                                </div>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeRedirectRule(index)}
                            disabled={redirectRuleFields.length <= 1}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendRedirectRule(createEmptyRedirectRule())}
                      >
                        Add redirect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <ExchangeRateNoteSettingsCard
                  value={{
                    exchangeRateUsdToInr,
                    showExchangeRateNote,
                    customExchangeRateNote,
                    exchangeRateUpdatedAt,
                  }}
                  currentSavedExchangeRateUsdToInr={
                    normalizeSiteSettingsValues(settingsQuery.data).exchangeRateUsdToInr
                  }
                  onChange={(nextValue) => {
                    setValue(
                      'exchangeRateUsdToInr',
                      nextValue.exchangeRateUsdToInr,
                      { shouldDirty: true },
                    );
                    setValue(
                      'showExchangeRateNote',
                      nextValue.showExchangeRateNote,
                      { shouldDirty: true },
                    );
                    setValue(
                      'customExchangeRateNote',
                      nextValue.customExchangeRateNote,
                      { shouldDirty: true },
                    );
                    setValue(
                      'exchangeRateUpdatedAt',
                      nextValue.exchangeRateUpdatedAt,
                      { shouldDirty: false },
                    );
                  }}
                  showMissingRateWarning
                />
              </div>

              <div className="md:col-span-2">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">Google Tag Manager</CardTitle>
                        <CardDescription className="max-w-3xl">
                          Save a GTM container ID or trusted custom GTM snippets
                          once, then load them automatically on every public
                          website page without touching source code again.
                        </CardDescription>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <div className="font-medium text-slate-900">
                          Public website only
                        </div>
                        <div>
                          The dashboard preview never executes GTM scripts.
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold text-slate-900">
                          Enable Google Tag Manager
                        </Label>
                        <p className="text-sm text-slate-600">
                          When disabled, all saved GTM values remain stored but
                          nothing is injected into the public site.
                        </p>
                      </div>
                      <Controller
                        name="googleTagManagerEnabled"
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-600">
                              {field.value ? 'Enabled' : 'Disabled'}
                            </span>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                            />
                          </div>
                        )}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="grid gap-3 lg:grid-cols-2">
                      {gtmModeOptions.map((option) => {
                        const isActive = googleTagManagerMode === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setValue('googleTagManagerMode', option.value, {
                                shouldDirty: true,
                              })
                            }
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              isActive
                                ? 'border-[#c61022]/35 bg-[#c61022]/6 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="mb-1 text-base font-semibold text-slate-900">
                              {option.title}
                            </div>
                            <p className="text-sm leading-6 text-slate-600">
                              {option.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="googleTagManagerId">GTM Container ID</Label>
                        <Input
                          id="googleTagManagerId"
                          type="text"
                          placeholder="GTM-XXXXXXX"
                          {...register('googleTagManagerId')}
                        />
                        <p className="text-sm text-slate-500">
                          Enter a container ID like <span className="font-mono">GTM-ABC1234</span>. This is the recommended setup and is auto-generated into the standard GTM script and noscript code.
                        </p>
                        {googleTagManagerEnabled &&
                        googleTagManagerMode === 'container-id' &&
                        googleTagManagerId.trim().length > 0 &&
                        !hasValidGtmId ? (
                          <p className="text-sm font-medium text-[#c61022]">
                            Use the official GTM format: <span className="font-mono">GTM-ABC1234</span>.
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <Label htmlFor="googleTagManagerEnvironment">
                          Load GTM In
                        </Label>
                        <select
                          id="googleTagManagerEnvironment"
                          className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#c61022]/30 focus:ring-2 focus:ring-[#c61022]/10"
                          value={googleTagManagerEnvironment}
                          onChange={(event) =>
                            setValue(
                              'googleTagManagerEnvironment',
                              normalizeGtmEnvironmentValue(event.target.value),
                              { shouldDirty: true },
                            )
                          }
                        >
                          {gtmEnvironmentOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-sm leading-6 text-slate-600">
                          {
                            gtmEnvironmentOptions.find(
                              (option) => option.value === googleTagManagerEnvironment,
                            )?.description
                          }
                        </p>
                      </div>
                    </div>

                    {googleTagManagerMode === 'custom-code' ? (
                      <div className="space-y-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                            Trusted admins only
                          </div>
                          <p className="text-sm leading-6 text-amber-800">
                            Only paste trusted Google Tag Manager code. Custom
                            scripts can affect website security and performance.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="googleTagManagerHeadCode">
                            GTM Head Code
                          </Label>
                          <Textarea
                            id="googleTagManagerHeadCode"
                            rows={8}
                            className="font-mono text-xs leading-6"
                            placeholder="<script>...</script>"
                            {...register('googleTagManagerHeadCode')}
                          />
                          <p className="text-sm text-slate-600">
                            This code is inserted inside the public website
                            <span className="font-mono"> &lt;head&gt; </span>
                            and should include your main GTM loader snippet.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="googleTagManagerBodyCode">
                            GTM Body Code
                          </Label>
                          <Textarea
                            id="googleTagManagerBodyCode"
                            rows={6}
                            className="font-mono text-xs leading-6"
                            placeholder="<noscript><iframe ...></iframe></noscript>"
                            {...register('googleTagManagerBodyCode')}
                          />
                          <p className="text-sm text-slate-600">
                            This code is inserted immediately after the opening
                            <span className="font-mono"> &lt;body&gt; </span>
                            tag. The body snippet is optional, but the official
                            GTM noscript iframe is recommended.
                          </p>
                          {googleTagManagerEnabled &&
                          googleTagManagerMode === 'custom-code' &&
                          googleTagManagerHeadCode.trim().length === 0 ? (
                            <p className="text-sm font-medium text-[#c61022]">
                              Head code is required when GTM is enabled in Custom Code mode.
                            </p>
                          ) : null}
                          {googleTagManagerEnabled &&
                          googleTagManagerMode === 'custom-code' &&
                          googleTagManagerBodyCode.trim().length === 0 ? (
                            <p className="text-sm text-amber-700">
                              Body code is currently empty. The public site will still load the saved head code, but no noscript fallback iframe will be rendered.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4 text-sm leading-6 text-emerald-900">
                        Container ID mode is active. MediEntry will generate the
                        official GTM head script and body noscript iframe from
                        the saved container ID, so there is no duplicate manual
                        code to maintain.
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Configuration Summary
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {[
                          [
                            'Status',
                            googleTagManagerEnabled ? 'Enabled' : 'Disabled',
                          ],
                          [
                            'Mode',
                            googleTagManagerMode === 'custom-code'
                              ? 'Custom Code'
                              : 'Container ID',
                          ],
                          [
                            'Container ID',
                            googleTagManagerId.trim() || 'Not configured',
                          ],
                          [
                            'Head code configured',
                            googleTagManagerHeadCode.trim() ? 'Yes' : 'No',
                          ],
                          [
                            'Body code configured',
                            googleTagManagerBodyCode.trim() ? 'Yes' : 'No',
                          ],
                          [
                            'Environment',
                            googleTagManagerEnvironment === 'all'
                              ? 'All environments'
                              : 'Production only',
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-white bg-white px-4 py-3 shadow-sm"
                          >
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {label}
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-900">
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
