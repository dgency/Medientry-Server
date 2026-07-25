const collapsePathSlashes = (value: string) => value.replace(/\/{2,}/g, '/');

export const sanitizeMediaFilename = (value?: string | null) => {
  const normalizedValue = (value ?? 'file')
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalizedValue || 'file';
};

export const buildPublicMediaPath = (mediaId: string, filename?: string | null) => {
  const normalizedFilename = sanitizeMediaFilename(filename);
  return collapsePathSlashes(`/api/media/${encodeURIComponent(mediaId)}/${encodeURIComponent(normalizedFilename)}`);
};
