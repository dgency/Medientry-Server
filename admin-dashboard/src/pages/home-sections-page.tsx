import { useEffect } from 'react';
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
import { Switch } from '../components/ui/switch';
import { apiClient, extractApiData, getApiErrorMessage } from '../lib/api-client';
import type { HomeSection } from '../types/app';

type SectionOption = {
  id: string;
  label: string;
};

type SectionCardProps = {
  section: HomeSection;
  options: SectionOption[];
  onSave: (payload: {
    sectionKey: HomeSection['sectionKey'];
    eyebrow: string;
    title: string;
    subtitle: string;
    isEnabled: boolean;
    itemLimit: number | null;
    selectedItemIds: string[];
    content?: {
      primaryButtonText: string;
      primaryButtonUrl: string;
      secondaryButtonText: string;
      secondaryButtonUrl: string;
      backgroundImage: string;
    };
  }) => Promise<void>;
};

type HomeSectionContentValues = {
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  backgroundImage: string;
};

type HomeSectionFormValues = {
  eyebrow: string;
  title: string;
  subtitle: string;
  isEnabled: boolean;
  itemLimit: number | '';
  selectedItemIds: string[];
  content: HomeSectionContentValues;
};

const sectionMeta: Record<HomeSection['sectionKey'], { title: string; description: string }> = {
  choose_your_path: {
    title: 'Choose Your Path',
    description: 'Curate study destination cards shown on the homepage.',
  },
  featured_medical_colleges: {
    title: 'Featured Medical Colleges',
    description: 'Control featured college cards and ordering.',
  },
  success_stories: {
    title: 'Success Stories',
    description: 'Highlight student reviews and testimonials.',
  },
  latest_blogs: {
    title: 'Latest Blogs',
    description: 'Set how many knowledge hub articles appear on the homepage.',
  },
  notices: {
    title: 'Notices',
    description: 'Pinned notices remain first and can be manually curated here.',
  },
  homepage_cta: {
    title: 'Homepage CTA',
    description: 'Manage the full-width consultation banner above the footer.',
  },
};

function HomeSectionCard({ section, options, onSave }: SectionCardProps) {
  const sectionContent = (section.content ?? {}) as Record<string, unknown>;
  const isCtaSection = section.sectionKey === 'homepage_cta';
  const meta = sectionMeta[section.sectionKey];
  const itemLimitLabel =
    section.sectionKey === 'success_stories'
      ? 'Number of Success Stories to Show'
      : section.sectionKey === 'featured_medical_colleges'
        ? 'Number of Featured Medical Colleges to Show'
      : 'Item Limit';
  const itemLimitDescription =
    section.sectionKey === 'success_stories'
      ? 'Homepage slider will show this many active and homepage-visible stories.'
      : section.sectionKey === 'featured_medical_colleges'
        ? 'Homepage will show this many active and featured medical colleges.'
      : null;
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<HomeSectionFormValues>({
    defaultValues: {
      eyebrow: section.eyebrow ?? '',
      title: section.title ?? '',
      subtitle: section.subtitle ?? '',
      isEnabled: section.isEnabled,
      itemLimit: section.itemLimit ?? '',
      selectedItemIds: section.selectedItemIds,
      content: {
        primaryButtonText: String(sectionContent.primaryButtonText ?? ''),
        primaryButtonUrl: String(sectionContent.primaryButtonUrl ?? ''),
        secondaryButtonText: String(sectionContent.secondaryButtonText ?? ''),
        secondaryButtonUrl: String(sectionContent.secondaryButtonUrl ?? ''),
        backgroundImage: String(sectionContent.backgroundImage ?? ''),
      },
    },
  });

  useEffect(() => {
    reset({
      eyebrow: section.eyebrow ?? '',
      title: section.title ?? '',
      subtitle: section.subtitle ?? '',
      isEnabled: section.isEnabled,
      itemLimit: section.itemLimit ?? '',
      selectedItemIds: section.selectedItemIds,
      content: {
        primaryButtonText: String(sectionContent.primaryButtonText ?? ''),
        primaryButtonUrl: String(sectionContent.primaryButtonUrl ?? ''),
        secondaryButtonText: String(sectionContent.secondaryButtonText ?? ''),
        secondaryButtonUrl: String(sectionContent.secondaryButtonUrl ?? ''),
        backgroundImage: String(sectionContent.backgroundImage ?? ''),
      },
    });
  }, [reset, section, sectionContent.backgroundImage, sectionContent.primaryButtonText, sectionContent.primaryButtonUrl, sectionContent.secondaryButtonText, sectionContent.secondaryButtonUrl]);

  const selectedItemIds = watch('selectedItemIds');
  const isEnabled = watch('isEnabled');

  const toggleSelected = (id: string) => {
    const nextValues = selectedItemIds.includes(id)
      ? selectedItemIds.filter((itemId) => itemId !== id)
      : [...selectedItemIds, id];

    setValue('selectedItemIds', nextValues, { shouldDirty: true });
  };

  const submit = handleSubmit(async (values) => {
    await onSave({
      sectionKey: section.sectionKey,
      eyebrow: values.eyebrow,
      title: values.title,
      subtitle: values.subtitle,
      isEnabled: values.isEnabled,
      itemLimit: values.itemLimit === '' ? null : Number(values.itemLimit),
      selectedItemIds: values.selectedItemIds,
      content: isCtaSection
        ? {
            primaryButtonText: values.content.primaryButtonText,
            primaryButtonUrl: values.content.primaryButtonUrl,
            secondaryButtonText: values.content.secondaryButtonText,
            secondaryButtonUrl: values.content.secondaryButtonUrl,
            backgroundImage: values.content.backgroundImage,
          }
        : undefined,
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{meta.title}</CardTitle>
        <CardDescription>{meta.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          <div className="field-grid">
            {!isCtaSection ? (
              <div className="space-y-2">
                <Label htmlFor={`${section.sectionKey}-eyebrow`}>Eyebrow</Label>
                <Input id={`${section.sectionKey}-eyebrow`} {...register('eyebrow')} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor={`${section.sectionKey}-title`}>Title</Label>
              <Input id={`${section.sectionKey}-title`} {...register('title')} />
            </div>
            {!isCtaSection ? (
              <div className="space-y-2">
                <Label htmlFor={`${section.sectionKey}-itemLimit`}>{itemLimitLabel}</Label>
                <Input id={`${section.sectionKey}-itemLimit`} type="number" min={1} {...register('itemLimit')} />
                {itemLimitDescription ? (
                  <p className="text-xs text-muted-foreground">{itemLimitDescription}</p>
                ) : null}
              </div>
            ) : null}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor={`${section.sectionKey}-subtitle`}>Subtitle</Label>
              <Input id={`${section.sectionKey}-subtitle`} {...register('subtitle')} />
            </div>
            {isCtaSection ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`${section.sectionKey}-primaryButtonText`}>Primary Button Text</Label>
                  <Input id={`${section.sectionKey}-primaryButtonText`} {...register('content.primaryButtonText')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${section.sectionKey}-primaryButtonUrl`}>Primary Button URL</Label>
                  <Input
                    id={`${section.sectionKey}-primaryButtonUrl`}
                    placeholder="/contact"
                    {...register('content.primaryButtonUrl')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${section.sectionKey}-secondaryButtonText`}>Secondary Button Text</Label>
                  <Input id={`${section.sectionKey}-secondaryButtonText`} {...register('content.secondaryButtonText')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${section.sectionKey}-secondaryButtonUrl`}>Secondary Button URL</Label>
                  <Input
                    id={`${section.sectionKey}-secondaryButtonUrl`}
                    placeholder="https://wa.me/..."
                    {...register('content.secondaryButtonUrl')}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Background Image</Label>
                  <Controller
                    name="content.backgroundImage"
                    control={control}
                    render={({ field }) => (
                      <FileUploadField
                        value={String(field.value ?? '')}
                        onChange={field.onChange}
                        uploadKind="image"
                        placeholder="/images/footerbg.jpeg"
                        previewLabel="Preview CTA background"
                      />
                    )}
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Section visibility</p>
              <p className="text-xs text-muted-foreground">Toggle this section on or off for the homepage.</p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={(checked) => setValue('isEnabled', checked)} />
          </div>

          {!isCtaSection ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Manual selection</p>
                <p className="text-xs text-muted-foreground">
                  Select specific items to feature. Leave everything unchecked to use automatic ordering.
                </p>
              </div>

              {options.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No selectable items available yet.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {options.map((option) => {
                    const checked = selectedItemIds.includes(option.id);

                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                          checked ? 'border-primary/40 bg-primary/5' : 'border-border bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-border text-primary"
                          checked={checked}
                          onChange={() => toggleSelected(option.id)}
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save section'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function HomeSectionsPage() {
  const sectionsQuery = useQuery({
    queryKey: ['home-sections'],
    queryFn: async () => {
      const response = await apiClient.get('/home-sections');
      return extractApiData<HomeSection[]>(response);
    },
  });

  const sourceOptionsQuery = useQuery({
    queryKey: ['home-section-options'],
    queryFn: async () => {
      const [destinationsResponse, collegesResponse, storiesResponse, blogsResponse, noticesResponse] =
        await Promise.all([
          apiClient.get('/study-destinations'),
          apiClient.get('/medical-colleges'),
          apiClient.get('/success-stories'),
          apiClient.get('/blogs?pageSize=50'),
          apiClient.get('/notices'),
        ]);

      return {
        choose_your_path: (extractApiData<Array<{ id: string; title: string }>>(destinationsResponse) ?? []).map(
          (item) => ({ id: item.id, label: item.title }),
        ),
        featured_medical_colleges: (
          extractApiData<Array<{ id: string; name: string }>>(collegesResponse) ?? []
        ).map((item) => ({ id: item.id, label: item.name })),
        success_stories: (
          extractApiData<Array<{ id: string; studentName: string; university?: string }>>(storiesResponse) ?? []
        ).map((item) => ({
          id: item.id,
          label: `${item.studentName}${item.university ? ` - ${item.university}` : ''}`,
        })),
        latest_blogs: (extractApiData<{ items: Array<{ id: string; title: string }> }>(blogsResponse).items ?? []).map(
          (item) => ({ id: item.id, label: item.title }),
        ),
        notices: (extractApiData<Array<{ id: string; title: string }>>(noticesResponse) ?? []).map((item) => ({
          id: item.id,
          label: item.title,
        })),
        homepage_cta: [],
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      sectionKey: HomeSection['sectionKey'];
      eyebrow: string;
      title: string;
      subtitle: string;
      isEnabled: boolean;
      itemLimit: number | null;
      selectedItemIds: string[];
      content?: {
        primaryButtonText: string;
        primaryButtonUrl: string;
        secondaryButtonText: string;
        secondaryButtonUrl: string;
        backgroundImage: string;
      };
    }) => {
      const response = await apiClient.put(`/home-sections/${payload.sectionKey}`, {
        eyebrow: payload.eyebrow,
        title: payload.title,
        subtitle: payload.subtitle,
        content: payload.content,
        isEnabled: payload.isEnabled,
        itemLimit: payload.itemLimit,
        selectedItemIds: payload.selectedItemIds,
      });

      return extractApiData(response);
    },
    onSuccess: () => {
      toast.success('Home section updated successfully.');
      void sectionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  if (sectionsQuery.isLoading || sourceOptionsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[240px] items-center justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (sectionsQuery.isError) {
    return <EmptyState title="Could not load home sections" description={getApiErrorMessage(sectionsQuery.error)} />;
  }

  if (sourceOptionsQuery.isError) {
    return <EmptyState title="Could not load section options" description={getApiErrorMessage(sourceOptionsQuery.error)} />;
  }

  return (
    <div className="space-y-6">
      <Card className="page-frame border-none">
        <CardHeader>
          <CardTitle className="text-2xl">Home Sections</CardTitle>
          <CardDescription>
            Enable or disable homepage sections, rename them, control item counts, and manually select featured content.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {sectionsQuery.data?.map((section) => (
          <HomeSectionCard
            key={section.sectionKey}
            section={section}
            options={sourceOptionsQuery.data?.[section.sectionKey] ?? []}
            onSave={async (payload) => {
              await saveMutation.mutateAsync(payload);
            }}
          />
        ))}
      </div>
    </div>
  );
}
