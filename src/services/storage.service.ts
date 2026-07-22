import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { uploadsRootDirectory } from '../config/upload';

type SaveFileInput = {
  buffer: Buffer;
  folder: string;
  extension: string;
};

export type StoredFile = {
  filename: string;
  absolutePath: string;
  relativePath: string;
  publicPath: string;
};

export interface StorageAdapter {
  save(input: SaveFileInput): Promise<StoredFile>;
  remove(relativePath: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  public async save(input: SaveFileInput): Promise<StoredFile> {
    const directoryPath = path.join(uploadsRootDirectory, input.folder);
    await mkdir(directoryPath, { recursive: true });

    const safeExtension = input.extension.startsWith('.') ? input.extension : `.${input.extension}`;
    const filename = `${Date.now()}-${randomUUID()}${safeExtension.toLowerCase()}`;
    const absolutePath = path.join(directoryPath, filename);

    await writeFile(absolutePath, input.buffer);

    const relativePath = path.posix.join(input.folder, filename);

    return {
      filename,
      absolutePath,
      relativePath,
      publicPath: `/uploads/${relativePath}`,
    };
  }

  public async remove(relativePath: string): Promise<void> {
    const normalizedRelativePath = relativePath.replace(/^[/\\]+/, '');
    const absolutePath = path.join(uploadsRootDirectory, normalizedRelativePath);

    await rm(absolutePath, { force: true });
  }
}

export const storageAdapter: StorageAdapter = new LocalStorageAdapter();
