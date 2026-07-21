import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

type SafePrismaDiagnostics = {
  prismaCode: string;
  modelName?: string;
  target?: string[];
  table?: string;
  column?: string;
  databaseCode?: string;
  databaseMessage?: string;
};

export type PrismaHttpErrorShape = {
  statusCode: number;
  message: string;
  code: string;
  diagnostics?: SafePrismaDiagnostics;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const readStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => readString(item))
        .filter((item): item is string => Boolean(item))
    : undefined;

const buildSafeDiagnostics = (
  prismaCode: string,
  meta: unknown,
): SafePrismaDiagnostics | undefined => {
  if (!isRecord(meta)) {
    return { prismaCode };
  }

  const diagnostics: SafePrismaDiagnostics = {
    prismaCode,
  };

  const modelName = readString(meta.modelName);
  const table = readString(meta.table);
  const column = readString(meta.column);
  const databaseCode = readString(meta.code);
  const databaseMessage = readString(meta.message);
  const target = readStringArray(meta.target);

  if (modelName) {
    diagnostics.modelName = modelName;
  }

  if (table) {
    diagnostics.table = table;
  }

  if (column) {
    diagnostics.column = column;
  }

  if (databaseCode) {
    diagnostics.databaseCode = databaseCode;
  }

  if (databaseMessage) {
    diagnostics.databaseMessage = databaseMessage;
  }

  if (target && target.length > 0) {
    diagnostics.target = target;
  }

  return diagnostics;
};

const buildKnownRequestMapping = (
  error: PrismaClientKnownRequestError,
): PrismaHttpErrorShape => {
  const diagnostics = buildSafeDiagnostics(error.code, error.meta);

  switch (error.code) {
    case 'P2002':
      return {
        statusCode: 409,
        message: 'A record with this value already exists.',
        code: error.code,
        diagnostics,
      };
    case 'P2021':
      return {
        statusCode: 500,
        message: 'A required database table is missing.',
        code: error.code,
        diagnostics,
      };
    case 'P2022':
      return {
        statusCode: 500,
        message: 'A required database column is missing.',
        code: error.code,
        diagnostics,
      };
    case 'P2010':
      return {
        statusCode: 500,
        message: 'A required database object is missing or unavailable.',
        code: error.code,
        diagnostics,
      };
    case 'P2003':
    case 'P2011':
    case 'P2012':
    case 'P2013':
    case 'P2019':
      return {
        statusCode: 400,
        message: 'The database rejected the request data.',
        code: error.code,
        diagnostics,
      };
    default:
      return {
        statusCode: 500,
        message: 'Database request failed.',
        code: error.code,
        diagnostics,
      };
  }
};

const buildInitializationMapping = (
  error: PrismaClientInitializationError,
): PrismaHttpErrorShape => {
  const code = error.errorCode ?? 'PRISMA_INIT_ERROR';
  const diagnostics = buildSafeDiagnostics(code, {
    databaseMessage: error.message,
  });

  switch (code) {
    case 'P1000':
      return {
        statusCode: 503,
        message: 'Database authentication failed.',
        code,
        diagnostics,
      };
    case 'P1001':
    case 'P1002':
    case 'P1017':
      return {
        statusCode: 503,
        message: 'Database connection is currently unavailable.',
        code,
        diagnostics,
      };
    default:
      return {
        statusCode: 500,
        message: 'Database initialization failed.',
        code,
        diagnostics,
      };
  }
};

export const mapPrismaErrorToHttp = (
  error: unknown,
): PrismaHttpErrorShape | null => {
  if (error instanceof PrismaClientKnownRequestError) {
    return buildKnownRequestMapping(error);
  }

  if (error instanceof PrismaClientInitializationError) {
    return buildInitializationMapping(error);
  }

  if (error instanceof PrismaClientValidationError) {
    return {
      statusCode: 400,
      message: 'Database validation failed for the request.',
      code: 'PRISMA_VALIDATION_ERROR',
    };
  }

  if (error instanceof PrismaClientRustPanicError) {
    return {
      statusCode: 500,
      message: 'The database engine encountered a fatal error.',
      code: 'PRISMA_RUST_PANIC',
    };
  }

  if (error instanceof PrismaClientUnknownRequestError) {
    return {
      statusCode: 500,
      message: 'An unknown database error occurred.',
      code: 'PRISMA_UNKNOWN_REQUEST_ERROR',
    };
  }

  return null;
};
