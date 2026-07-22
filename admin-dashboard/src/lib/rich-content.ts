import sanitizeHtml from 'sanitize-html';

export type RichContentStorageMode = 'json-object' | 'json-loose' | 'string-html';

export type ParsedStoredContent = {
  format:
    | 'empty'
    | 'html-string'
    | 'plain-text'
    | 'json-object'
    | 'json-array'
    | 'json-string';
  html: string;
  isEmpty: boolean;
  normalizedValue: unknown;
  parseError: string | null;
  sourceText: string;
  supportsVisualEditing: boolean;
};

const richContentFieldKeys = new Set([
  'html',
  'text',
  'content',
  'description',
  'subtitle',
  'title',
  'blocks',
  'items',
  'type',
  'level',
  'ordered',
]);

const sanitizerConfig: sanitizeHtml.IOptions = {
  allowedTags: [
    'a',
    'blockquote',
    'br',
    'code',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'li',
    'ol',
    'p',
    'pre',
    's',
    'span',
    'strong',
    'u',
    'ul',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
    span: ['style'],
    p: ['style'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    h5: ['style'],
    h6: ['style'],
  },
  allowedStyles: {
    '*': {
      'text-align': [/^(left|center|right|justify)$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  disallowedTagsMode: 'discard',
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      rel: 'noopener noreferrer',
      target: '_blank',
    }),
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const stripHtml = (value: string) =>
  value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const toParagraphHtml = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br />')}</p>`)
    .join('');
};

const getContentBlockText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    const blocks = value
      .map((item) => getContentBlockText(item))
      .filter((item): item is string => Boolean(item));

    return blocks.length > 0 ? blocks.join(' ') : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of ['text', 'content', 'description', 'subtitle', 'title', 'html']) {
    const candidate = readString(value[key]);
    if (candidate) {
      return candidate;
    }
  }

  return null;
};

const stringifySourceValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
};

const looksLikePendingJson = (value: string) => /^[\[{"]/.test(value.trim());

const countStructuredKeys = (value: unknown) => {
  if (!isRecord(value)) {
    return 0;
  }

  return Object.keys(value).filter((key) => !richContentFieldKeys.has(key)).length;
};

export const sanitizeRichContentHtml = (value: string) =>
  sanitizeHtml(value, sanitizerConfig).trim();

export const richContentToHtml = (value: unknown): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return '';
    }

    if (trimmed.includes('<') && trimmed.includes('>')) {
      return sanitizeRichContentHtml(value);
    }

    try {
      return richContentToHtml(JSON.parse(trimmed));
    } catch {
      return toParagraphHtml(value);
    }
  }

  if (Array.isArray(value)) {
    return sanitizeRichContentHtml(
      value
        .map((item) => richContentToHtml(item))
        .filter(Boolean)
        .join(''),
    );
  }

  if (!isRecord(value)) {
    return '';
  }

  const html = readString(value.html);
  if (html) {
    return sanitizeRichContentHtml(html);
  }

  const text =
    readString(value.text) ??
    readString(value.content) ??
    readString(value.description);
  const title = readString(value.title);
  const type = readString(value.type)?.toLowerCase();
  const items = Array.isArray(value.items) ? value.items : [];
  const blocks: string[] = [];

  if (type === 'heading' && text) {
    const level = Math.min(6, Math.max(1, Number(value.level) || 2));
    return sanitizeRichContentHtml(`<h${level}>${escapeHtml(text)}</h${level}>`);
  }

  if (type === 'list' && items.length > 0) {
    const tag = value.ordered ? 'ol' : 'ul';
    const children = items
      .map((item) => getContentBlockText(item))
      .filter((item): item is string => Boolean(item))
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');

    return sanitizeRichContentHtml(`<${tag}>${children}</${tag}>`);
  }

  if (type === 'image') {
    const src = readString(value.url) ?? readString(value.src);
    if (!src) {
      return '';
    }

    const alt = readString(value.alt) ?? title ?? 'Content image';
    return sanitizeRichContentHtml(
      `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`,
    );
  }

  if (title) {
    blocks.push(`<h2>${escapeHtml(title)}</h2>`);
  }

  if (text) {
    blocks.push(
      text.includes('<') && text.includes('>')
        ? text
        : `<p>${escapeHtml(text)}</p>`,
    );
  }

  if (isRecord(value.blocks) || Array.isArray(value.blocks)) {
    blocks.push(richContentToHtml(value.blocks));
  }

  return sanitizeRichContentHtml(blocks.join(''));
};

export const normalizeContentValue = (
  value: unknown,
  storageMode: RichContentStorageMode,
): unknown => {
  if (storageMode === 'string-html') {
    return typeof value === 'string' ? value : richContentToHtml(value);
  }

  if (value === null || value === undefined || value === '') {
    return storageMode === 'json-object' ? {} : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return storageMode === 'json-object' ? {} : null;
    }

    try {
      return normalizeContentValue(JSON.parse(trimmed), storageMode);
    } catch {
      return { html: value };
    }
  }

  if (Array.isArray(value)) {
    return storageMode === 'json-object' ? { blocks: value } : value;
  }

  if (isRecord(value)) {
    return { ...value };
  }

  return { html: String(value) };
};

export const serializeEditorContent = ({
  html,
  storageMode,
  currentValue,
}: {
  html: string;
  storageMode: RichContentStorageMode;
  currentValue: unknown;
}) => {
  const sanitizedHtml = sanitizeRichContentHtml(html);

  if (storageMode === 'string-html') {
    return sanitizedHtml;
  }

  const normalizedCurrentValue = normalizeContentValue(currentValue, storageMode);

  if (storageMode === 'json-object') {
    const nextValue = isRecord(normalizedCurrentValue)
      ? { ...normalizedCurrentValue }
      : {};

    if (sanitizedHtml) {
      nextValue.html = sanitizedHtml;
    } else {
      delete nextValue.html;
    }

    return nextValue;
  }

  if (isRecord(normalizedCurrentValue)) {
    const nextValue = { ...normalizedCurrentValue };

    if (sanitizedHtml) {
      nextValue.html = sanitizedHtml;
    } else {
      delete nextValue.html;
    }

    return Object.keys(nextValue).length > 0 ? nextValue : null;
  }

  return sanitizedHtml ? { html: sanitizedHtml } : null;
};

export const validateContentValue = (
  value: unknown,
  storageMode: RichContentStorageMode,
) => {
  const normalizedValue = normalizeContentValue(value, storageMode);
  const html = richContentToHtml(normalizedValue);
  const plainText = stripHtml(html);
  const hasVisualContent =
    plainText.length > 0 || /<(img|hr)\b/i.test(html);

  return {
    html,
    isEmpty: !hasVisualContent,
    normalizedValue,
  };
};

export const parseStoredContent = (
  value: unknown,
  storageMode: RichContentStorageMode,
): ParsedStoredContent => {
  const normalizedValue = normalizeContentValue(value, storageMode);
  const html = richContentToHtml(normalizedValue);
  const sourceText = stringifySourceValue(value);
  const sourceFormat =
    value === null || value === undefined || value === ''
      ? 'empty'
      : typeof value === 'string'
        ? (() => {
            const trimmed = value.trim();

            if (!trimmed) {
              return 'empty';
            }

            try {
              const parsed = JSON.parse(trimmed);
              return typeof parsed === 'string' ? 'json-string' : 'html-string';
            } catch {
              return trimmed.includes('<') && trimmed.includes('>')
                ? 'html-string'
                : 'plain-text';
            }
          })()
        : Array.isArray(value)
          ? 'json-array'
          : 'json-object';

  return {
    format: sourceFormat,
    html,
    isEmpty: validateContentValue(normalizedValue, storageMode).isEmpty,
    normalizedValue,
    parseError: null,
    sourceText,
    supportsVisualEditing: sourceFormat !== 'json-array' || countStructuredKeys(value) === 0,
  };
};

export const parseSourceInput = (
  sourceText: string,
  storageMode: RichContentStorageMode,
) => {
  if (storageMode === 'string-html') {
    const normalizedValue = normalizeContentValue(sourceText, storageMode);
    return {
      normalizedValue,
      parseError: null,
      sourceText,
    };
  }

  const trimmed = sourceText.trim();

  if (!trimmed) {
    return {
      normalizedValue: normalizeContentValue('', storageMode),
      parseError: null,
      sourceText,
    };
  }

  if (looksLikePendingJson(sourceText)) {
    try {
      return {
        normalizedValue: normalizeContentValue(JSON.parse(sourceText), storageMode),
        parseError: null,
        sourceText,
      };
    } catch {
      return {
        normalizedValue: null,
        parseError: 'Finish the JSON structure or switch back to Visual mode.',
        sourceText,
      };
    }
  }

  return {
    normalizedValue: normalizeContentValue(sourceText, storageMode),
    parseError: null,
    sourceText,
  };
};
