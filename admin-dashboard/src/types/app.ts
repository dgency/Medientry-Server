import type { ReactNode } from 'react';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type UploadKind = 'image' | 'document' | 'videoThumbnail';
export type ResourceFormMode = 'create' | 'edit';

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'textarea'
  | 'number'
  | 'select'
  | 'switch'
  | 'json'
  | 'keywords'
  | 'url'
  | 'datetime-local'
  | 'admission-process-cards'
  | 'study-abroad-cards';

type ResourceFieldCondition = (
  values: Record<string, unknown>,
  mode: ResourceFormMode,
) => boolean;

export type ResourceField = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  requiredOnCreate?: boolean;
  options?: SelectOption[];
  min?: number;
  max?: number;
  rows?: number;
  colSpan?: 1 | 2;
  omitIfEmptyOnUpdate?: boolean;
  uploadKind?: UploadKind;
  accept?: string;
  previewable?: boolean;
  previewLabel?: string;
  visible?: ResourceFieldCondition;
  requiredWhen?: ResourceFieldCondition;
  validate?: (
    value: unknown,
    values: Record<string, unknown>,
    mode: ResourceFormMode,
  ) => string | undefined;
};

export type ResourceColumn<TItem> = {
  key: string;
  label: string;
  className?: string;
  render: (item: TItem) => ReactNode;
};

export type ResourceConfig<TItem extends { id: string }> = {
  key: string;
  title: string;
  singular: string;
  description: string;
  endpoint: string;
  listEndpoint?: string;
  updateMethod?: 'put' | 'patch';
  slugSourceField?: string;
  slugField?: string;
  previewUrlBuilder?: (item: TItem) => string | null;
  statusToggle?: {
    fieldName: string;
    activeValue: string;
    inactiveValue: string;
  };
  createButtonLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  fields: ResourceField[];
  columns: ResourceColumn<TItem>[];
  defaultValues: Record<string, unknown>;
  getSearchText: (item: TItem) => string;
  getEditValues?: (item: TItem) => Record<string, unknown>;
  buildPayload?: (
    values: Record<string, unknown>,
    mode: 'create' | 'edit',
  ) => Record<string, unknown>;
  getListItems?: (payload: unknown) => TItem[];
};

export type HomeSection = {
  sectionKey:
    | 'choose_your_path'
    | 'featured_medical_colleges'
    | 'success_stories'
    | 'latest_blogs'
    | 'notices'
    | 'homepage_cta';
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown> | null;
  selectedItemIds: string[];
  itemLimit: number | null;
  isEnabled: boolean;
  items: Array<Record<string, unknown>>;
};
