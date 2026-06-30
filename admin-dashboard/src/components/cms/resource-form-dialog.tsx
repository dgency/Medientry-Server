import { WandSparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { formatLabel, slugify } from '../../lib/utils';
import type { ResourceConfig, ResourceField } from '../../types/app';
import { FileUploadField } from './file-upload-field';
import { JsonEditorField } from './json-editor-field';
import { AdmissionProcessCardsField } from './admission-process-cards-field';
import { StudyAbroadCardsField } from './study-abroad-cards-field';

type ResourceFormDialogProps<TItem extends { id: string }> = {
  config: ResourceConfig<TItem>;
  mode: 'create' | 'edit';
  open: boolean;
  initialValues?: Record<string, unknown>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
};

type FormValues = Record<string, unknown>;

const isEmpty = (value: unknown) =>
  value === '' || value === null || value === undefined || Number.isNaN(value);

export function ResourceFormDialog<TItem extends { id: string }>({
  config,
  mode,
  open,
  initialValues,
  onOpenChange,
  onSubmit,
}: ResourceFormDialogProps<TItem>) {
  const [isSaving, setIsSaving] = useState(false);

  const resolvedDefaultValues = useMemo(
    () => ({
      ...config.defaultValues,
      ...(initialValues ?? {}),
    }),
    [config.defaultValues, initialValues],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { dirtyFields, errors },
  } = useForm<FormValues>({
    defaultValues: resolvedDefaultValues,
  });

  const watchedValues = watch();

  useEffect(() => {
    reset(resolvedDefaultValues);
  }, [reset, resolvedDefaultValues]);

  const slugSourceValue = config.slugSourceField ? watch(config.slugSourceField) : undefined;

  useEffect(() => {
    if (
      mode !== 'create' ||
      !config.slugField ||
      !config.slugSourceField ||
      typeof slugSourceValue !== 'string'
    ) {
      return;
    }

    const nextSlug = slugify(slugSourceValue);

    if (!nextSlug || dirtyFields[config.slugField]) {
      return;
    }

    if (String(getValues(config.slugField) ?? '') !== nextSlug) {
      setValue(config.slugField, nextSlug, { shouldDirty: false });
    }
  }, [config.slugField, config.slugSourceField, dirtyFields, getValues, mode, setValue, slugSourceValue]);

  const submit = handleSubmit(async (values) => {
    setIsSaving(true);

    try {
      await onSubmit(values);
      onOpenChange(false);
      reset(config.defaultValues);
    } finally {
      setIsSaving(false);
    }
  });

  const fieldVisible = (field: ResourceField) =>
    field.visible ? field.visible(watchedValues, mode) : true;

  const fieldRequired = (field: ResourceField) => {
    if (field.requiredWhen) {
      return field.requiredWhen(watchedValues, mode);
    }

    return mode === 'create' ? field.required || field.requiredOnCreate : field.required;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? `Create ${config.singular}` : `Edit ${config.singular}`}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <div className="field-grid">
            {config.fields.map((field) => {
              if (!fieldVisible(field)) {
                return null;
              }

              const error = errors[field.name];
              const required = fieldRequired(field);
              const validateField = (value: unknown) => {
                if (field.validate) {
                  return field.validate(value, getValues(), mode) ?? true;
                }

                return true;
              };

              return (
                <div key={field.name} className={field.colSpan === 2 ? 'md:col-span-2' : undefined}>
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {required ? ' *' : ''}
                    </Label>

                    {field.type === 'admission-process-cards' ? (
                      <Controller
                        name={field.name}
                        control={control}
                        rules={{
                          required: required ? `${field.label} is required.` : false,
                          validate: validateField,
                        }}
                        render={({ field: controllerField }) => (
                          <AdmissionProcessCardsField
                            value={controllerField.value}
                            onChange={controllerField.onChange}
                          />
                        )}
                      />
                    ) : field.type === 'study-abroad-cards' ? (
                      <Controller
                        name={field.name}
                        control={control}
                        rules={{
                          required: required ? `${field.label} is required.` : false,
                          validate: validateField,
                        }}
                        render={({ field: controllerField }) => (
                          <StudyAbroadCardsField
                            value={controllerField.value}
                            onChange={controllerField.onChange}
                          />
                        )}
                      />
                    ) : field.type === 'json' ? (
                      <Controller
                        name={field.name}
                        control={control}
                        rules={{
                          required: required ? `${field.label} is required.` : false,
                          validate: validateField,
                        }}
                        render={({ field: controllerField }) => (
                          <JsonEditorField
                            value={String(controllerField.value ?? '')}
                            onChange={controllerField.onChange}
                            rows={field.rows ?? 5}
                            placeholder={field.placeholder}
                          />
                        )}
                      />
                    ) : field.uploadKind ? (
                      <Controller
                        name={field.name}
                        control={control}
                        rules={{
                          required: required ? `${field.label} is required.` : false,
                          validate: validateField,
                        }}
                        render={({ field: controllerField }) => (
                          <FileUploadField
                            value={String(controllerField.value ?? '')}
                            onChange={controllerField.onChange}
                            uploadKind={field.uploadKind!}
                            accept={field.accept}
                            placeholder={field.placeholder}
                            previewable={field.previewable}
                            previewLabel={field.previewLabel}
                          />
                        )}
                      />
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        rows={field.rows ?? 5}
                        placeholder={field.placeholder}
                        {...register(field.name, {
                          required: required ? `${field.label} is required.` : false,
                          validate: validateField,
                        })}
                      />
                    ) : field.type === 'switch' ? (
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: controllerField }) => (
                          <div className="flex min-h-11 items-center rounded-xl border border-input bg-white px-3">
                            <Switch
                              checked={controllerField.value === true}
                              onCheckedChange={controllerField.onChange}
                            />
                            <span className="ml-3 text-sm text-muted-foreground">
                              {controllerField.value === true ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        )}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={field.name}
                        className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...register(field.name, {
                          required: required ? `${field.label} is required.` : false,
                          validate: validateField,
                        })}
                      >
                        <option value="">Select {formatLabel(field.label)}</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          id={field.name}
                          type={field.type === 'number' ? 'number' : field.type}
                          min={field.min}
                          max={field.max}
                          step={field.type === 'number' ? 'any' : undefined}
                          placeholder={field.placeholder}
                          className="flex-1"
                          {...register(field.name, {
                            required: required ? `${field.label} is required.` : false,
                            validate: validateField,
                            setValueAs:
                              field.type === 'number'
                                ? (value) => (value === '' ? '' : Number(value))
                                : undefined,
                          })}
                        />
                        {config.slugField === field.name && config.slugSourceField ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const sourceValue = String(getValues(config.slugSourceField ?? '') ?? '');
                              const generated = slugify(sourceValue);

                              if (generated) {
                                setValue(field.name, generated, { shouldDirty: true });
                              }
                            }}
                          >
                            <WandSparkles className="h-4 w-4" />
                            Generate
                          </Button>
                        ) : null}
                      </div>
                    )}

                    {field.description ? (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    ) : null}

                    {error ? (
                      <p className="text-xs font-medium text-destructive">
                        {String(error.message ?? `${field.label} is invalid.`)}
                      </p>
                    ) : null}

                    {mode === 'edit' && field.omitIfEmptyOnUpdate && isEmpty(initialValues?.[field.name]) ? (
                      <p className="text-xs text-muted-foreground">Leave blank to keep the current value.</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : mode === 'create' ? `Create ${config.singular}` : `Update ${config.singular}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
