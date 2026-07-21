import type { ZodError } from 'zod';

type ZodFieldErrors = Record<string, string[]>;

type ZodErrorDetails = {
  fieldErrors: ZodFieldErrors;
  formErrors: string[];
};

const normalizeIssuePath = (path: ReadonlyArray<PropertyKey>) => {
  const [firstSegment, ...remainingSegments] = path;

  if (
    (firstSegment === 'body' || firstSegment === 'query' || firstSegment === 'params') &&
    remainingSegments.length > 0
  ) {
    return remainingSegments.map(String).join('.');
  }

  return path.map(String).join('.');
};

export const buildZodErrorDetails = (error: ZodError): ZodErrorDetails => {
  const fieldErrors: ZodFieldErrors = {};
  const formErrors: string[] = [];

  for (const issue of error.issues) {
    const normalizedPath = normalizeIssuePath(issue.path);

    if (!normalizedPath) {
      formErrors.push(issue.message);
      continue;
    }

    fieldErrors[normalizedPath] ??= [];
    fieldErrors[normalizedPath].push(issue.message);
  }

  return {
    fieldErrors,
    formErrors,
  };
};
