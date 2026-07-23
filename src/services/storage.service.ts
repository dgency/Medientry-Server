import { randomUUID } from 'node:crypto';
import { mkdir, access, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { env } from '../config/env';
import { uploadsRootDirectory } from '../config/upload';
import { resolvePublicMediaUrl } from '../utils/media-path';

type SaveFileInput = {
  buffer: Buffer;
  folder: string;
  extension: string;
  mimeType?: string;
  originalName?: string;
  cacheControl?: string;
  storageKey?: string;
};

export type StoredFile = {
  filename: string;
  absolutePath: string | null;
  relativePath: string;
  publicPath: string;
  storageKey: string;
  provider: 'local' | 'spaces';
};

export interface StorageAdapter {
  readonly driver: 'local' | 'spaces';
  save(input: SaveFileInput): Promise<StoredFile>;
  remove(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
  getPublicUrl(storageKey: string): string;
  getHealthStatus(): Promise<{
    driver: 'local' | 'spaces';
    configured: boolean;
    writable: boolean | null;
    bucketAccessible: boolean | null;
    publicBaseUrl: string | null;
  }>;
}

const sanitizeFilenameBase = (value?: string | null) => {
  const normalizedValue = (value ?? '')
    .replace(/\.[a-z0-9]+$/i, '')
    .normalize('NFKD')
    .replace(/[^\w\s-]+/g, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalizedValue.slice(0, 60) || 'file';
};

const buildStorageKey = ({
  folder,
  extension,
  originalName,
}: Pick<SaveFileInput, 'folder' | 'extension' | 'originalName'>) => {
  const safeExtension = extension.startsWith('.') ? extension : `.${extension}`;
  const safeBaseName = sanitizeFilenameBase(originalName);

  return path.posix.join(
    folder.replace(/^\/+|\/+$/g, ''),
    `${Date.now()}-${randomUUID()}-${safeBaseName}${safeExtension.toLowerCase()}`,
  );
};

const normalizeStorageKey = (storageKey: string) =>
  storageKey.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/');

const resolveLocalAbsolutePath = (storageKey: string) => {
  const normalizedStorageKey = storageKey.replace(/^[/\\]+/, '');
  const absolutePath = path.resolve(uploadsRootDirectory, normalizedStorageKey);
  const relativeToRoot = path.relative(uploadsRootDirectory, absolutePath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error(`Refusing to access media outside the upload directory: ${storageKey}`);
  }

  return absolutePath;
};

const buildLocalPublicPath = (storageKey: string) =>
  resolvePublicMediaUrl(`/uploads/${normalizeStorageKey(storageKey)}`)
  ?? `/uploads/${normalizeStorageKey(storageKey)}`;

class LocalStorageAdapter implements StorageAdapter {
  public readonly driver = 'local' as const;

  public async save(input: SaveFileInput): Promise<StoredFile> {
    const storageKey = input.storageKey ? normalizeStorageKey(input.storageKey) : buildStorageKey(input);
    const absolutePath = resolveLocalAbsolutePath(storageKey);
    const directoryPath = path.dirname(absolutePath);
    await mkdir(directoryPath, { recursive: true });

    await writeFile(absolutePath, input.buffer);
    const filename = path.posix.basename(storageKey);

    return {
      filename,
      absolutePath,
      relativePath: storageKey,
      publicPath: buildLocalPublicPath(storageKey),
      storageKey,
      provider: this.driver,
    };
  }

  public async remove(storageKey: string): Promise<void> {
    const absolutePath = resolveLocalAbsolutePath(storageKey);
    await rm(absolutePath, { force: true });
  }

  public async exists(storageKey: string): Promise<boolean> {
    try {
      await access(resolveLocalAbsolutePath(storageKey));
      return true;
    } catch {
      return false;
    }
  }

  public getPublicUrl(storageKey: string): string {
    return buildLocalPublicPath(storageKey);
  }

  public async getHealthStatus() {
    try {
      await access(uploadsRootDirectory);

      return {
        driver: this.driver,
        configured: true,
        writable: true,
        bucketAccessible: null,
        publicBaseUrl: resolvePublicMediaUrl('/uploads')?.replace(/\/uploads$/, '') ?? null,
      };
    } catch {
      return {
        driver: this.driver,
        configured: true,
        writable: false,
        bucketAccessible: null,
        publicBaseUrl: resolvePublicMediaUrl('/uploads')?.replace(/\/uploads$/, '') ?? null,
      };
    }
  }
}

class DigitalOceanSpacesStorageAdapter implements StorageAdapter {
  public readonly driver = 'spaces' as const;

  private readonly client = new S3Client({
    region: env.SPACES_REGION,
    endpoint: env.SPACES_ENDPOINT,
    forcePathStyle: false,
    credentials: {
      accessKeyId: env.SPACES_ACCESS_KEY ?? '',
      secretAccessKey: env.SPACES_SECRET_KEY ?? '',
    },
  });

  private readonly bucketName = env.SPACES_BUCKET ?? '';
  private readonly publicBaseUrl = (env.SPACES_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');

  public async save(input: SaveFileInput): Promise<StoredFile> {
    const storageKey = input.storageKey ? normalizeStorageKey(input.storageKey) : buildStorageKey(input);
    const filename = path.posix.basename(storageKey);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        Body: input.buffer,
        ContentType: input.mimeType ?? 'application/octet-stream',
        CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable',
      }),
    );

    return {
      filename,
      absolutePath: null,
      relativePath: storageKey,
      publicPath: `${this.publicBaseUrl}/${storageKey}`,
      storageKey,
      provider: this.driver,
    };
  }

  public async remove(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: normalizeStorageKey(storageKey),
      }),
    );
  }

  public async exists(storageKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: normalizeStorageKey(storageKey),
        }),
      );

      return true;
    } catch {
      return false;
    }
  }

  public getPublicUrl(storageKey: string): string {
    return `${this.publicBaseUrl}/${normalizeStorageKey(storageKey)}`;
  }

  public async getHealthStatus() {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucketName,
        }),
      );

      return {
        driver: this.driver,
        configured: Boolean(
          env.SPACES_REGION
          && env.SPACES_ENDPOINT
          && env.SPACES_BUCKET
          && env.SPACES_ACCESS_KEY
          && env.SPACES_SECRET_KEY
          && env.SPACES_PUBLIC_BASE_URL,
        ),
        writable: null,
        bucketAccessible: true,
        publicBaseUrl: this.publicBaseUrl || null,
      };
    } catch {
      return {
        driver: this.driver,
        configured: Boolean(
          env.SPACES_REGION
          && env.SPACES_ENDPOINT
          && env.SPACES_BUCKET
          && env.SPACES_ACCESS_KEY
          && env.SPACES_SECRET_KEY
          && env.SPACES_PUBLIC_BASE_URL,
        ),
        writable: null,
        bucketAccessible: false,
        publicBaseUrl: this.publicBaseUrl || null,
      };
    }
  }
}

const createStorageAdapter = (): StorageAdapter => {
  if (env.STORAGE_DRIVER === 'spaces') {
    console.info('[storage] Using DigitalOcean Spaces storage provider.');
    return new DigitalOceanSpacesStorageAdapter();
  }

  console.info('[storage] Using local filesystem storage provider.', {
    uploadsRootDirectory,
  });
  return new LocalStorageAdapter();
};

export const storageAdapter: StorageAdapter = createStorageAdapter();
